import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  WorkoutRoutine,
  WorkoutSession,
  WorkoutExercise,
  WorkoutSet,
  PersonalRecord,
  WorkoutStats,
  ExerciseProgress,
} from '@/types/workout';

const ROUTINES_KEY = 'workout_routines';
const SESSIONS_KEY = 'workout_sessions';
const ACTIVE_SESSION_KEY = 'active_workout_session';
const PRS_KEY = 'personal_records';
const ALLOWED_PR_TYPES = new Set(['max_weight', 'max_volume']);

// ─── Types ───

interface WorkoutContextValue {
  // Routines
  routines: WorkoutRoutine[];
  createRoutine: (routine: Omit<WorkoutRoutine, 'id' | 'createdAt' | 'updatedAt'>) => WorkoutRoutine;
  updateRoutine: (id: string, update: Partial<WorkoutRoutine>) => void;
  deleteRoutine: (id: string) => void;

  // Sessions
  sessions: WorkoutSession[];
  activeSession: WorkoutSession | null;
  startWorkout: (routineId?: string) => WorkoutSession;
  endWorkout: (notes?: string) => void;
  cancelWorkout: () => void;
  addExerciseToSession: (exerciseId: string, exerciseName: string, gifUrl?: string) => void;
  removeExerciseFromSession: (exerciseId: string) => void;
  addSet: (workoutExerciseId: string, set: Omit<WorkoutSet, 'id' | 'setNumber'>) => void;
  updateSet: (workoutExerciseId: string, setId: string, update: Partial<WorkoutSet>) => void;
  removeSet: (workoutExerciseId: string, setId: string) => void;
  reorderExercises: (exercises: WorkoutExercise[]) => void;

  // Recovery
  hasRecoverableSession: boolean;
  recoverSession: () => void;
  discardRecoverableSession: () => void;

  // Personal Records
  personalRecords: PersonalRecord[];

  // Stats
  getStats: () => WorkoutStats;
  getExerciseProgress: (exerciseId: string) => ExerciseProgress | null;

  // Loading
  isLoaded: boolean;
}

const WorkoutContext = createContext<WorkoutContextValue | undefined>(undefined);

// ─── Helpers ───

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function calculateVolume(exercises: WorkoutExercise[]): number {
  return exercises.reduce((total, ex) => {
    return total + ex.sets.reduce((setTotal, set) => {
      if (set.isWarmup) return setTotal;
      return setTotal + set.weight * set.reps;
    }, 0);
  }, 0);
}

function getLatestCompletedSetsForExercise(
  sessions: WorkoutSession[],
  exerciseId: string
): WorkoutSet[] {
  const latestSession = [...sessions]
    .filter((s) => Boolean(s.completedAt))
    .sort((a, b) =>
      new Date(b.completedAt || 0).getTime() - new Date(a.completedAt || 0).getTime()
    )
    .find((s) => s.exercises.some((e) => e.exerciseId === exerciseId));

  if (!latestSession) return [];

  const exercise = latestSession.exercises.find((e) => e.exerciseId === exerciseId);
  if (!exercise) return [];

  return exercise.sets
    .filter((set) => Boolean(set.completedAt))
    .map((set, index) => ({
      ...set,
      id: generateId(),
      setNumber: index + 1,
      completedAt: undefined,
    }));
}

function getExerciseBestMetricsFromSessions(
  sessions: WorkoutSession[],
  exerciseId: string
) {
  const completedSets = sessions
    .filter((s) => Boolean(s.completedAt))
    .flatMap((s) => s.exercises)
    .filter((ex) => ex.exerciseId === exerciseId)
    .flatMap((ex) => ex.sets)
    .filter((set) => Boolean(set.completedAt) && !set.isWarmup && set.reps > 0);

  if (completedSets.length === 0) {
    return {
      maxWeight: 0,
      maxVolume: 0,
      count: 0,
    };
  }

  const maxVolume = Math.max(...completedSets.map((set) => set.weight * set.reps));

  return {
    maxWeight: Math.max(...completedSets.map((set) => set.weight)),
    maxVolume,
    count: completedSets.length,
  };
}

