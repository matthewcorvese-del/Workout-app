import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, ChevronRight } from 'lucide-react-native';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import Colors from '@/constants/colors';
import { fetchExerciseDbExercisePage, fetchExerciseDbMuscles } from '@/lib/exerciseDb';
import { Exercise } from '@/types/workout';

export default function LibraryScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);

  const {
    data: muscleGroups = [],
    isLoading: isMuscleGroupsLoading,
  } = useQuery({
    queryKey: ['exercise-db-muscles'],
    queryFn: fetchExerciseDbMuscles,
    staleTime: 10 * 60 * 1000,
  });

  const {
    data: pagedExercises,
    isLoading: isExercisesLoading,
    isError: isExercisesError,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: ['exercise-db-library', searchQuery, selectedMuscle],
    queryFn: ({ pageParam }) =>
      fetchExerciseDbExercisePage({
        search: searchQuery,
        muscle: selectedMuscle,
        limit: 25,
        offset: pageParam,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextOffset,
    staleTime: 30 * 1000,
  });

  const filteredExercises = (pagedExercises?.pages ?? []).flatMap((page) => page.exercises);

  const renderExercise = ({ item }: { item: Exercise }) => (
    <TouchableOpacity style={styles.exerciseCard} activeOpacity={0.7}>
      <View style={styles.exerciseInfo}>
        <Text style={styles.exerciseName}>{item.name}</Text>
        <Text style={styles.exerciseMeta}>
          {item.muscleGroups.join(', ')}
        </Text>
        <View style={styles.tags}>
          <View style={styles.tag}>
            <Text style={styles.tagText}>{item.category}</Text>
          </View>
          <View style={styles.tag}>
            <Text style={styles.tagText}>{item.equipment}</Text>
          </View>
        </View>
      </View>
      <ChevronRight size={18} color={Colors.textMuted} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.title}>Exercise Library</Text>
        <Text style={styles.count}>{filteredExercises.length} exercises</Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Search size={18} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search exercises..."
          placeholderTextColor={Colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Muscle Group Filters */}
      <FlatList
        data={muscleGroups}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.filterChip,
              selectedMuscle === item && styles.filterChipActive,
            ]}
            onPress={() =>
              setSelectedMuscle(selectedMuscle === item ? null : item)
            }
          >
            <Text
              style={[
                styles.filterChipText,
                selectedMuscle === item && styles.filterChipTextActive,
              ]}
            >
              {item}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Results */}
      <FlatList
        data={filteredExercises}
        keyExtractor={(item) => item.id}
        renderItem={renderExercise}
        contentContainerStyle={styles.list}
        onEndReachedThreshold={0.35}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
        ListFooterComponent={
          isFetchingNextPage ? (
            <View style={styles.listFooterLoading}>
              <ActivityIndicator color={Colors.primary} />
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            {(isExercisesLoading || isMuscleGroupsLoading) ? (
              <>
                <ActivityIndicator color={Colors.primary} />
                <Text style={styles.emptyStateText}>Loading exercises...</Text>
              </>
            ) : (
              <Text style={styles.emptyStateText}>
                {isExercisesError ? 'Unable to load exercises' : 'No exercises found'}
              </Text>
            )}
          </View>
        }
      />
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
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.text,
  },
  count: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBackground,
    borderRadius: 10,
    paddingHorizontal: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.text,
  },
  filterRow: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 10,
  },
  emptyStateText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  listFooterLoading: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  exerciseMeta: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  tags: {
    flexDirection: 'row',
    gap: 6,
  },
  tag: {
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 11,
    color: Colors.primaryLight,
    fontWeight: '500',
  },
});
