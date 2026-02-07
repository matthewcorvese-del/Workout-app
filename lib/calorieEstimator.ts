import AsyncStorage from '@react-native-async-storage/async-storage';

const ESTIMATOR_STORAGE_KEY = 'oura_calorie_estimator';

// ─── Types ───

interface CaloriePattern {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  averageCalories: number;
  sampleCount: number;
}

interface DailyRecord {
  date: string;       // YYYY-MM-DD
  calories: number;
  steps: number;
  activeMinutes: number;
  source: 'oura' | 'estimated';
}

interface EstimatorState {
  patterns: CaloriePattern[];
  history: DailyRecord[];
  bmr: number;
  lastReconciliation: string | null;
}

// ─── Calorie Estimator ───

export class OuraCalorieEstimator {
  private patterns: CaloriePattern[];
  private history: DailyRecord[];
  private bmr: number;
  private lastReconciliation: string | null;

  constructor() {
    this.patterns = Array.from({ length: 7 }, (_, i) => ({
      dayOfWeek: i,
      averageCalories: 0,
      sampleCount: 0,
    }));
    this.history = [];
    this.bmr = 1800; // Default BMR, will be updated from Oura sleep data
    this.lastReconciliation = null;
  }

  // ─── Load / Save ───

  async load(): Promise<void> {
    try {
      const raw = await AsyncStorage.getItem(ESTIMATOR_STORAGE_KEY);
      if (raw) {
        const state: EstimatorState = JSON.parse(raw);
        this.patterns = state.patterns;
        this.history = state.history;
        this.bmr = state.bmr;
        this.lastReconciliation = state.lastReconciliation;
      }
    } catch (err) {
      console.warn('Failed to load calorie estimator state:', err);
    }
  }

  async save(): Promise<void> {
    try {
      const state: EstimatorState = {
        patterns: this.patterns,
        history: this.history,
        bmr: this.bmr,
        lastReconciliation: this.lastReconciliation,
      };
      await AsyncStorage.setItem(ESTIMATOR_STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      console.warn('Failed to save calorie estimator state:', err);
    }
  }

  // ─── BMR ───

  setBMR(bmr: number): void {
    this.bmr = bmr;
  }

  /**
   * Estimate BMR from user profile using Mifflin-St Jeor equation.
   */
  static calculateBMR(
    weightKg: number,
    heightCm: number,
    age: number,
    sex: 'male' | 'female'
  ): number {
    const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
    return sex === 'male' ? base + 5 : base - 161;
  }

  // ─── Record Actual Data ───

  async recordActualCalories(
    date: string,
    calories: number,
    steps: number = 0,
    activeMinutes: number = 0
  ): Promise<void> {
    // Update or insert history record
    const existingIndex = this.history.findIndex((r) => r.date === date);
    const record: DailyRecord = {
      date,
      calories,
      steps,
      activeMinutes,
      source: 'oura',
    };

    if (existingIndex >= 0) {
      this.history[existingIndex] = record;
    } else {
      this.history.push(record);
    }

    // Keep last 90 days
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 90);
    const cutoffStr = cutoff.toISOString().split('T')[0];
    this.history = this.history.filter((r) => r.date >= cutoffStr);

    // Update day-of-week pattern
    const dayOfWeek = new Date(date).getDay();
    const pattern = this.patterns[dayOfWeek];
    const newCount = pattern.sampleCount + 1;
    pattern.averageCalories =
      (pattern.averageCalories * pattern.sampleCount + calories) / newCount;
    pattern.sampleCount = newCount;

    await this.save();
  }

  // ─── Estimate ───

  /**
   * Estimate today's total calorie burn when Oura data isn't yet available.
   * Uses BMR + day-of-week activity patterns.
   */
  estimateCalories(date?: string): number {
    const targetDate = date ? new Date(date) : new Date();
    const dayOfWeek = targetDate.getDay();
    const pattern = this.patterns[dayOfWeek];

    if (pattern.sampleCount >= 3) {
      // Enough data — use historical pattern
      return Math.round(pattern.averageCalories);
    }

    // Not enough data — use BMR × activity multiplier
    // Assume light activity (1.375) as default
    return Math.round(this.bmr * 1.375);
  }

  /**
   * Get a more granular estimate based on time of day.
   * Early in the day we won't have full activity data yet.
   */
  estimateCaloriesAtTime(hourOfDay: number): number {
    const fullDayEstimate = this.estimateCalories();
    // Assume calories are burned roughly linearly throughout waking hours (6am-10pm = 16h)
    const wakingHours = 16;
    const hoursSinceWake = Math.max(0, Math.min(hourOfDay - 6, wakingHours));

    // BMR is constant, activity varies
    const bmrPortion = (this.bmr / 24) * hourOfDay;
    const activityPortion =
      ((fullDayEstimate - this.bmr) / wakingHours) * hoursSinceWake;

    return Math.round(bmrPortion + activityPortion);
  }

  // ─── Reconciliation ───

  /**
   * Compare estimated vs actual calories when Oura data arrives
   * and adjust future estimates.
   */
  async reconcile(date: string, actualCalories: number): Promise<number> {
    const estimated = this.estimateCalories(date);
    const difference = actualCalories - estimated;

    // Record actual
    await this.recordActualCalories(date, actualCalories);
    this.lastReconciliation = date;
    await this.save();

    return difference; // positive means we underestimated
  }

  // ─── Getters ───

  getBMR(): number {
    return this.bmr;
  }

  getHistory(): DailyRecord[] {
    return [...this.history];
  }

  getPatterns(): CaloriePattern[] {
    return [...this.patterns];
  }

  getLastReconciliation(): string | null {
    return this.lastReconciliation;
  }

  /**
   * Get weekly average calories from historical data.
   */
  getWeeklyAverage(): number {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString().split('T')[0];

    const recentRecords = this.history.filter(
      (r) => r.date >= weekAgoStr && r.source === 'oura'
    );

    if (recentRecords.length === 0) return this.estimateCalories();

    const total = recentRecords.reduce((sum, r) => sum + r.calories, 0);
    return Math.round(total / recentRecords.length);
  }
}

// Singleton instance
export const calorieEstimator = new OuraCalorieEstimator();
