// ─── Nutrition Types ───

export interface FoodItem {
  id: string;
  name: string;
  brand?: string;
  servingSize: number;
  servingUnit: string;
  calories: number;
  protein: number;   // grams
  carbs: number;     // grams
  fat: number;       // grams
  fiber?: number;    // grams
  sugar?: number;    // grams
  sodium?: number;   // mg
  cholesterol?: number; // mg
  barcode?: string;
  source: FoodSource;
  isCustom: boolean;
}

export type FoodSource = 'usda' | 'openfoodfacts' | 'custom' | 'recipe';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface FoodLogEntry {
  id: string;
  foodItem: FoodItem;
  mealType: MealType;
  servings: number;
  date: string;      // YYYY-MM-DD
  loggedAt: string;   // ISO date
  calories: number;   // computed: foodItem.calories * servings
  protein: number;
  carbs: number;
  fat: number;
}

// ─── Daily Summary ───

export interface DailySummary {
  date: string;       // YYYY-MM-DD
  meals: {
    breakfast: FoodLogEntry[];
    lunch: FoodLogEntry[];
    dinner: FoodLogEntry[];
    snack: FoodLogEntry[];
  };
  totals: MacroTotals;
  goals: MacroGoals;
  caloriesBurned?: number;
  netCalories?: number;
}

export interface MacroTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
}

export interface MacroGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

// ─── Recipes ───

export interface Recipe {
  id: string;
  name: string;
  description?: string;
  ingredients: RecipeIngredient[];
  servings: number;
  prepTime?: number;    // minutes
  cookTime?: number;    // minutes
  instructions?: string[];
  totals: MacroTotals;
  perServing: MacroTotals;
  createdAt: string;
  updatedAt: string;
  imageUri?: string;
}

export interface RecipeIngredient {
  id: string;
  foodItem: FoodItem;
  servings: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

// ─── Food Search ───

export interface FoodSearchResult {
  id: string;
  name: string;
  brand?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: number;
  servingUnit: string;
  source: FoodSource;
  fdcId?: number;
  barcode?: string;
}

// ─── Nutrition Settings ───

export interface NutritionSettings {
  calorieGoal: number;
  proteinGoal: number;
  carbsGoal: number;
  fatGoal: number;
  useOuraCalories: boolean; // use Oura data for calorie burn estimates
}
