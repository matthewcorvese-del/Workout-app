import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  Modal,
  FlatList,
  Animated,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X,
  Plus,
  Check,
  Trophy,
  Trash2,
  Clock,
  ChevronDown,
  ChevronUp,
  Search,
} from 'lucide-react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { createAudioPlayer, AudioPlayer } from 'expo-audio';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useWorkout } from '@/contexts/WorkoutContext';
import { useSettings } from '@/contexts/SettingsContext';
import Colors from '@/constants/colors';
import ExerciseInfoButton from '@/components/ExerciseInfoButton';
import { fetchExerciseDbExerciseById, fetchExerciseDbExercisePage } from '@/lib/exerciseDb';
import { WorkoutExercise, WorkoutSet } from '@/types/workout';

function ExerciseHeaderThumb({
  exerciseId,
  gifUrl,
}: {
  exerciseId: string;
  gifUrl?: string;
}) {
  const { data } = useQuery({
    queryKey: ['exercise-db-thumb', exerciseId],
    queryFn: () => fetchExerciseDbExerciseById(exerciseId),
    enabled: !gifUrl,
    staleTime: 10 * 60 * 1000,
  });

  const resolvedGifUrl = gifUrl || data?.gifUrl;

  if (!resolvedGifUrl) {
    return <View style={styles.exerciseThumbPlaceholder} />;
  }

  return (
    <Image
      source={{ uri: resolvedGifUrl }}
      style={styles.exerciseThumb}
      resizeMode="contain"
    />
  );
}

