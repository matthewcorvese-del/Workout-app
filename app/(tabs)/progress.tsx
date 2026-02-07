import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  TrendingUp,
  Award,
  Clock,
  Dumbbell,
  Flame,
  Calendar,
} from 'lucide-react-native';
import { useWorkout } from '@/contexts/WorkoutContext';
import Colors from '@/constants/colors';
import { WorkoutSession } from '@/types/workout';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type TimeFilter = '7d' | '30d' | '90d' | 'all';

export default function ProgressScreen() {
  const { sessions, personalRecords, getStats } = useWorkout();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('30d');

  const stats = useMemo(() => getStats(), [getStats, sessions]);

  const filteredSessions = useMemo(() => {
    const now = Date.now();
    const cutoff = {
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '90d': 90 * 24 * 60 * 60 * 1000,
      all: Infinity,
    }[timeFilter];

    return sessions
      .filter(
        (s) =>
          s.completedAt && now - new Date(s.completedAt).getTime() < cutoff
      )
      .sort((a, b) => (b.completedAt! > a.completedAt! ? 1 : -1));
  }, [sessions, timeFilter]);

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1000000) return `${(volume / 1000000).toFixed(1)}M`;
    if (volume >= 1000) return `${(volume / 1000).toFixed(1)}K`;
    return volume.toString();
  };

  const renderSession = ({ item }: { item: WorkoutSession }) => (
    <View style={styles.sessionCard}>
      <View style={styles.sessionHeader}>
        <View>
          <Text style={styles.sessionName}>
            {item.routineName || 'Quick Workout'}
          </Text>
          <Text style={styles.sessionDate}>
            {new Date(item.completedAt!).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })}
          </Text>
        </View>
        <View style={styles.sessionStats}>
          <Text style={styles.sessionStatText}>
            {formatDuration(item.duration || 0)}
          </Text>
          <Text style={styles.sessionStatLabel}>
            {item.exercises.length} exercises
          </Text>
        </View>
      </View>
      <View style={styles.sessionMeta}>
        <View style={styles.sessionMetaItem}>
          <Dumbbell size={12} color={Colors.textSecondary} />
          <Text style={styles.sessionMetaText}>
            {formatVolume(item.totalVolume)} lbs
          </Text>
        </View>
        <View style={styles.sessionMetaItem}>
          <Flame size={12} color={Colors.warning} />
          <Text style={styles.sessionMetaText}>
            {item.caloriesBurned || '—'} cal
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <Text style={styles.headerTitle}>Progress</Text>

      {/* Stats Overview */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Calendar size={18} color={Colors.primary} />
          <Text style={styles.statValue}>{stats.totalWorkouts}</Text>
          <Text style={styles.statLabel}>Workouts</Text>
        </View>
        <View style={styles.statCard}>
          <Clock size={18} color={Colors.accent} />
          <Text style={styles.statValue}>
            {formatDuration(stats.totalDuration)}
          </Text>
          <Text style={styles.statLabel}>Total Time</Text>
        </View>
        <View style={styles.statCard}>
          <TrendingUp size={18} color={Colors.success} />
          <Text style={styles.statValue}>
            {formatVolume(stats.totalVolume)}
          </Text>
          <Text style={styles.statLabel}>Volume (lbs)</Text>
        </View>
        <View style={styles.statCard}>
          <Flame size={18} color={Colors.warning} />
          <Text style={styles.statValue}>{stats.currentStreak}</Text>
          <Text style={styles.statLabel}>Day Streak</Text>
        </View>
      </View>

      {/* PRs Section */}
      {personalRecords.length > 0 && (
        <View style={styles.prSection}>
          <View style={styles.sectionHeader}>
            <Award size={18} color={Colors.prIndicator} />
            <Text style={styles.sectionTitle}>Personal Records</Text>
          </View>
          <FlatList
            data={personalRecords.slice(0, 5)}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.prList}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.prCard}>
                <Text style={styles.prExercise} numberOfLines={1}>
                  {item.exerciseName}
                </Text>
                <Text style={styles.prValue}>
                  {item.value} {item.unit}
                </Text>
                <Text style={styles.prType}>
                  {item.type.replace(/_/g, ' ')}
                </Text>
              </View>
            )}
          />
        </View>
      )}

      {/* Time Filter */}
      <View style={styles.filterRow}>
        {(['7d', '30d', '90d', 'all'] as TimeFilter[]).map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterBtn,
              timeFilter === filter && styles.filterBtnActive,
            ]}
            onPress={() => setTimeFilter(filter)}
          >
            <Text
              style={[
                styles.filterBtnText,
                timeFilter === filter && styles.filterBtnTextActive,
              ]}
            >
              {filter === 'all' ? 'All' : filter}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Session History */}
      <FlatList
        data={filteredSessions}
        keyExtractor={(item) => item.id}
        renderItem={renderSession}
        contentContainerStyle={styles.sessionList}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No workouts yet in this period</Text>
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
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.text,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 8,
    marginBottom: 16,
  },
  statCard: {
    width: (SCREEN_WIDTH - 40) / 2 - 4,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    gap: 6,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  prSection: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 10,
    gap: 6,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
  },
  prList: {
    paddingHorizontal: 16,
    gap: 10,
  },
  prCard: {
    backgroundColor: Colors.card,
    borderRadius: 10,
    padding: 12,
    width: 140,
    borderWidth: 1,
    borderColor: Colors.prIndicator + '30',
  },
  prExercise: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  prValue: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.prIndicator,
    marginBottom: 2,
  },
  prType: {
    fontSize: 11,
    color: Colors.textMuted,
    textTransform: 'capitalize',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  filterBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterBtnText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  filterBtnTextActive: {
    color: '#fff',
  },
  sessionList: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  sessionCard: {
    backgroundColor: Colors.card,
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sessionName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  sessionDate: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  sessionStats: {
    alignItems: 'flex-end',
  },
  sessionStatText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  sessionStatLabel: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  sessionMeta: {
    flexDirection: 'row',
    gap: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  sessionMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sessionMetaText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 40,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textMuted,
  },
});
