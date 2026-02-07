import React, { useState, useEffect, useCallback, useRef } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  X,
  Plus,
  Check,
  Trash2,
  Clock,
  ChevronDown,
  ChevronUp,
  Search,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useWorkout } from '@/contexts/WorkoutContext';
import Colors from '@/constants/colors';
import allExercises, { searchExercises } from '@/data/exercises';
import { WorkoutSet } from '@/types/workout';

export default function ActiveWorkoutScreen() {
  const router = useRouter();
  const {
    activeSession,
    endWorkout,
    cancelWorkout,
    addExerciseToSession,
    addSet,
    updateSet,
    removeSet,
    removeExerciseFromSession,
  } = useWorkout();

  const [elapsed, setElapsed] = useState(0);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);

  // Timer
  useEffect(() => {
    if (!activeSession) return;
    const start = new Date(activeSession.startedAt).getTime();
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [activeSession]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

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

  const handleAddExercise = (exerciseId: string, exerciseName: string) => {
    addExerciseToSession(exerciseId, exerciseName);
    setShowAddExercise(false);
    setExerciseSearch('');
  };

  const filteredExercises = exerciseSearch
    ? searchExercises(exerciseSearch)
    : allExercises.slice(0, 30);

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
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
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

        <TouchableOpacity style={styles.finishBtn} onPress={handleFinish}>
          <Check size={18} color="#fff" />
          <Text style={styles.finishBtnText}>Finish</Text>
        </TouchableOpacity>
      </View>

      {/* Exercise List */}
      <ScrollView contentContainerStyle={styles.content}>
        {activeSession.exercises.map((exercise) => {
          const isExpanded = expandedExercise === exercise.id;
          return (
            <View key={exercise.id} style={styles.exerciseCard}>
              <TouchableOpacity
                style={styles.exerciseHeader}
                onPress={() =>
                  setExpandedExercise(isExpanded ? null : exercise.id)
                }
                activeOpacity={0.7}
              >
                <View style={styles.exerciseHeaderLeft}>
                  <Text style={styles.exerciseName}>
                    {exercise.exerciseName}
                  </Text>
                  <Text style={styles.exerciseSets}>
                    {exercise.sets.length} sets
                  </Text>
                </View>
                <View style={styles.exerciseHeaderRight}>
                  <TouchableOpacity
                    onPress={() => removeExerciseFromSession(exercise.id)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Trash2 size={16} color={Colors.error} />
                  </TouchableOpacity>
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
                      Weight
                    </Text>
                    <Text style={[styles.setHeaderText, { flex: 1 }]}>
                      Reps
                    </Text>
                    <View style={{ width: 32 }} />
                  </View>

                  {exercise.sets.map((set) => (
                    <View key={set.id} style={styles.setRow}>
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
                      <TouchableOpacity
                        onPress={() => removeSet(exercise.id, set.id)}
                        style={{ width: 32, alignItems: 'center' }}
                      >
                        <Trash2 size={14} color={Colors.error} />
                      </TouchableOpacity>
                    </View>
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

        {/* Volume Summary */}
        <View style={styles.volumeCard}>
          <Text style={styles.volumeLabel}>Total Volume</Text>
          <Text style={styles.volumeValue}>
            {activeSession.totalVolume.toLocaleString()} lbs
          </Text>
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>

      {/* Add Exercise Modal */}
      <Modal
        visible={showAddExercise}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
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
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.exerciseListItem}
                onPress={() => handleAddExercise(item.id, item.name)}
                activeOpacity={0.7}
              >
                <View>
                  <Text style={styles.exerciseListName}>{item.name}</Text>
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
    paddingVertical: 12,
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
  exerciseName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  exerciseSets: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  exerciseHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  volumeCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  volumeLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  volumeValue: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text,
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
    paddingVertical: 14,
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
  exerciseListMeta: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