// ─── Provider ───

export function WorkoutProvider({ children }: { children: React.ReactNode }) {
  const [routines, setRoutines] = useState<WorkoutRoutine[]>([]);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [activeSession, setActiveSession] = useState<WorkoutSession | null>(null);
  const [personalRecords, setPersonalRecords] = useState<PersonalRecord[]>([]);
  const [hasRecoverableSession, setHasRecoverableSession] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const recoverableSession = useRef<WorkoutSession | null>(null);

  // ─── Load Data ───
  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(ROUTINES_KEY),
      AsyncStorage.getItem(SESSIONS_KEY),
      AsyncStorage.getItem(ACTIVE_SESSION_KEY),
      AsyncStorage.getItem(PRS_KEY),
    ]).then(([routinesRaw, sessionsRaw, activeRaw, prsRaw]) => {
      if (routinesRaw) {
        try { setRoutines(JSON.parse(routinesRaw)); } catch {}
      }
      if (sessionsRaw) {
        try { setSessions(JSON.parse(sessionsRaw)); } catch {}
      }
      if (prsRaw) {
        try {
          const parsed = JSON.parse(prsRaw) as PersonalRecord[];
          const filtered = parsed.filter((record) =>
            ALLOWED_PR_TYPES.has(record.type)
          );
          setPersonalRecords(filtered);
          if (filtered.length !== parsed.length) {
            AsyncStorage.setItem(PRS_KEY, JSON.stringify(filtered));
          }
        } catch {}
      }
      // Check for recoverable (crashed) session
      if (activeRaw) {
        try {
          const session = JSON.parse(activeRaw) as WorkoutSession;
          if (session.isActive) {
            recoverableSession.current = session;
            setHasRecoverableSession(true);
          }
        } catch {}
      }
      setIsLoaded(true);
    });
  }, []);

  // ─── Persistence ───
  const persistRoutines = useCallback((r: WorkoutRoutine[]) => {
    AsyncStorage.setItem(ROUTINES_KEY, JSON.stringify(r));
  }, []);

  const persistSessions = useCallback((s: WorkoutSession[]) => {
    AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(s));
  }, []);

  const persistActiveSession = useCallback((s: WorkoutSession | null) => {
    if (s) {
      AsyncStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(s));
    } else {
      AsyncStorage.removeItem(ACTIVE_SESSION_KEY);
    }
  }, []);

  const persistPRs = useCallback((prs: PersonalRecord[]) => {
    AsyncStorage.setItem(PRS_KEY, JSON.stringify(prs));
  }, []);

  // ─── Routines ───

  const createRoutine = useCallback(
    (input: Omit<WorkoutRoutine, 'id' | 'createdAt' | 'updatedAt'>): WorkoutRoutine => {
      const now = new Date().toISOString();
      const routine: WorkoutRoutine = {
        ...input,
        id: generateId(),
        createdAt: now,
        updatedAt: now,
      };
      setRoutines((prev) => {
        const next = [...prev, routine];
        persistRoutines(next);
        return next;
      });
      return routine;
    },
    [persistRoutines]
  );

  const updateRoutine = useCallback(
    (id: string, update: Partial<WorkoutRoutine>) => {
      setRoutines((prev) => {
        const next = prev.map((r) =>
          r.id === id ? { ...r, ...update, updatedAt: new Date().toISOString() } : r
        );
        persistRoutines(next);
        return next;
      });
    },
    [persistRoutines]
  );

  const deleteRoutine = useCallback(
    (id: string) => {
      setRoutines((prev) => {
        const next = prev.filter((r) => r.id !== id);
        persistRoutines(next);
        return next;
      });
    },
    [persistRoutines]
  );

  // ─── Session Management ───

  const startWorkout = useCallback(
    (routineId?: string): WorkoutSession => {
      const routine = routineId ? routines.find((r) => r.id === routineId) : undefined;
      const session: WorkoutSession = {
        id: generateId(),
        routineId,
        routineName: routine?.name,
        exercises: routine
          ? routine.exercises.map((re) => ({
              id: generateId(),
              exerciseId: re.exerciseId,
              exerciseName: re.exerciseName,
              gifUrl: re.gifUrl,
              sets: getLatestCompletedSetsForExercise(sessions, re.exerciseId),
              order: re.order,
              notes: re.notes,
            }))
          : [],
        startedAt: new Date().toISOString(),
        totalVolume: 0,
        isActive: true,
      };
      setActiveSession(session);
      persistActiveSession(session);
      return session;
    },
    [routines, sessions, persistActiveSession]
  );

  const updateActiveSession = useCallback(
    (updater: (session: WorkoutSession) => WorkoutSession) => {
      setActiveSession((prev) => {
        if (!prev) return prev;
        const next = updater(prev);
        next.totalVolume = calculateVolume(next.exercises);
        persistActiveSession(next);
        return next;
      });
    },
    [persistActiveSession]
  );

  // ─── PR Detection ───

  const checkForPRs = useCallback(
    (session: WorkoutSession) => {
      const newPRs: PersonalRecord[] = [];

      session.exercises.forEach((ex) => {
        const workingSets = ex.sets.filter(
          (s) => Boolean(s.completedAt) && !s.isWarmup && s.reps > 0
        );
        if (workingSets.length === 0) return;

        const priorSessions = sessions.filter(
          (s) =>
            s.id !== session.id &&
            Boolean(s.completedAt) &&
            s.exercises.some((e) => e.exerciseId === ex.exerciseId)
        );

        // First completed workout for an exercise establishes baseline and does not trigger PRs
        if (priorSessions.length === 0) return;

        const priorMetrics = getExerciseBestMetricsFromSessions(priorSessions, ex.exerciseId);

        // Max weight
        const maxWeight = Math.max(...workingSets.map((s) => s.weight));
        if (maxWeight > priorMetrics.maxWeight) {
          newPRs.push({
            id: generateId(),
            exerciseId: ex.exerciseId,
            exerciseName: ex.exerciseName,
            type: 'max_weight',
            value: maxWeight,
            unit: 'lbs',
            achievedAt: new Date().toISOString(),
            sessionId: session.id,
            previousValue: priorMetrics.maxWeight,
          });
        }

        // Max volume (per-set volume = weight × reps)
        const maxSetVolume = Math.max(...workingSets.map((set) => set.weight * set.reps));
        if (maxSetVolume > priorMetrics.maxVolume) {
          newPRs.push({
            id: generateId(),
            exerciseId: ex.exerciseId,
            exerciseName: ex.exerciseName,
            type: 'max_volume',
            value: maxSetVolume,
            unit: 'volume',
            achievedAt: new Date().toISOString(),
            sessionId: session.id,
            previousValue: priorMetrics.maxVolume,
          });
        }
      });

      if (newPRs.length > 0) {
        setPersonalRecords((prev) => {
          // Replace existing PRs of same type/exercise, add new ones
          const updated = [...prev];
          newPRs.forEach((newPR) => {
            const existingIdx = updated.findIndex(
              (pr) => pr.exerciseId === newPR.exerciseId && pr.type === newPR.type
            );
            if (existingIdx >= 0) {
              updated[existingIdx] = newPR;
            } else {
              updated.push(newPR);
            }
          });
          persistPRs(updated);
          return updated;
        });
      }
    },
    [sessions, persistPRs]
  );

  const endWorkout = useCallback(
    (notes?: string) => {
      if (!activeSession) return;

      const completedSession: WorkoutSession = {
        ...activeSession,
        completedAt: new Date().toISOString(),
        duration: Math.round(
          (Date.now() - new Date(activeSession.startedAt).getTime()) / 1000
        ),
        totalVolume: calculateVolume(activeSession.exercises),
        isActive: false,
        notes,
      };

      checkForPRs(completedSession);

      setSessions((prev) => {
        const next = [...prev, completedSession];
        persistSessions(next);
        return next;
      });
      setActiveSession(null);
      persistActiveSession(null);
    },
    [activeSession, persistSessions, persistActiveSession, checkForPRs]
  );

  const cancelWorkout = useCallback(() => {
    setActiveSession(null);
    persistActiveSession(null);
  }, [persistActiveSession]);

  // ─── Exercise / Set Operations ───

  const addExerciseToSession = useCallback(
    (exerciseId: string, exerciseName: string, gifUrl?: string) => {
      updateActiveSession((session) => ({
        ...session,
        exercises: [
          ...session.exercises,
          {
            id: generateId(),
            exerciseId,
            exerciseName,
            gifUrl,
            sets: getLatestCompletedSetsForExercise(sessions, exerciseId),
            order: session.exercises.length,
          },
        ],
      }));
    },
    [sessions, updateActiveSession]
  );

  const removeExerciseFromSession = useCallback(
    (workoutExerciseId: string) => {
      updateActiveSession((session) => ({
        ...session,
        exercises: session.exercises.filter((e) => e.id !== workoutExerciseId),
      }));
    },
    [updateActiveSession]
  );

  const addSet = useCallback(
    (workoutExerciseId: string, set: Omit<WorkoutSet, 'id' | 'setNumber'>) => {
      updateActiveSession((session) => ({
        ...session,
        exercises: session.exercises.map((ex) => {
          if (ex.id !== workoutExerciseId) return ex;
          const newSet: WorkoutSet = {
            ...set,
            id: generateId(),
            setNumber: ex.sets.length + 1,
          };
          return { ...ex, sets: [...ex.sets, newSet] };
        }),
      }));
    },
    [updateActiveSession]
  );

  const updateSet = useCallback(
    (workoutExerciseId: string, setId: string, update: Partial<WorkoutSet>) => {
      updateActiveSession((session) => ({
        ...session,
        exercises: session.exercises.map((ex) => {
          if (ex.id !== workoutExerciseId) return ex;
          return {
            ...ex,
            sets: ex.sets.map((s) => (s.id === setId ? { ...s, ...update } : s)),
          };
        }),
      }));
    },
    [updateActiveSession]
  );

  const removeSet = useCallback(
    (workoutExerciseId: string, setId: string) => {
      updateActiveSession((session) => ({
        ...session,
        exercises: session.exercises.map((ex) => {
          if (ex.id !== workoutExerciseId) return ex;
          const sets = ex.sets
            .filter((s) => s.id !== setId)
            .map((s, i) => ({ ...s, setNumber: i + 1 }));
          return { ...ex, sets };
        }),
      }));
    },
    [updateActiveSession]
  );

  const reorderExercises = useCallback(
    (exercises: WorkoutExercise[]) => {
      updateActiveSession((session) => ({
        ...session,
        exercises: exercises.map((e, i) => ({ ...e, order: i })),
      }));
    },
    [updateActiveSession]
  );

  // ─── Recovery ───

  const recoverSession = useCallback(() => {
    if (recoverableSession.current) {
      setActiveSession(recoverableSession.current);
      recoverableSession.current = null;
      setHasRecoverableSession(false);
    }
  }, []);

  const discardRecoverableSession = useCallback(() => {
    recoverableSession.current = null;
    setHasRecoverableSession(false);
    AsyncStorage.removeItem(ACTIVE_SESSION_KEY);
  }, []);

  // ─── Stats ───

  const getStats = useCallback((): WorkoutStats => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const completedSessions = sessions.filter((s) => s.completedAt);

    const totalDuration = completedSessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    const totalVolume = completedSessions.reduce((sum, s) => sum + s.totalVolume, 0);
    const totalSets = completedSessions.reduce(
      (sum, s) => sum + s.exercises.reduce((eSum, e) => eSum + e.sets.length, 0),
      0
    );
    const totalReps = completedSessions.reduce(
      (sum, s) =>
        sum +
        s.exercises.reduce(
          (eSum, e) => eSum + e.sets.reduce((sSum, set) => sSum + set.reps, 0),
          0
        ),
      0
    );

    const workoutsThisWeek = completedSessions.filter(
      (s) => s.completedAt && new Date(s.completedAt) >= weekAgo
    ).length;
    const workoutsThisMonth = completedSessions.filter(
      (s) => s.completedAt && new Date(s.completedAt) >= monthAgo
    ).length;

    // Calculate streak
    let currentStreak = 0;
    let longestStreak = 0;
    const daySet = new Set(
      completedSessions
        .map((s) => s.completedAt?.split('T')[0])
        .filter(Boolean)
    );
    const sortedDays = Array.from(daySet).sort().reverse();
    let streak = 0;
    let checkDate = new Date();
    checkDate.setHours(0, 0, 0, 0);
    for (let i = 0; i < 365; i++) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (daySet.has(dateStr)) {
        streak++;
        longestStreak = Math.max(longestStreak, streak);
      } else if (i > 0) {
        if (currentStreak === 0) currentStreak = streak;
        streak = 0;
      }
      checkDate.setDate(checkDate.getDate() - 1);
    }
    if (currentStreak === 0) currentStreak = streak;

    return {
      totalWorkouts: completedSessions.length,
      totalDuration,
      totalVolume,
      totalSets,
      totalReps,
      averageDuration:
        completedSessions.length > 0
          ? Math.round(totalDuration / completedSessions.length)
          : 0,
      workoutsThisWeek,
      workoutsThisMonth,
      currentStreak,
      longestStreak,
    };
  }, [sessions]);

  const getExerciseProgress = useCallback(
    (exerciseId: string): ExerciseProgress | null => {
      const exerciseSessions = sessions
        .filter((s) => s.completedAt && s.exercises.some((e) => e.exerciseId === exerciseId))
        .sort((a, b) => (a.completedAt! > b.completedAt! ? 1 : -1));

      if (exerciseSessions.length === 0) return null;

      const firstEx = exerciseSessions[0].exercises.find(
        (e) => e.exerciseId === exerciseId
      );
      if (!firstEx) return null;

      return {
        exerciseId,
        exerciseName: firstEx.exerciseName,
        history: exerciseSessions.map((session) => {
          const ex = session.exercises.find((e) => e.exerciseId === exerciseId)!;
          const workingSets = ex.sets.filter((s) => !s.isWarmup);
          const maxWeight = workingSets.length > 0
            ? Math.max(...workingSets.map((s) => s.weight))
            : 0;
          const totalVolume = workingSets.reduce(
            (sum, s) => sum + s.weight * s.reps,
            0
          );
          const totalReps = workingSets.reduce((sum, s) => sum + s.reps, 0);
          const bestOneRM = workingSets.length > 0
            ? Math.max(...workingSets.map((s) => estimateOneRM(s.weight, s.reps)))
            : 0;

          return {
            date: session.completedAt!.split('T')[0],
            maxWeight,
            totalVolume,
            totalSets: workingSets.length,
            totalReps,
            estimatedOneRM: bestOneRM,
          };
        }),
      };
    },
    [sessions]
  );

  return (
    <WorkoutContext.Provider
      value={{
        routines,
        createRoutine,
        updateRoutine,
        deleteRoutine,
        sessions,
        activeSession,
        startWorkout,
        endWorkout,
        cancelWorkout,
        addExerciseToSession,
        removeExerciseFromSession,
        addSet,
        updateSet,
        removeSet,
        reorderExercises,
        hasRecoverableSession,
        recoverSession,
        discardRecoverableSession,
        personalRecords,
        getStats,
        getExerciseProgress,
        isLoaded,
      }}
    >
      {children}
    </WorkoutContext.Provider>
  );
}

export function useWorkout(): WorkoutContextValue {
  const ctx = useContext(WorkoutContext);
  if (!ctx) throw new Error('useWorkout must be used within WorkoutProvider');
  return ctx;
}
