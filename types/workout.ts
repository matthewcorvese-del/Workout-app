// ─── Workout Types ───

export interface Exercise {
  id: string;
  name: string;
  category: ExerciseCategory;
  muscleGroups: MuscleGroup[];
  equipment: Equipment;
  instructions?: string;
  isCustom?: boolean;
}

export type ExerciseCategory =
  | 'Strength'
  | 'Cardio'
  | 'Flexibility'
  | 'Olympic'
  | 'Bodyweight'
  | 'Machine'
  | 'Cable'
  | 'Dumbbell'
  | 'Barbell'
  | 'Kettlebell'
  | 'Band'
  | 'Other';

export type MuscleGroup =
  | 'Chest'
  | 'Back'
  | 'Shoulders'
  | 'Biceps'
  | 'Triceps'
  | 'Forearms'
  | 'Core'
  | 'Quadriceps'
  | 'Hamstrings'
  | 'Glutes'
  | 'Calves'
  | 'Hip Flexors'
  | 'Adductors'
  | 'Abductors'
  | 'Traps'
  | 'Lats'
  | 'Full Body'
  | 'Cardio';

export type Equipment =
  | 'Barbell'
  | 'Dumbbell'
  | 'Machine'
  | 'Cable'
  | 'Bodyweight'
  | 'Kettlebell'
  | 'Band'
  | 'Smith Machine'
  | 'EZ Bar'
  | 'Trap Bar'
  | 'Medicine Ball'
  | 'Suspension'
  | 'Other'
  | 'None';

// ─── Set & Rep Tracking ───

export interface WorkoutSet {
  id: string;
  setNumber: number;
  weight: number;       // in lbs or kg (based on user pref)
  reps: number;
  isWarmup: boolean;
  isDropSet: boolean;
  isFailure: boolean;
  rpe?: number;         // Rate of Perceived Exertion (1-10)
  restTime?: number;    // seconds
  completedAt?: string; // ISO date string
}

export interface WorkoutExercise {
  id: string;
  exerciseId: string;
  exerciseName: string;
  sets: WorkoutSet[];
  notes?: string;
  order: number;
  supersetGroupId?: string;
}

// ─── Workout Routine ───

export interface WorkoutRoutine {
  id: string;
  name: string;
  description?: string;
  exercises: WorkoutRoutineExercise[];
  createdAt: string;
  updatedAt: string;
  color?: string;
  estimatedDuration?: number; // minutes
  category?: string;
}

export interface WorkoutRoutineExercise {
  exerciseId: string;
  exerciseName: string;
  targetSets: number;
  targetReps: number;
  targetWeight?: number;
  order: number;
  supersetGroupId?: string;
  notes?: string;
}

// ─── Workout Session ───

export interface WorkoutSession {
  id: string;
  routineId?: string;
  routineName?: string;
  exercises: WorkoutExercise[];
  startedAt: string;    // ISO date
  completedAt?: string; // ISO date, undefined if in-progress
  duration?: number;     // seconds
  totalVolume: number;   // total weight × reps
  notes?: string;
  isActive: boolean;
  caloriesBurned?: number;
}

// ─── Personal Records ───

export interface PersonalRecord {
  id: string;
  exerciseId: string;
  exerciseName: string;
  type: PRType;
  value: number;
  unit: string;
  achievedAt: string;    // ISO date
  sessionId: string;
  previousValue?: number;
}

export type PRType =
  | 'max_weight'      // heaviest single rep
  | 'max_volume';     // most total volume in one session for this exercise

// ─── Progress & Stats ───

export interface WorkoutStats {
  totalWorkouts: number;
  totalDuration: number;  // seconds
  totalVolume: number;
  totalSets: number;
  totalReps: number;
  averageDuration: number;
  workoutsThisWeek: number;
  workoutsThisMonth: number;
  currentStreak: number;
  longestStreak: number;
}

export interface ExerciseProgress {
  exerciseId: string;
  exerciseName: string;
  history: {
    date: string;
    maxWeight: number;
    totalVolume: number;
    totalSets: number;
    totalReps: number;
    estimatedOneRM: number;
  }[];
}

// ─── Helper Types ───

export type WeightUnit = 'lbs' | 'kg';
export type HeightUnit = 'metric' | 'imperial';

export interface TimerState {
  isRunning: boolean;
  elapsed: number;           // seconds
  restTimerDuration: number; // seconds
  restTimerRemaining: number;
}
