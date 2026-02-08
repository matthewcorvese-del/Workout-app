import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  User,
  Scale,
  Ruler,
  Activity,
} from 'lucide-react-native';
import { useSettings } from '@/contexts/SettingsContext';
import Colors from '@/constants/colors';

export default function SettingsScreen() {
  const { settings, updateSettings, updateProfile } = useSettings();
  const [editingField, setEditingField] = useState<string | null>(null);

  const activityLevels = [
    { value: 'sedentary', label: 'Sedentary' },
    { value: 'light', label: 'Lightly Active' },
    { value: 'moderate', label: 'Moderately Active' },
    { value: 'active', label: 'Active' },
    { value: 'very_active', label: 'Very Active' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.headerTitle}>Settings</Text>

        {/* Profile Section */}
        <Text style={styles.sectionTitle}>Profile</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <User size={18} color={Colors.primary} />
              <Text style={styles.rowLabel}>Name</Text>
            </View>
            <TextInput
              style={styles.rowInput}
              value={settings.profile.name}
              onChangeText={(v) => updateProfile({ name: v })}
              placeholder="Your name"
              placeholderTextColor={Colors.textMuted}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Text style={styles.rowIcon}>🎂</Text>
              <Text style={styles.rowLabel}>Age</Text>
            </View>
            <TextInput
              style={styles.rowInput}
              value={String(settings.profile.age)}
              onChangeText={(v) => updateProfile({ age: parseInt(v) || 0 })}
              keyboardType="numeric"
              placeholder="30"
              placeholderTextColor={Colors.textMuted}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Text style={styles.rowIcon}>⚥</Text>
              <Text style={styles.rowLabel}>Sex</Text>
            </View>
            <View style={styles.segmentControl}>
              {['male', 'female'].map((sex) => (
                <TouchableOpacity
                  key={sex}
                  style={[
                    styles.segment,
                    settings.profile.sex === sex && styles.segmentActive,
                  ]}
                  onPress={() => updateProfile({ sex: sex as 'male' | 'female' })}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      settings.profile.sex === sex && styles.segmentTextActive,
                    ]}
                  >
                    {sex.charAt(0).toUpperCase() + sex.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Ruler size={18} color={Colors.primary} />
              <Text style={styles.rowLabel}>Height (cm)</Text>
            </View>
            <TextInput
              style={styles.rowInput}
              value={String(settings.profile.heightCm)}
              onChangeText={(v) =>
                updateProfile({ heightCm: parseInt(v) || 0 })
              }
              keyboardType="numeric"
              placeholder="175"
              placeholderTextColor={Colors.textMuted}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Scale size={18} color={Colors.primary} />
              <Text style={styles.rowLabel}>Weight (kg)</Text>
            </View>
            <TextInput
              style={styles.rowInput}
              value={String(settings.profile.weightKg)}
              onChangeText={(v) =>
                updateProfile({ weightKg: parseFloat(v) || 0 })
              }
              keyboardType="decimal-pad"
              placeholder="75"
              placeholderTextColor={Colors.textMuted}
            />
          </View>
        </View>

        {/* Workout Preferences */}
        <Text style={styles.sectionTitle}>Workout Preferences</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Weight Unit</Text>
            <View style={styles.segmentControl}>
              {['lbs', 'kg'].map((unit) => (
                <TouchableOpacity
                  key={unit}
                  style={[
                    styles.segment,
                    settings.weightUnit === unit && styles.segmentActive,
                  ]}
                  onPress={() =>
                    updateSettings({ weightUnit: unit as 'lbs' | 'kg' })
                  }
                >
                  <Text
                    style={[
                      styles.segmentText,
                      settings.weightUnit === unit && styles.segmentTextActive,
                    ]}
                  >
                    {unit}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Default Rest Timer (sec)</Text>
            <TextInput
              style={styles.rowInput}
              value={String(settings.defaultRestTimer)}
              onChangeText={(v) =>
                updateSettings({ defaultRestTimer: parseInt(v) || 60 })
              }
              keyboardType="numeric"
              placeholder="90"
              placeholderTextColor={Colors.textMuted}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Auto-Start Rest Timer</Text>
            <Switch
              value={settings.autoStartRestTimer}
              onValueChange={(v) => updateSettings({ autoStartRestTimer: v })}
              trackColor={{ true: Colors.primary, false: Colors.border }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* App Info */}
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Version</Text>
            <Text style={styles.rowValue}>1.0.1</Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 20,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  rowIcon: {
    fontSize: 18,
    width: 18,
    textAlign: 'center',
  },
  rowLabel: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: '500',
  },
  rowSublabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  rowValue: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  rowInput: {
    fontSize: 15,
    color: Colors.text,
    textAlign: 'right',
    minWidth: 60,
    padding: 4,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 16,
  },
  segmentControl: {
    flexDirection: 'row',
    backgroundColor: Colors.inputBackground,
    borderRadius: 8,
    padding: 2,
  },
  segment: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
  },
  segmentActive: {
    backgroundColor: Colors.primary,
  },
  segmentText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  segmentTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
});
