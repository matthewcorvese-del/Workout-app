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
  Link,
  Unlink,
  RefreshCw,
  ChevronRight,
} from 'lucide-react-native';
import { useNutrition } from '@/contexts/NutritionContext';
import { useOura } from '@/contexts/OuraContext';
import { useSettings } from '@/contexts/SettingsContext';
import NutritionColors from '@/constants/nutritionColors';
import AppToggle from '@/components/AppToggle';
import { useProfileDisplayValues } from '@/hooks/useProfileDisplayValues';

export default function NutritionSettingsScreen() {
  const { nutritionSettings, updateNutritionSettings } = useNutrition();
  const { isConnected, isLoading, data, connect, disconnect, refreshData } = useOura();
  const { settings } = useSettings();
  const dailyActivity = data.dailyActivity;
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
  const [useOuraCalories, setUseOuraCalories] = useState(
    nutritionSettings.useOuraCalories ?? false
  );

  const handleSave = () => {
    const cal = parseInt(calorieGoal) || 2000;
    const p = parseInt(proteinGoal) || 150;
    const c = parseInt(carbsGoal) || 200;
    const f = parseInt(fatGoal) || 65;

    updateNutritionSettings({
      calorieGoal: cal,
      proteinGoal: p,
      carbsGoal: c,
      fatGoal: f,
      useOuraCalories,
    });

    Alert.alert('Saved', 'Nutrition settings updated.');
  };

  const handleOuraToggle = () => {
    if (isConnected) {
      Alert.alert('Disconnect Oura Ring', 'Are you sure?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Disconnect', style: 'destructive', onPress: disconnect },
      ]);
    } else {
      connect();
    }
  };

  const formatLastSynced = (timestamp: string | null) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
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

        {/* Oura Ring Integration */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Activity size={18} color={NutritionColors.primary} />
            <Text style={styles.sectionTitle}>Oura Ring</Text>
          </View>
          <TouchableOpacity
            style={styles.ouraConnectionRow}
            onPress={handleOuraToggle}
            activeOpacity={0.7}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
              {isConnected ? (
                <Link size={18} color={NutritionColors.success} />
              ) : (
                <Unlink size={18} color={NutritionColors.textMuted} />
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.switchLabel}>
                  {isConnected ? 'Connected' : 'Connect Oura Ring'}
                </Text>
                <Text style={styles.switchHint}>
                  {isConnected
                    ? 'Tap to disconnect'
                    : 'Sync activity, sleep & heart rate'}
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color={NutritionColors.textMuted} />
          </TouchableOpacity>

          {isConnected && (
            <>
              <View style={styles.ouraDivider} />
              <View style={styles.ouraDataSection}>
                {dailyActivity && dailyActivity.date !== new Date().toISOString().split('T')[0] && (
                  <Text style={styles.ouraDataPartial}>Showing yesterday&apos;s data — today&apos;s not yet available</Text>
                )}
                <View style={styles.ouraDataRow}>
                  <View style={styles.ouraDataItem}>
                    <Text style={styles.ouraDataLabel}>Steps</Text>
                    <Text style={styles.ouraDataValue}>
                      {dailyActivity?.steps?.toLocaleString() ?? '--'}
                    </Text>
                  </View>
                  <View style={styles.ouraDataItem}>
                    <Text style={styles.ouraDataLabel}>Active Calories</Text>
                    <Text style={styles.ouraDataValue}>
                      {dailyActivity?.activeCalories ?? '--'}
                      {dailyActivity && <Text style={styles.ouraDataUnit}> cal</Text>}
                    </Text>
                  </View>
                </View>
                <View style={styles.ouraDataRow}>
                  <View style={styles.ouraDataItem}>
                    <Text style={styles.ouraDataLabel}>Est. Daily Burn</Text>
                    <Text style={styles.ouraDataValue}>
                      {dailyActivity?.totalCalories ?? '--'}
                      {dailyActivity && <Text style={styles.ouraDataUnit}> cal</Text>}
                    </Text>
                    {dailyActivity?.isPartial && (
                      <Text style={styles.ouraDataPartial}>(in progress)</Text>
                    )}
                  </View>
                  <View style={styles.ouraDataItem}>
                    <Text style={styles.ouraDataLabel}>Last Synced</Text>
                    <Text style={styles.ouraDataValue}>
                      {formatLastSynced(data.lastFetched)}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.ouraDivider} />
              <TouchableOpacity
                style={styles.refreshRow}
                onPress={refreshData}
                disabled={isLoading}
                activeOpacity={0.7}
              >
                <RefreshCw size={18} color={NutritionColors.primary} />
                <Text style={styles.switchLabel}>
                  {isLoading ? 'Refreshing...' : 'Refresh Data'}
                </Text>
              </TouchableOpacity>

              <View style={styles.ouraDivider} />
              <View style={styles.switchRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.switchLabel}>
                    Use Oura calorie estimates
                  </Text>
                  <Text style={styles.switchHint}>
                    Adjust your calorie goal based on Oura activity data
                  </Text>
                </View>
                <AppToggle
                  value={useOuraCalories}
                  onValueChange={setUseOuraCalories}
                  accessibilityLabel="Use Oura calorie estimates"
                  activeTrackColor={NutritionColors.primary + '80'}
                  inactiveTrackColor={NutritionColors.cardBorder}
                  activeThumbColor={NutritionColors.primary}
                  inactiveThumbColor="#999"
                />
              </View>
            </>
          )}
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
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: NutritionColors.text,
  },
  switchHint: {
    fontSize: 12,
    color: NutritionColors.textMuted,
    marginTop: 2,
  },
  ouraConnectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  ouraDataSection: {
    gap: 12,
    paddingVertical: 12,
  },
  ouraDataRow: {
    flexDirection: 'row',
    gap: 12,
  },
  ouraDataItem: {
    flex: 1,
    backgroundColor: NutritionColors.inputBackground,
    borderRadius: 8,
    padding: 10,
    gap: 4,
  },
  ouraDataLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: NutritionColors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  ouraDataValue: {
    fontSize: 16,
    fontWeight: '700',
    color: NutritionColors.text,
  },
  ouraDataUnit: {
    fontSize: 12,
    fontWeight: '500',
    color: NutritionColors.textSecondary,
  },
  ouraDataPartial: {
    fontSize: 10,
    color: NutritionColors.textMuted,
    marginTop: 2,
  },
  refreshRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  ouraDivider: {
    height: 1,
    backgroundColor: NutritionColors.cardBorder,
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
