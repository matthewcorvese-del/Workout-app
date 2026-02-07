import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  FoodItem,
  FoodLogEntry,
  MealType,
  MacroGoals,
  MacroTotals,
  DailySummary,
  Recipe,
  RecipeIngredient,
  FoodSearchResult,
  NutritionSettings,
} from '@/types/nutrition';

const FOOD_LOGS_KEY = 'food_logs';
const RECIPES_KEY = 'recipes';
const CUSTOM_FOODS_KEY = 'custom_foods';
const NUTRITION_SETTINGS_KEY = 'nutrition_settings';

// ─── Types ───

interface NutritionContextValue {
  // Food log
  todayLogs: FoodLogEntry[];
  getLogsForDate: (date: string) => FoodLogEntry[];
  addFoodLog: (entry: Omit<FoodLogEntry, 'id' | 'loggedAt' | 'calories' | 'protein' | 'carbs' | 'fat'>) => void;
  updateFoodLog: (id: string, update: Partial<FoodLogEntry>) => void;
  deleteFoodLog: (id: string) => void;

  // Daily summary
  getDailySummary: (date: string) => DailySummary;
  todaySummary: DailySummary;

  // Recipes
  recipes: Recipe[];
  createRecipe: (recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt' | 'totals' | 'perServing'>) => Recipe;
  updateRecipe: (id: string, update: Partial<Recipe>) => void;
  deleteRecipe: (id: string) => void;

  // Custom foods
  customFoods: FoodItem[];
  addCustomFood: (food: Omit<FoodItem, 'id' | 'isCustom' | 'source'>) => FoodItem;
  deleteCustomFood: (id: string) => void;

  // Search
  searchFoods: (query: string) => Promise<FoodSearchResult[]>;
  searchByBarcode: (barcode: string) => Promise<FoodSearchResult | null>;

  // Settings
  nutritionSettings: NutritionSettings;
  updateNutritionSettings: (update: Partial<NutritionSettings>) => void;

  // Loading
  isLoaded: boolean;
}

const NutritionContext = createContext<NutritionContextValue | undefined>(undefined);

// ─── Helpers ───

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

function calculateMacros(food: FoodItem, servings: number): MacroTotals {
  return {
    calories: Math.round(food.calories * servings),
    protein: Math.round(food.protein * servings * 10) / 10,
    carbs: Math.round(food.carbs * servings * 10) / 10,
    fat: Math.round(food.fat * servings * 10) / 10,
  };
}

function calculateRecipeTotals(ingredients: RecipeIngredient[]): MacroTotals {
  return ingredients.reduce(
    (totals, ing) => ({
      calories: totals.calories + ing.calories,
      protein: totals.protein + ing.protein,
      carbs: totals.carbs + ing.carbs,
      fat: totals.fat + ing.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

const defaultNutritionSettings: NutritionSettings = {
  calorieGoal: 2000,
  proteinGoal: 150,
  carbsGoal: 250,
  fatGoal: 65,
  useOuraCalories: false,
};

// ─── Provider ───

export function NutritionProvider({ children }: { children: React.ReactNode }) {
  const [allLogs, setAllLogs] = useState<FoodLogEntry[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [customFoods, setCustomFoods] = useState<FoodItem[]>([]);
  const [nutritionSettings, setNutritionSettings] = useState<NutritionSettings>(defaultNutritionSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load data on mount
  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(FOOD_LOGS_KEY),
      AsyncStorage.getItem(RECIPES_KEY),
      AsyncStorage.getItem(CUSTOM_FOODS_KEY),
      AsyncStorage.getItem(NUTRITION_SETTINGS_KEY),
    ]).then(([logsRaw, recipesRaw, foodsRaw, settingsRaw]) => {
      if (logsRaw) { try { setAllLogs(JSON.parse(logsRaw)); } catch {} }
      if (recipesRaw) { try { setRecipes(JSON.parse(recipesRaw)); } catch {} }
      if (foodsRaw) { try { setCustomFoods(JSON.parse(foodsRaw)); } catch {} }
      if (settingsRaw) {
        try {
          setNutritionSettings({ ...defaultNutritionSettings, ...JSON.parse(settingsRaw) });
        } catch {}
      }
      setIsLoaded(true);
    });
  }, []);

  // Persistence helpers
  const persistLogs = useCallback((logs: FoodLogEntry[]) => {
    AsyncStorage.setItem(FOOD_LOGS_KEY, JSON.stringify(logs));
  }, []);

  const persistRecipes = useCallback((r: Recipe[]) => {
    AsyncStorage.setItem(RECIPES_KEY, JSON.stringify(r));
  }, []);

  const persistCustomFoods = useCallback((f: FoodItem[]) => {
    AsyncStorage.setItem(CUSTOM_FOODS_KEY, JSON.stringify(f));
  }, []);

  const persistNutritionSettings = useCallback((s: NutritionSettings) => {
    AsyncStorage.setItem(NUTRITION_SETTINGS_KEY, JSON.stringify(s));
  }, []);

  // ─── Food Logs ───

  const today = getToday();
  const todayLogs = allLogs.filter((l) => l.date === today);

  const getLogsForDate = useCallback(
    (date: string) => allLogs.filter((l) => l.date === date),
    [allLogs]
  );

  const addFoodLog = useCallback(
    (entry: Omit<FoodLogEntry, 'id' | 'loggedAt' | 'calories' | 'protein' | 'carbs' | 'fat'>) => {
      const macros = calculateMacros(entry.foodItem, entry.servings);
      const newEntry: FoodLogEntry = {
        ...entry,
        id: generateId(),
        loggedAt: new Date().toISOString(),
        ...macros,
      };
      setAllLogs((prev) => {
        const next = [...prev, newEntry];
        persistLogs(next);
        return next;
      });
    },
    [persistLogs]
  );

  const updateFoodLog = useCallback(
    (id: string, update: Partial<FoodLogEntry>) => {
      setAllLogs((prev) => {
        const next = prev.map((l) => {
          if (l.id !== id) return l;
          const updated = { ...l, ...update };
          if (update.servings !== undefined || update.foodItem) {
            const macros = calculateMacros(
              updated.foodItem,
              updated.servings
            );
            return { ...updated, ...macros };
          }
          return updated;
        });
        persistLogs(next);
        return next;
      });
    },
    [persistLogs]
  );

  const deleteFoodLog = useCallback(
    (id: string) => {
      setAllLogs((prev) => {
        const next = prev.filter((l) => l.id !== id);
        persistLogs(next);
        return next;
      });
    },
    [persistLogs]
  );

  // ─── Daily Summary ───

  const getDailySummary = useCallback(
    (date: string): DailySummary => {
      const logs = allLogs.filter((l) => l.date === date);
      const meals = {
        breakfast: logs.filter((l) => l.mealType === 'breakfast'),
        lunch: logs.filter((l) => l.mealType === 'lunch'),
        dinner: logs.filter((l) => l.mealType === 'dinner'),
        snack: logs.filter((l) => l.mealType === 'snack'),
      };

      const totals: MacroTotals = logs.reduce(
        (acc, l) => ({
          calories: acc.calories + l.calories,
          protein: acc.protein + l.protein,
          carbs: acc.carbs + l.carbs,
          fat: acc.fat + l.fat,
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      );

      return {
        date,
        meals,
        totals,
        goals: {
          calories: nutritionSettings.calorieGoal,
          protein: nutritionSettings.proteinGoal,
          carbs: nutritionSettings.carbsGoal,
          fat: nutritionSettings.fatGoal,
        },
      };
    },
    [allLogs, nutritionSettings]
  );

  const todaySummary = getDailySummary(today);

  // ─── Recipes ───

  const createRecipe = useCallback(
    (
      input: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt' | 'totals' | 'perServing'>
    ): Recipe => {
      const totals = calculateRecipeTotals(input.ingredients);
      const servings = Math.max(input.servings, 1);
      const perServing: MacroTotals = {
        calories: Math.round(totals.calories / servings),
        protein: Math.round((totals.protein / servings) * 10) / 10,
        carbs: Math.round((totals.carbs / servings) * 10) / 10,
        fat: Math.round((totals.fat / servings) * 10) / 10,
      };

      const recipe: Recipe = {
        ...input,
        id: generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        totals,
        perServing,
      };

      setRecipes((prev) => {
        const next = [...prev, recipe];
        persistRecipes(next);
        return next;
      });
      return recipe;
    },
    [persistRecipes]
  );

  const updateRecipe = useCallback(
    (id: string, update: Partial<Recipe>) => {
      setRecipes((prev) => {
        const next = prev.map((r) => {
          if (r.id !== id) return r;
          const updated = { ...r, ...update, updatedAt: new Date().toISOString() };
          // Recalculate totals if ingredients changed
          if (update.ingredients) {
            const totals = calculateRecipeTotals(update.ingredients);
            const servings = Math.max(updated.servings, 1);
            updated.totals = totals;
            updated.perServing = {
              calories: Math.round(totals.calories / servings),
              protein: Math.round((totals.protein / servings) * 10) / 10,
              carbs: Math.round((totals.carbs / servings) * 10) / 10,
              fat: Math.round((totals.fat / servings) * 10) / 10,
            };
          }
          return updated;
        });
        persistRecipes(next);
        return next;
      });
    },
    [persistRecipes]
  );

  const deleteRecipe = useCallback(
    (id: string) => {
      setRecipes((prev) => {
        const next = prev.filter((r) => r.id !== id);
        persistRecipes(next);
        return next;
      });
    },
    [persistRecipes]
  );

  // ─── Custom Foods ───

  const addCustomFood = useCallback(
    (food: Omit<FoodItem, 'id' | 'isCustom' | 'source'>): FoodItem => {
      const newFood: FoodItem = {
        ...food,
        id: generateId(),
        isCustom: true,
        source: 'custom',
      };
      setCustomFoods((prev) => {
        const next = [...prev, newFood];
        persistCustomFoods(next);
        return next;
      });
      return newFood;
    },
    [persistCustomFoods]
  );

  const deleteCustomFood = useCallback(
    (id: string) => {
      setCustomFoods((prev) => {
        const next = prev.filter((f) => f.id !== id);
        persistCustomFoods(next);
        return next;
      });
    },
    [persistCustomFoods]
  );

  // ─── Food Search ───

  const searchFoods = useCallback(
    async (query: string): Promise<FoodSearchResult[]> => {
      const results: FoodSearchResult[] = [];

      // Search custom foods first
      const lowerQuery = query.toLowerCase();
      customFoods
        .filter((f) => f.name.toLowerCase().includes(lowerQuery))
        .forEach((f) => {
          results.push({
            id: f.id,
            name: f.name,
            brand: f.brand,
            calories: f.calories,
            protein: f.protein,
            carbs: f.carbs,
            fat: f.fat,
            servingSize: f.servingSize,
            servingUnit: f.servingUnit,
            source: 'custom',
          });
        });

      // Search recipe-based foods
      recipes
        .filter((r) => r.name.toLowerCase().includes(lowerQuery))
        .forEach((r) => {
          results.push({
            id: r.id,
            name: r.name,
            calories: r.perServing.calories,
            protein: r.perServing.protein,
            carbs: r.perServing.carbs,
            fat: r.perServing.fat,
            servingSize: 1,
            servingUnit: 'serving',
            source: 'recipe',
          });
        });

      // Search USDA FoodData Central
      try {
        const usdaUrl = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(query)}&pageSize=10&api_key=DEMO_KEY`;
        const response = await fetch(usdaUrl);
        if (response.ok) {
          const data = await response.json();
          if (data.foods) {
            data.foods.forEach((food: Record<string, any>) => {
              const nutrients = food.foodNutrients || [];
              const calories = nutrients.find((n: any) => n.nutrientId === 1008)?.value || 0;
              const protein = nutrients.find((n: any) => n.nutrientId === 1003)?.value || 0;
              const carbs = nutrients.find((n: any) => n.nutrientId === 1005)?.value || 0;
              const fat = nutrients.find((n: any) => n.nutrientId === 1004)?.value || 0;

              results.push({
                id: `usda-${food.fdcId}`,
                name: food.description || food.lowercaseDescription || 'Unknown',
                brand: food.brandName || food.brandOwner,
                calories,
                protein,
                carbs,
                fat,
                servingSize: 100,
                servingUnit: 'g',
                source: 'usda',
                fdcId: food.fdcId,
              });
            });
          }
        }
      } catch (err) {
        console.warn('USDA API search failed:', err);
      }

      return results;
    },
    [customFoods, recipes]
  );

  const searchByBarcode = useCallback(
    async (barcode: string): Promise<FoodSearchResult | null> => {
      try {
        const response = await fetch(
          `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`
        );
        if (!response.ok) return null;

        const data = await response.json();
        if (data.status !== 1 || !data.product) return null;

        const product = data.product;
        const nutrients = product.nutriments || {};

        return {
          id: `off-${barcode}`,
          name: product.product_name || 'Unknown Product',
          brand: product.brands,
          calories: nutrients['energy-kcal_100g'] || 0,
          protein: nutrients.proteins_100g || 0,
          carbs: nutrients.carbohydrates_100g || 0,
          fat: nutrients.fat_100g || 0,
          servingSize: 100,
          servingUnit: 'g',
          source: 'openfoodfacts',
          barcode,
        };
      } catch (err) {
        console.warn('OpenFoodFacts lookup failed:', err);
        return null;
      }
    },
    []
  );

  // ─── Nutrition Settings ───

  const updateNutritionSettings = useCallback(
    (update: Partial<NutritionSettings>) => {
      setNutritionSettings((prev) => {
        const next = { ...prev, ...update };
        persistNutritionSettings(next);
        return next;
      });
    },
    [persistNutritionSettings]
  );

  return (
    <NutritionContext.Provider
      value={{
        todayLogs,
        getLogsForDate,
        addFoodLog,
        updateFoodLog,
        deleteFoodLog,
        getDailySummary,
        todaySummary,
        recipes,
        createRecipe,
        updateRecipe,
        deleteRecipe,
        customFoods,
        addCustomFood,
        deleteCustomFood,
        searchFoods,
        searchByBarcode,
        nutritionSettings,
        updateNutritionSettings,
        isLoaded,
      }}
    >
      {children}
    </NutritionContext.Provider>
  );
}

export function useNutrition(): NutritionContextValue {
  const ctx = useContext(NutritionContext);
  if (!ctx) throw new Error('useNutrition must be used within NutritionProvider');
  return ctx;
}
