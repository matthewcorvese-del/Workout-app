import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { AlertTriangle, RotateCcw, Trash2 } from 'lucide-react-native';
import { useWorkout } from '@/contexts/WorkoutContext';
import Colors from '@/constants/colors';

function WorkoutRecoveryPrompt() {
  const { hasRecoverableSession, recoverSession, discardRecoverableSession } =
    useWorkout();

  if (!hasRecoverableSession) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AlertTriangle size={20} color={Colors.warning} />
        <Text style={styles.title}>Unfinished Workout Found</Text>
      </View>

      <Text style={styles.description}>
        It looks like your last workout was interrupted. Would you like to
        resume where you left off?
      </Text>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.resumeButton}
          onPress={recoverSession}
          activeOpacity={0.7}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Resume unfinished workout"
        >
          <RotateCcw size={16} color="#fff" />
          <Text style={styles.resumeText}>Resume</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.discardButton}
          onPress={discardRecoverableSession}
          activeOpacity={0.7}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Discard unfinished workout"
        >
          <Trash2 size={16} color={Colors.error} />
          <Text style={styles.discardText}>Discard</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default React.memo(WorkoutRecoveryPrompt);

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.warning + '40',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  description: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  resumeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  resumeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  discardButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.error + '15',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.error + '40',
    gap: 6,
  },
  discardText: {
    color: Colors.error,
    fontSize: 14,
    fontWeight: '600',
  },
});