export default function ActiveWorkoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { settings } = useSettings();
  const {
    activeSession,
    endWorkout,
    cancelWorkout,
    addExerciseToSession,
    addSet,
    updateSet,
    removeSet,
    removeExerciseFromSession,
    sessions,
  } = useWorkout();

  const [elapsed, setElapsed] = useState(0);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [collapsedExercises, setCollapsedExercises] = useState<Set<string>>(new Set());
  const [restRemaining, setRestRemaining] = useState(0);
  const [restRunning, setRestRunning] = useState(false);
  const [prSetIds, setPrSetIds] = useState<Set<string>>(new Set());
  const [animatingPrSetId, setAnimatingPrSetId] = useState<string | null>(null);
  const trophyScale = useRef(new Animated.Value(1)).current;
  const prSoundRef = useRef<AudioPlayer | null>(null);
  const restCompleteSoundRef = useRef<AudioPlayer | null>(null);
  const restCompletionPendingRef = useRef(false);

  // Timer
  useEffect(() => {
    if (!activeSession) return;
    const start = new Date(activeSession.startedAt).getTime();
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [activeSession]);

  useEffect(() => {
    const prPlayer = createAudioPlayer(require('../assets/sounds/pr-chime.wav'));
    prPlayer.volume = 0.85;
    const restPlayer = createAudioPlayer(require('../assets/sounds/rest-complete-chime.wav'));
    restPlayer.volume = 0.85;

    prSoundRef.current = prPlayer;
    restCompleteSoundRef.current = restPlayer;

    return () => {
      if (prSoundRef.current) {
        prSoundRef.current.remove();
      }
      if (restCompleteSoundRef.current) {
        restCompleteSoundRef.current.remove();
      }
      prSoundRef.current = null;
      restCompleteSoundRef.current = null;
    };
  }, []);

  const playRestCompleteChime = useCallback(async () => {
    if (!restCompleteSoundRef.current) return;
    try {
      await restCompleteSoundRef.current.seekTo(0);
      restCompleteSoundRef.current.play();
    } catch {
      // no-op
    }
  }, []);

  useEffect(() => {
    if (!restRunning) return;
    if (restRemaining <= 0) {
      setRestRunning(false);
      return;
    }
    const timer = setInterval(() => {
      setRestRemaining((prev) => {
        if (prev <= 1) {
          restCompletionPendingRef.current = true;
          setRestRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [restRemaining, restRunning]);

  useEffect(() => {
    if (restRemaining === 0 && restCompletionPendingRef.current) {
      restCompletionPendingRef.current = false;
      playRestCompleteChime();
    }
  }, [playRestCompleteChime, restRemaining]);

  useEffect(() => {
    if (!activeSession) return;

    setCollapsedExercises((prev) => {
      const next = new Set(prev);
      let changed = false;

      activeSession.exercises.forEach((exercise) => {
        const allSetsCompleted =
          exercise.sets.length > 0 &&
          exercise.sets.every((set) => Boolean(set.completedAt));

        if (allSetsCompleted && !next.has(exercise.id)) {
          next.add(exercise.id);
          changed = true;
        }
      });

      return changed ? next : prev;
    });
  }, [activeSession]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const playPRChime = useCallback(async () => {
    if (!prSoundRef.current) return;
    try {
      await prSoundRef.current.seekTo(0);
      prSoundRef.current.play();
    } catch {
      // no-op
    }
  }, []);

  const animatePR = useCallback((setId: string) => {
    setAnimatingPrSetId(setId);
    trophyScale.setValue(1);
    Animated.sequence([
      Animated.timing(trophyScale, {
        toValue: 1.28,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(trophyScale, {
        toValue: 1,
        duration: 140,
        useNativeDriver: true,
      }),
    ]).start(() => setAnimatingPrSetId(null));
  }, [trophyScale]);

  const getHistoricalCompletedMetrics = useCallback(
    (exerciseId: string) => {
      const historicalSets = sessions
        .filter((session) => Boolean(session.completedAt))
        .flatMap((session) => session.exercises)
        .filter((exercise) => exercise.exerciseId === exerciseId)
        .flatMap((exercise) => exercise.sets)
        .filter((set) => Boolean(set.completedAt) && !set.isWarmup && set.reps > 0);

      if (historicalSets.length === 0) {
        return { maxWeight: 0, maxVolume: 0, hasHistory: false };
      }

      const maxVolume = Math.max(
        ...historicalSets.map((historicalSet) => historicalSet.weight * historicalSet.reps)
      );

      return {
        maxWeight: Math.max(...historicalSets.map((set) => set.weight)),
        maxVolume,
        hasHistory: true,
      };
    },
    [sessions]
  );

  const hasHistoricalCompletedWorkoutForExercise = useCallback(
    (exerciseId: string) => {
      return sessions.some(
        (session) =>
          Boolean(session.completedAt) &&
          session.exercises.some(
            (exercise) =>
              exercise.exerciseId === exerciseId &&
              exercise.sets.some(
                (set) => Boolean(set.completedAt) && !set.isWarmup && set.reps > 0
              )
          )
      );
    },
    [sessions]
  );

  const handleToggleSetComplete = useCallback(
    (exercise: WorkoutExercise, set: WorkoutSet) => {
      if (set.completedAt) {
        updateSet(exercise.id, set.id, { completedAt: undefined });
        setPrSetIds((prev) => {
          const next = new Set(prev);
          next.delete(set.id);
          return next;
        });
        return;
      }

      if (set.reps <= 0) {
        Alert.alert('Set Incomplete', 'Enter reps before marking this set complete.');
        return;
      }

      const hasHistoricalWorkout = hasHistoricalCompletedWorkoutForExercise(exercise.exerciseId);
      let isPR = false;

      if (hasHistoricalWorkout && !set.isWarmup) {
        const previous = getHistoricalCompletedMetrics(exercise.exerciseId);
        const setVolume = set.weight * set.reps;

        const isNewMaxWeight = set.weight > previous.maxWeight;
        const isNewMaxVolume = setVolume > previous.maxVolume;

        isPR =
          previous.hasHistory &&
          (isNewMaxWeight || isNewMaxVolume);
      }

      updateSet(exercise.id, set.id, {
        completedAt: new Date().toISOString(),
      });

      if (settings.autoStartRestTimer && settings.defaultRestTimer > 0) {
        setRestRemaining(settings.defaultRestTimer);
        setRestRunning(true);
      }

      if (isPR) {
        setPrSetIds((prev) => new Set(prev).add(set.id));
        animatePR(set.id);
        playPRChime();
      }
    },
    [
      animatePR,
      getHistoricalCompletedMetrics,
      hasHistoricalCompletedWorkoutForExercise,
      playPRChime,
      settings.autoStartRestTimer,
      settings.defaultRestTimer,
      updateSet,
    ]
  );

  const handleFinish = () => {
    Alert.alert('Finish Workout', 'Save and complete this workout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Finish',
        onPress: () => {
          endWorkout();
          router.back();
        },
      },
    ]);
  };

  const handleCancel = () => {
    Alert.alert('Cancel Workout', 'Discard this workout? All data will be lost.', [
      { text: 'Keep Going', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: () => {
          cancelWorkout();
          router.back();
        },
      },
    ]);
  };

  const handleAddSet = (workoutExerciseId: string) => {
    addSet(workoutExerciseId, {
      weight: 0,
      reps: 0,
      isWarmup: false,
      isDropSet: false,
      isFailure: false,
    });
  };

  const handleAddExercise = (exerciseId: string, exerciseName: string, gifUrl?: string) => {
    addExerciseToSession(exerciseId, exerciseName, gifUrl);
    setShowAddExercise(false);
    setExerciseSearch('');
  };

  const renderDeleteAction = (onDelete: () => void) => (
    <TouchableOpacity
      style={styles.swipeDeleteAction}
      onPress={onDelete}
      activeOpacity={0.8}
    >
      <Trash2 size={16} color="#fff" />
    </TouchableOpacity>
  );

  const renderSetDeleteAction = (onDelete: () => void) => (
    <TouchableOpacity
      style={styles.swipeDeleteSetAction}
      onPress={onDelete}
      activeOpacity={0.8}
    >
      <Trash2 size={14} color="#fff" />
    </TouchableOpacity>
  );

  const {
    data: pagedExercises,
    isLoading: isExerciseListLoading,
    isError: isExerciseListError,
    isFetchingNextPage: isExerciseListFetchingNextPage,
    hasNextPage: hasMoreExercises,
    fetchNextPage: fetchMoreExercises,
  } = useInfiniteQuery({
    queryKey: ['exercise-db-active-workout', exerciseSearch],
    queryFn: ({ pageParam }) =>
      fetchExerciseDbExercisePage({
        search: exerciseSearch,
        limit: 25,
        offset: pageParam,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextOffset,
    staleTime: 30 * 1000,
    enabled: showAddExercise,
  });

  const filteredExercises = (pagedExercises?.pages ?? []).flatMap((page) => page.exercises);

  if (!activeSession) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No active workout</Text>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
          >
            <Text style={styles.backBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 8,
          },
        ]}
      >
        <TouchableOpacity onPress={handleCancel}>
          <X size={24} color={Colors.error} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            {activeSession.routineName || 'Quick Workout'}
          </Text>
          <View style={styles.timerContainer}>
            <Clock size={14} color={Colors.primary} />
            <Text style={styles.timerText}>{formatTime(elapsed)}</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <Text style={styles.headerVolumeText}>
            Vol {activeSession.totalVolume.toLocaleString()} {settings.weightUnit}
          </Text>
          <TouchableOpacity style={styles.finishBtn} onPress={handleFinish}>
            <Check size={18} color="#fff" />
            <Text style={styles.finishBtnText}>Finish</Text>
          </TouchableOpacity>
        </View>
      </View>

      {restRunning && restRemaining > 0 && (
        <View style={styles.restTimerBar}>
          <Text style={styles.restTimerText}>Rest {formatTime(restRemaining)}</Text>
          <View style={styles.restAdjustGroup}>
            <TouchableOpacity
              style={styles.restAdjustBtn}
              onPress={() =>
                setRestRemaining((prev) => {
                  const next = Math.max(0, prev - 15);
                  if (next === 0) {
                    setRestRunning(false);
                  }
                  return next;
                })
              }
            >
              <Text style={styles.restAdjustText}>-15s</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.restAdjustBtn}
              onPress={() => setRestRemaining((prev) => prev + 15)}
            >
              <Text style={styles.restAdjustText}>+15s</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            onPress={() => {
              setRestRunning(false);
              setRestRemaining(0);
            }}
          >
            <Text style={styles.restTimerSkip}>Skip</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Exercise List */}
      <ScrollView contentContainerStyle={styles.content}>
        {activeSession.exercises.map((exercise) => {
          const isExpanded = !collapsedExercises.has(exercise.id);
          return (
            <Swipeable
              key={exercise.id}
              overshootRight={false}
              renderRightActions={() =>
                renderDeleteAction(() => removeExerciseFromSession(exercise.id))
              }
            >
              <View style={styles.exerciseCard}>
                <TouchableOpacity
                  style={styles.exerciseHeader}
                  onPress={() =>
                    setCollapsedExercises((prev) => {
                      const next = new Set(prev);
                      if (next.has(exercise.id)) {
                        next.delete(exercise.id);
                      } else {
                        next.add(exercise.id);
                      }
                      return next;
                    })
                  }
                  activeOpacity={0.7}
                >
                  <View style={styles.exerciseHeaderLeft}>
                    <View style={styles.exerciseNameRow}>
                      <Text style={styles.exerciseName}>
                        {exercise.exerciseName}
                      </Text>
                      <ExerciseInfoButton
                        exerciseId={exercise.exerciseId}
                        exerciseName={exercise.exerciseName}
                        gifUrl={exercise.gifUrl}
                      />
                    </View>
                    <Text style={styles.exerciseSets}>
                      {exercise.sets.length} sets
                    </Text>
                  </View>
                  <View style={styles.exerciseHeaderRight}>
                    <ExerciseHeaderThumb
                      exerciseId={exercise.exerciseId}
                      gifUrl={exercise.gifUrl}
                    />
                    {isExpanded ? (
                      <ChevronUp size={18} color={Colors.textMuted} />
                    ) : (
                      <ChevronDown size={18} color={Colors.textMuted} />
                    )}
                  </View>
                </TouchableOpacity>

                {/* Sets */}
                {isExpanded && (
                  <View style={styles.setsContainer}>
                    {/* Header row */}
                    <View style={styles.setHeaderRow}>
                      <Text style={[styles.setHeaderText, { width: 36 }]}> 
                        Set
                      </Text>
                      <Text style={[styles.setHeaderText, { flex: 1 }]}> 
                        Weight ({settings.weightUnit})
                      </Text>
                      <Text style={[styles.setHeaderText, { flex: 1 }]}> 
                        Reps
                      </Text>
                      <View style={{ width: 40 }} />
                    </View>

                    {exercise.sets.map((set) => (
                      <Swipeable
                        key={set.id}
                        overshootRight={false}
                        renderRightActions={() =>
                          renderSetDeleteAction(() =>
                            removeSet(exercise.id, set.id)
                          )
                        }
                      >
                        <View style={styles.setRow}>
                          <Text style={[styles.setNumber, { width: 36 }]}> 
                            {set.isWarmup ? 'W' : set.setNumber}
                          </Text>
                          <TextInput
                            style={[styles.setInput, { flex: 1 }]}
                            value={set.weight > 0 ? String(set.weight) : ''}
                            onChangeText={(v) =>
                              updateSet(exercise.id, set.id, {
                                weight: parseFloat(v) || 0,
                              })
                            }
                            keyboardType="decimal-pad"
                            placeholder="0"
                            placeholderTextColor={Colors.textMuted}
                          />
                          <TextInput
                            style={[styles.setInput, { flex: 1 }]}
                            value={set.reps > 0 ? String(set.reps) : ''}
                            onChangeText={(v) =>
                              updateSet(exercise.id, set.id, {
                                reps: parseInt(v) || 0,
                              })
                            }
                            keyboardType="number-pad"
                            placeholder="0"
                            placeholderTextColor={Colors.textMuted}
                          />
                          <Animated.View
                            style={
                              animatingPrSetId === set.id
                                ? { transform: [{ scale: trophyScale }] }
                                : undefined
                            }
                          >
                            <TouchableOpacity
                              style={[
                                styles.completeSetBtn,
                                set.completedAt
                                  ? prSetIds.has(set.id)
                                    ? styles.completeSetBtnPR
                                    : styles.completeSetBtnDone
                                  : styles.completeSetBtnPending,
                              ]}
                              onPress={() => handleToggleSetComplete(exercise, set)}
                              activeOpacity={0.8}
                            >
                              {set.completedAt ? (
                                prSetIds.has(set.id) ? (
                                  <Trophy size={15} color="#fff" />
                                ) : (
                                  <Check size={15} color="#fff" />
                                )
                              ) : (
                                <Check size={15} color={Colors.textMuted} />
                              )}
                            </TouchableOpacity>
                          </Animated.View>
                        </View>
                      </Swipeable>
                    ))}

                    <TouchableOpacity
                      style={styles.addSetBtn}
                      onPress={() => handleAddSet(exercise.id)}
                      activeOpacity={0.7}
                    >
                      <Plus size={14} color={Colors.primary} />
                      <Text style={styles.addSetText}>Add Set</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Collapsed: mini set summary */}
                {!isExpanded && exercise.sets.length > 0 && (
                  <View style={styles.collapsedSets}>
                    {exercise.sets.slice(0, 4).map((set, i) => (
                      <Text key={set.id} style={styles.collapsedSetText}>
                        {set.weight}×{set.reps}
                        {i < Math.min(exercise.sets.length, 4) - 1 ? '  ' : ''}
                      </Text>
                    ))}
                    {exercise.sets.length > 4 && (
                      <Text style={styles.collapsedSetMore}>
                        +{exercise.sets.length - 4}
                      </Text>
                    )}
                  </View>
                )}
              </View>
            </Swipeable>
          );
        })}

        {/* Add Exercise Button */}
        <TouchableOpacity
          style={styles.addExerciseBtn}
          onPress={() => setShowAddExercise(true)}
          activeOpacity={0.7}
        >
          <Plus size={18} color={Colors.primary} />
          <Text style={styles.addExerciseText}>Add Exercise</Text>
        </TouchableOpacity>

        <View style={{ height: 60 }} />
      </ScrollView>

      {/* Add Exercise Modal */}
      <Modal
        visible={showAddExercise}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View
            style={[
              styles.modalHeader,
              {
                paddingTop: insets.top + 10,
              },
            ]}
          >
            <TouchableOpacity onPress={() => setShowAddExercise(false)}>
              <X size={24} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Exercise</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.searchContainer}>
            <Search size={18} color={Colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search exercises..."
              placeholderTextColor={Colors.textMuted}
              value={exerciseSearch}
              onChangeText={setExerciseSearch}
              autoFocus
            />
          </View>

          <FlatList
            data={filteredExercises}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16 }}
            onEndReachedThreshold={0.35}
            onEndReached={() => {
              if (hasMoreExercises && !isExerciseListFetchingNextPage) {
                fetchMoreExercises();
              }
            }}
            ListFooterComponent={
              isExerciseListFetchingNextPage ? (
                <View style={styles.exerciseListFooterLoading}>
                  <ActivityIndicator color={Colors.primary} />
                </View>
              ) : null
            }
            ListEmptyComponent={
              isExerciseListLoading ? (
                <View style={styles.exerciseListEmpty}>
                  <ActivityIndicator color={Colors.primary} />
                  <Text style={styles.exerciseListEmptyText}>Loading exercises...</Text>
                </View>
              ) : (
                <View style={styles.exerciseListEmpty}>
                  <Text style={styles.exerciseListEmptyText}>
                    {isExerciseListError ? 'Unable to load exercises' : 'No exercises found'}
                  </Text>
                </View>
              )
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.exerciseListItem}
                onPress={() => handleAddExercise(item.id, item.name, item.gifUrl)}
                activeOpacity={0.7}
              >
                <View>
                  <View style={styles.exerciseListNameRow}>
                    <Text style={styles.exerciseListName}>{item.name}</Text>
                    <ExerciseInfoButton
                      exerciseId={item.id}
                      exerciseName={item.name}
                      gifUrl={item.gifUrl}
                      description={item.instructions}
                    />
                  </View>
                  <Text style={styles.exerciseListMeta}>
                    {item.muscleGroups.join(', ')} · {item.equipment}
                  </Text>
                </View>
                <Plus size={18} color={Colors.primary} />
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  timerText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  restTimerBar: {
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 2,
    backgroundColor: Colors.primary + '20',
    borderWidth: 1,
    borderColor: Colors.primary + '45',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  restTimerText: {
    color: Colors.primaryLight,
    fontSize: 13,
    fontWeight: '700',
  },
  restAdjustGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  restAdjustBtn: {
    backgroundColor: Colors.primary + '25',
    borderWidth: 1,
    borderColor: Colors.primary + '45',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  restAdjustText: {
    color: Colors.primaryLight,
    fontSize: 12,
    fontWeight: '700',
  },
  restTimerSkip: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  headerVolumeText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  finishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.success,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  finishBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    padding: 16,
  },
  exerciseCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    overflow: 'hidden',
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  exerciseHeaderLeft: {
    flex: 1,
  },
  exerciseNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    flexShrink: 1,
  },
  exerciseSets: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  exerciseHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  exerciseThumb: {
    width: 60,
    height: 60,
    borderRadius: 6,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  exerciseThumbPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 6,
    backgroundColor: Colors.inputBackground,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
  },
  swipeDeleteAction: {
    width: 72,
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swipeDeleteSetAction: {
    width: 64,
    borderRadius: 8,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  setsContainer: {
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  setHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: 4,
    gap: 8,
  },
  setHeaderText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    gap: 8,
  },
  setNumber: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
  },
  setInput: {
    backgroundColor: Colors.inputBackground,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 15,
    color: Colors.text,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: Colors.inputBorder,
  },
  completeSetBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  completeSetBtnPending: {
    backgroundColor: Colors.inputBackground,
    borderColor: Colors.inputBorder,
  },
  completeSetBtnDone: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  completeSetBtnPR: {
    backgroundColor: Colors.gold,
    borderColor: Colors.gold,
  },
  addSetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginTop: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.primary + '40',
    borderStyle: 'dashed',
    gap: 4,
  },
  addSetText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600',
  },
  collapsedSets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 14,
    paddingBottom: 10,
    gap: 4,
  },
  collapsedSetText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  collapsedSetMore: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  addExerciseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.card,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary + '40',
    borderStyle: 'dashed',
    marginBottom: 16,
    gap: 6,
  },
  addExerciseText: {
    fontSize: 15,
    color: Colors.primary,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textMuted,
  },
  backBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBackground,
    borderRadius: 10,
    paddingHorizontal: 12,
    margin: 16,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.text,
  },
  exerciseListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  exerciseListName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  exerciseListNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  exerciseListMeta: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  exerciseListEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 10,
  },
  exerciseListEmptyText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  exerciseListFooterLoading: {
    paddingVertical: 14,
    alignItems: 'center',
  },
});
