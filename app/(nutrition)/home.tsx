import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Beef, Wheat, Droplets } from 'lucide-react-native';
import { useNutrition } from '@/contexts/NutritionContext';
import { useOura } from '@/contexts/OuraContext';
import { useAppMode } from '@/contexts/AppModeContext';
import { useRouter } from 'expo-router';
import NutritionColors from '@/constants/nutritionColors';
import { MealType } from '@/types/nutrition';

export default function NutritionHomeScreen() {
  const { mode } = useAppMode();
  const router = useRouter();
  const { todaySummary, nutritionSettings } = useNutrition();
  const { estimatedCalories, actualCalories } = useOura();

  // Redirect to fitness if in fitness mode
  useEffect(() => {
    if (mode === 'fitness') {
      router.replace('/(tabs)');
    }
  }, [mode, router]);

  if (mode === 'fitness') {
    return null;
  }

  const { totals, goals } = todaySummary;
  const caloriesBurned = actualCalories || estimatedCalories;
  const calorieProgressPct = Math.min(totals.calories / goals.calories, 1);

  const mealSummary: { type: MealType; label: string; color: string; calories: number }[] = [
    {
      type: 'breakfast',
      label: 'Breakfast',
      color: NutritionColors.breakfastColor,
      calories: todaySummary.meals.breakfast.reduce((s, l) => s + l.calories, 0),
    },
    {
      type: 'lunch',
      label: 'Lunch',
      color: NutritionColors.lunchColor,
      calories: todaySummary.meals.lunch.reduce((s, l) => s + l.calories, 0),
    },
    {
      type: 'dinner',
      label: 'Dinner',
      color: NutritionColors.dinnerColor,
      calories: todaySummary.meals.dinner.reduce((s, l) => s + l.calories, 0),
    },
    {
      type: 'snack',
      label: 'Snacks',
      color: NutritionColors.snackColor,
      calories: todaySummary.meals.snack.reduce((s, l) => s + l.calories, 0),
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.headerTitle}>Nutrition</Text>
        <Text style={styles.headerDate}>
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </Text>

        {/* Calories Ring Card */}
        <View style={styles.calorieCard}>
          <View style={styles.calorieRingContainer}>
            <View style={styles.calorieRing}>
              <View
                style={[
                  styles.calorieRingProgress,
                  {
                    transform: [
                      { rotate: `${calorieProgressPct * 360}deg` },
                    ],
                  },
                ]}
              />
              <View style={styles.calorieRingCenter}>
                <Text style={styles.calorieValue}>{Math.round(totals.calories)}</Text>
                <Text style={styles.calorieLabel}>of {goals.calories} cal</Text>
              </View>
            </View>
          </View>

          <View style={styles.calorieDetails}>
            <View style={styles.calorieRow}>
              <Text style={styles.calorieDetailLabel}>Eaten</Text>
              <Text style={styles.calorieDetailValue}>
                {Math.round(totals.calories)}
              </Text>
            </View>
            {nutritionSettings.useOuraCalories && (
              <View style={styles.calorieRow}>
                <Text style={styles.calorieDetailLabel}>Burned</Text>
                <Text style={styles.calorieDetailValue}>
                  {Math.round(caloriesBurned)}
                </Text>
              </View>
            )}
            <View style={styles.calorieRow}>
              <Text style={styles.calorieDetailLabel}>Remaining</Text>
              <Text
                style={[
                  styles.calorieDetailValue,
                  {
                    color:
                      goals.calories - totals.calories > 0
                        ? NutritionColors.success
                        : NutritionColors.error,
                  },
                ]}
              >
                {Math.round(goals.calories - totals.calories)}
              </Text>
            </View>
          </View>
        </View>

        {/* Macros */}
        <View style={styles.macrosRow}>
          <MacroCard
            icon={<Beef size={16} color={NutritionColors.proteinColor} />}
            label="Protein"
            value={totals.protein}
            goal={goals.protein}
            color={NutritionColors.proteinColor}
            unit="g"
          />
          <MacroCard
            icon={<Wheat size={16} color={NutritionColors.carbsColor} />}
            label="Carbs"
            value={totals.carbs}
            goal={goals.carbs}
            color={NutritionColors.carbsColor}
            unit="g"
          />
          <MacroCard
            icon={<Droplets size={16} color={NutritionColors.fatColor} />}
            label="Fat"
            value={totals.fat}
            goal={goals.fat}
            color={NutritionColors.fatColor}
            unit="g"
          />
        </View>

        {/* Meals Summary */}
        <Text style={styles.sectionTitle}>Today&apos;s Meals</Text>
        {mealSummary.map((meal) => (
          <View key={meal.type} style={styles.mealCard}>
            <View
              style={[styles.mealIndicator, { backgroundColor: meal.color }]}
            />
            <View style={styles.mealInfo}>
              <Text style={styles.mealLabel}>{meal.label}</Text>
              <Text style={styles.mealItems}>
                {todaySummary.meals[meal.type].length} items
              </Text>
            </View>
            <Text style={styles.mealCalories}>{meal.calories} cal</Text>
          </View>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function MacroCard({
  icon,
  label,
  value,
  goal,
  color,
  unit,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  goal: number;
  color: string;
  unit: string;
}) {
  const pct = goal > 0 ? Math.min(value / goal, 1) : 0;

  return (
    <View style={macroStyles.card}>
      {icon}
      <Text style={macroStyles.value}>
        {Math.round(value)}
        <Text style={macroStyles.unit}>{unit}</Text>
      </Text>
      <View style={macroStyles.progressTrack}>
        <View
          style={[
            macroStyles.progressFill,
            { width: `${pct * 100}%`, backgroundColor: color },
          ]}
        />
      </View>
      <Text style={macroStyles.goal}>
        / {goal}{unit}
      </Text>
    </View>
  );
}

const macroStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: NutritionColors.card,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: NutritionColors.cardBorder,
    gap: 4,
  },
  value: {
    fontSize: 18,
    fontWeight: '800',
    color: NutritionColors.text,
  },
  unit: {
    fontSize: 12,
    fontWeight: '400',
    color: NutritionColors.textSecondary,
  },
  progressTrack: {
    width: '100%',
    height: 4,
    backgroundColor: NutritionColors.progressTrack,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  goal: {
    fontSize: 11,
    color: NutritionColors.textMuted,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: NutritionColors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: NutritionColors.text,
  },
  headerDate: {
    fontSize: 14,
    color: NutritionColors.textSecondary,
    marginBottom: 20,
    marginTop: 4,
  },
  calorieCard: {
    backgroundColor: NutritionColors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: NutritionColors.cardBorder,
    flexDirection: 'row',
    alignItems: 'center',
  },
  calorieRingContainer: {
    marginRight: 20,
  },
  calorieRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 8,
    borderColor: NutritionColors.progressTrack,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calorieRingProgress: {
    position: 'absolute',
    width: 100,
    height: 100,
  },
  calorieRingCenter: {
    alignItems: 'center',
  },
  calorieValue: {
    fontSize: 22,
    fontWeight: '800',
    color: NutritionColors.text,
  },
  calorieLabel: {
    fontSize: 11,
    color: NutritionColors.textSecondary,
  },
  calorieDetails: {
    flex: 1,
    gap: 8,
  },
  calorieRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  calorieDetailLabel: {
    fontSize: 14,
    color: NutritionColors.textSecondary,
  },
  calorieDetailValue: {
    fontSize: 14,
    fontWeight: '700',
    color: NutritionColors.text,
  },
  macrosRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: NutritionColors.text,
    marginBottom: 12,
  },
  mealCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: NutritionColors.card,
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: NutritionColors.cardBorder,
  },
  mealIndicator: {
    width: 4,
    height: 32,
    borderRadius: 2,
    marginRight: 12,
  },
  mealInfo: {
    flex: 1,
  },
  mealLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: NutritionColors.text,
  },
  mealItems: {
    fontSize: 12,
    color: NutritionColors.textSecondary,
    marginTop: 2,
  },
  mealCalories: {
    fontSize: 15,
    fontWeight: '700',
    color: NutritionColors.caloriesColor,
  },
});
