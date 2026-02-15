import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Play, Clock } from 'lucide-react-native';
import { useWorkout } from '@/contexts/WorkoutContext';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';

function ActiveWorkoutBanner() {
  const { activeSession } = useWorkout();
  const router = useRouter();

  if (!activeSession) return null;

  const elapsed = Math.round(
    (Date.now() - new Date(activeSession.startedAt).getTime()) / 1000
  );
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;

  const exerciseCount = activeSession.exercises.length;
  const totalSets = activeSession.exercises.reduce(
    (sum, ex) => sum + ex.sets.length,
    0
  );

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => router.push('/active-workout')}
      activeOpacity={0.8}
      accessible
      accessibilityRole="button"
      accessibilityLabel="Resume active workout"
      accessibilityHint="Opens the in-progress workout screen"
    >
      <View style={styles.left}>
        <Play size={16} color="#fff" fill="#fff" />
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>
            {activeSession.routineName || 'Quick Workout'}
          </Text>
          <Text style={styles.subtitle}>
            {exerciseCount} exercises · {totalSets} sets
          </Text>
        </View>
      </View>

      <View style={styles.timer}>
        <Clock size={14} color={Colors.primaryLight} />
        <Text style={styles.timerText}>
          {minutes}:{seconds.toString().padStart(2, '0')}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default React.memo(ActiveWorkoutBanner);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primary,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  info: {
    flex: 1,
  },
  title: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: 2,
  },
  timer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  timerText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
});
