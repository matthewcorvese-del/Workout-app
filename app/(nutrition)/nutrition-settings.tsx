import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Activity,
  Target,
  User,
  Scale,
  Ruler,
  Flame,
} from 'lucide-react-native';
import { useNutrition } from '@/contexts/NutritionContext';
import { useSettings } from '@/contexts/SettingsContext';
import NutritionColors from '@/constants/nutritionColors';
import { useProfileDisplayValues } from '@/hooks/useProfileDisplayValues';

export default function NutritionSettingsScreen() {
  const { nutritionSettings, updateNutritionSettings } = useNutrition();
  const { settings } = useSettings();
  const profile = settings.profile;

  const { displayWeight, displayHeight } = useProfileDisplayValues({
    profile,
    weightUnit: settings.weightUnit,
    heightUnit: settings.heightUnit,
  });

  const [calorieGoal, setCalorieGoal] = useState(
    String(nutritionSettings.calorieGoal)
  );
  const [proteinGoal, setProteinGoal] = useState(
    String(nutritionSettings.proteinGoal)
  );
  const [carbsGoal, setCarbsGoal] = useState(
    String(nutritionSettings.carbsGoal)
  );
  const [fatGoal, setFatGoal] = useState(
    String(nutritionSettings.fatGoal)
  );
  const handleSave = () => {
    const parsedGoals = [
      parseInt(calorieGoal, 10),
      parseInt(proteinGoal, 10),
      parseInt(carbsGoal, 10),
      parseInt(fatGoal, 10),
    ];
    if (parsedGoals.some((goal) => !Number.isFinite(goal) || goal <= 0)) {
      Alert.alert('Invalid Goals', 'All nutrition goals must be greater than zero.');
      return;
    }
    const [cal, p, c, f] = parsedGoals;

    updateNutritionSettings({
      calorieGoal: cal,
      proteinGoal: p,
      carbsGoal: c,
      fatGoal: f,
    });

    Alert.alert('Saved', 'Nutrition settings updated.');
  };

  const macroCalories = {
    protein: (parseInt(proteinGoal) || 0) * 4,
    carbs: (parseInt(carbsGoal) || 0) * 4,
    fat: (parseInt(fatGoal) || 0) * 9,
  };
  const macroTotal =
    macroCalories.protein + macroCalories.carbs + macroCalories.fat;

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.headerTitle}>Nutrition Settings</Text>

        {/* Calorie Goal */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Flame size={18} color={NutritionColors.caloriesColor} />
            <Text style={styles.sectionTitle}>Daily Calorie Goal</Text>
          </View>
          <TextInput
            style={styles.textInput}
            value={calorieGoal}
            onChangeText={setCalorieGoal}
            keyboardType="number-pad"
            selectTextOnFocus
          />
          <Text style={styles.hint}>
            Recommended: 2,000 for women, 2,500 for men
          </Text>
        </View>

        {/* Macro Goals */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Target size={18} color={NutritionColors.primary} />
            <Text style={styles.sectionTitle}>Macro Goals (per day)</Text>
          </View>

          <View style={styles.macroInputRow}>
            <View style={styles.macroInputGroup}>
              <Text
                style={[
                  styles.macroInputLabel,
                  { color: NutritionColors.proteinColor },
                ]}
              >
                Protein (g)
              </Text>
              <TextInput
                style={styles.macroInput}
                value={proteinGoal}
                onChangeText={setProteinGoal}
                keyboardType="number-pad"
                selectTextOnFocus
              />
              <Text style={styles.macroCals}>
                {macroCalories.protein} cal
              </Text>
            </View>
            <View style={styles.macroInputGroup}>
              <Text
                style={[
                  styles.macroInputLabel,
                  { color: NutritionColors.carbsColor },
                ]}
              >
                Carbs (g)
              </Text>
              <TextInput
                style={styles.macroInput}
                value={carbsGoal}
                onChangeText={setCarbsGoal}
                keyboardType="number-pad"
                selectTextOnFocus
              />
              <Text style={styles.macroCals}>
                {macroCalories.carbs} cal
              </Text>
            </View>
            <View style={styles.macroInputGroup}>
              <Text
                style={[
                  styles.macroInputLabel,
                  { color: NutritionColors.fatColor },
                ]}
              >
                Fat (g)
              </Text>
              <TextInput
                style={styles.macroInput}
                value={fatGoal}
                onChangeText={setFatGoal}
                keyboardType="number-pad"
                selectTextOnFocus
              />
              <Text style={styles.macroCals}>
                {macroCalories.fat} cal
              </Text>
            </View>
          </View>

          <View style={styles.macroSummary}>
            <Text style={styles.macroSummaryText}>
              Macro total:{' '}
              <Text style={{ fontWeight: '700' }}>{macroTotal} cal</Text>
              {Math.abs(macroTotal - (parseInt(calorieGoal) || 0)) > 50 && (
                <Text style={{ color: NutritionColors.error }}>
                  {' '}
                  (
                  {macroTotal > (parseInt(calorieGoal) || 0)
                    ? `${macroTotal - (parseInt(calorieGoal) || 0)} over`
                    : `${(parseInt(calorieGoal) || 0) - macroTotal} under`}
                  )
                </Text>
              )}
            </Text>
          </View>
        </View>

        {/* Profile Info */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <User size={18} color={NutritionColors.textSecondary} />
            <Text style={styles.sectionTitle}>Profile</Text>
          </View>
          <View style={styles.profileRow}>
            <View style={styles.profileItem}>
              <Scale size={14} color={NutritionColors.textMuted} />
              <Text style={styles.profileText}>{displayWeight}</Text>
            </View>
            <View style={styles.profileItem}>
              <Ruler size={14} color={NutritionColors.textMuted} />
              <Text style={styles.profileText}>{displayHeight}</Text>
            </View>
            <View style={styles.profileItem}>
              <Activity size={14} color={NutritionColors.textMuted} />
              <Text style={styles.profileText}>
                {profile.activityLevel || 'Not set'}
              </Text>
            </View>
          </View>
          <Text style={styles.profileHint}>
            Update your profile in Settings to improve calorie recommendations
          </Text>
        </View>

        {/* Save */}
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSave}
          activeOpacity={0.7}
        >
          <Text style={styles.saveBtnText}>Save Settings</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: NutritionColors.background,
  },
  body: {
    padding: 16,
    gap: 20,
    paddingBottom: 100,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: NutritionColors.text,
    paddingTop: 4,
  },
  section: {
    backgroundColor: NutritionColors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: NutritionColors.cardBorder,
    gap: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: NutritionColors.text,
  },
  textInput: {
    backgroundColor: NutritionColors.inputBackground,
    borderWidth: 1,
    borderColor: NutritionColors.inputBorder,
    borderRadius: 10,
    padding: 14,
    fontSize: 18,
    fontWeight: '700',
    color: NutritionColors.text,
  },
  hint: {
    fontSize: 12,
    color: NutritionColors.textMuted,
  },
  macroInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  macroInputGroup: {
    flex: 1,
    gap: 4,
  },
  macroInputLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  macroInput: {
    backgroundColor: NutritionColors.inputBackground,
    borderWidth: 1,
    borderColor: NutritionColors.inputBorder,
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    fontWeight: '700',
    color: NutritionColors.text,
    textAlign: 'center',
  },
  macroCals: {
    fontSize: 10,
    color: NutritionColors.textMuted,
    textAlign: 'center',
  },
  macroSummary: {
    backgroundColor: NutritionColors.inputBackground,
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  macroSummaryText: {
    fontSize: 13,
    color: NutritionColors.textSecondary,
  },
  profileRow: {
    flexDirection: 'row',
    gap: 16,
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  profileText: {
    fontSize: 13,
    color: NutritionColors.textSecondary,
  },
  profileHint: {
    fontSize: 12,
    color: NutritionColors.textMuted,
  },
  saveBtn: {
    backgroundColor: NutritionColors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
