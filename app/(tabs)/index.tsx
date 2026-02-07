import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  TextInput,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Plus,
  Play,
  ChevronRight,
  Trash2,
  Edit3,
  Zap,
  X,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useWorkout } from '@/contexts/WorkoutContext';
import { useAppMode } from '@/contexts/AppModeContext';
import ActiveWorkoutBanner from '@/components/ActiveWorkoutBanner';
import WorkoutRecoveryPrompt from '@/components/WorkoutRecoveryPrompt';
import Colors from '@/constants/colors';
import { WorkoutRoutine, WorkoutRoutineExercise } from '@/types/workout';
import exercises from '@/data/exercises';

export default function WorkoutsScreen() {
  const router = useRouter();
  const { mode } = useAppMode();
  const {
    routines,
    createRoutine,
    deleteRoutine,
    startWorkout,
    activeSession,
  } = useWorkout();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoutineName, setNewRoutineName] = useState('');
  const [newRoutineDesc, setNewRoutineDesc] = useState('');
  const [selectedExercises, setSelectedExercises] = useState<WorkoutRoutineExercise[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Redirect to nutrition if in nutrition mode
  if (mode === 'nutrition') {
    router.replace('/(nutrition)/home');
    return null;
  }

  const handleStartQuickWorkout = () => {
    startWorkout();
    router.push('/active-workout');
  };

  const handleStartRoutine = (routineId: string) => {
    if (activeSession) {
      Alert.alert(
        'Active Workout',
        'You already have a workout in progress. Finish it first.',
      );
      return;
    }
    startWorkout(routineId);
    router.push('/active-workout');
  };

  const handleDeleteRoutine = (id: string) => {
    Alert.alert('Delete Routine', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteRoutine(id) },
    ]);
  };

  const handleCreateRoutine = () => {
    if (!newRoutineName.trim()) {
      Alert.alert('Error', 'Please enter a routine name');
      return;
    }
    createRoutine({
      name: newRoutineName.trim(),
      description: newRoutineDesc.trim() || undefined,
      exercises: selectedExercises,
    });
    setShowCreateModal(false);
    setNewRoutineName('');
    setNewRoutineDesc('');
    setSelectedExercises([]);
  };

  const toggleExercise = (exerciseId: string, exerciseName: string) => {
    setSelectedExercises((prev) => {
      const exists = prev.find((e) => e.exerciseId === exerciseId);
      if (exists) {
        return prev.filter((e) => e.exerciseId !== exerciseId);
      }
      return [
        ...prev,
        {
          exerciseId,
          exerciseName,
          targetSets: 3,
          targetReps: 10,
          order: prev.length,
        },
      ];
    });
  };

  const filteredExercises = searchQuery
    ? exercises.filter((e) =>
        e.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : exercises.slice(0, 30);

  const renderRoutine = ({ item }: { item: WorkoutRoutine }) => (
    <TouchableOpacity
      style={styles.routineCard}
      onPress={() => handleStartRoutine(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.routineHeader}>
        <View style={styles.routineInfo}>
          <Text style={styles.routineName}>{item.name}</Text>
          {item.description && (
            <Text style={styles.routineDesc} numberOfLines={1}>
              {item.description}
            </Text>
          )}
          <Text style={styles.routineExercises}>
            {item.exercises.length} exercises
            {item.estimatedDuration
              ? ` · ~${item.estimatedDuration} min`
              : ''}
          </Text>
        </View>

        <View style={styles.routineActions}>
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => handleDeleteRoutine(item.id)}
          >
            <Trash2 size={16} color={Colors.error} />
          </TouchableOpacity>
          <View style={styles.playBtn}>
            <Play size={18} color="#fff" fill="#fff" />
          </View>
        </View>
      </View>

      {item.exercises.length > 0 && (
        <View style={styles.exercisePreview}>
          {item.exercises.slice(0, 3).map((ex, i) => (
            <Text key={i} style={styles.exercisePreviewText}>
              {ex.exerciseName} · {ex.targetSets}×{ex.targetReps}
            </Text>
          ))}
          {item.exercises.length > 3 && (
            <Text style={styles.exercisePreviewMore}>
              +{item.exercises.length - 3} more
            </Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Workouts</Text>
        <TouchableOpacity
          style={styles.quickStartBtn}
          onPress={handleStartQuickWorkout}
          activeOpacity={0.7}
        >
          <Zap size={16} color="#fff" />
          <Text style={styles.quickStartText}>Quick Start</Text>
        </TouchableOpacity>
      </View>

      <WorkoutRecoveryPrompt />
      <ActiveWorkoutBanner />

      <FlatList
        data={routines}
        keyExtractor={(item) => item.id}
        renderItem={renderRoutine}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Zap size={48} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No Routines Yet</Text>
            <Text style={styles.emptyText}>
              Create your first workout routine or start a quick workout
            </Text>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowCreateModal(true)}
        activeOpacity={0.7}
      >
        <Plus size={24} color="#fff" />
      </TouchableOpacity>

      {/* Create Routine Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <X size={24} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>New Routine</Text>
            <TouchableOpacity onPress={handleCreateRoutine}>
              <Text style={styles.saveText}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <TextInput
              style={styles.input}
              placeholder="Routine name"
              placeholderTextColor={Colors.textMuted}
              value={newRoutineName}
              onChangeText={setNewRoutineName}
            />
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              placeholder="Description (optional)"
              placeholderTextColor={Colors.textMuted}
              value={newRoutineDesc}
              onChangeText={setNewRoutineDesc}
              multiline
            />

            <Text style={styles.sectionTitle}>
              Add Exercises ({selectedExercises.length})
            </Text>

            <TextInput
              style={styles.searchInput}
              placeholder="Search exercises..."
              placeholderTextColor={Colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />

            {filteredExercises.map((ex) => {
              const isSelected = selectedExercises.some(
                (s) => s.exerciseId === ex.id
              );
              return (
                <TouchableOpacity
                  key={ex.id}
                  style={[
                    styles.exerciseItem,
                    isSelected && styles.exerciseItemSelected,
                  ]}
                  onPress={() => toggleExercise(ex.id, ex.name)}
                  activeOpacity={0.7}
                >
                  <View>
                    <Text style={styles.exerciseItemName}>{ex.name}</Text>
                    <Text style={styles.exerciseItemMeta}>
                      {ex.muscleGroups.join(', ')} · {ex.equipment}
                    </Text>
                  </View>
                  {isSelected && (
                    <View style={styles.checkmark}>
                      <Text style={styles.checkmarkText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
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
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.text,
  },
  quickStartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  quickStartText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  list: {
    padding: 16,
    paddingBottom: 100,
  },
  routineCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  routineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  routineInfo: {
    flex: 1,
  },
  routineName: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  routineDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  routineExercises: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  routineActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteBtn: {
    padding: 4,
  },
  playBtn: {
    backgroundColor: Colors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exercisePreview: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 4,
  },
  exercisePreviewText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  exercisePreviewMore: {
    fontSize: 12,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  empty: {
    alignItems: 'center',
    paddingTop: 80,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
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
  saveText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  modalContent: {
    padding: 16,
  },
  input: {
    backgroundColor: Colors.inputBackground,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: Colors.text,
    marginBottom: 12,
  },
  inputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 12,
  },
  searchInput: {
    backgroundColor: Colors.inputBackground,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: Colors.text,
    marginBottom: 12,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  exerciseItemSelected: {
    backgroundColor: Colors.primary + '15',
  },
  exerciseItemName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  exerciseItemMeta: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});
