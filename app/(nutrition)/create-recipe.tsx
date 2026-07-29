import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Search,
  Plus,
  X,
  Minus,
  Save,
} from 'lucide-react-native';
import { useNutrition } from '@/contexts/NutritionContext';
import NutritionColors from '@/constants/nutritionColors';
import { RecipeIngredient, FoodSearchResult } from '@/types/nutrition';

export default function CreateRecipeScreen() {
  const { searchFoods, createRecipe } = useNutrition();
  const router = useRouter();

  const [name, setName] = useState('');
  const [servings, setServings] = useState('1');
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FoodSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const totalMacros = useMemo(() => {
    return ingredients.reduce(
      (acc, ing) => ({
        calories: acc.calories + ing.calories * ing.servings,
        protein: acc.protein + ing.protein * ing.servings,
        carbs: acc.carbs + ing.carbs * ing.servings,
        fat: acc.fat + ing.fat * ing.servings,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [ingredients]);

  const perServing = useMemo(() => {
    const s = parseFloat(servings) || 1;
    return {
      calories: Math.round(totalMacros.calories / s),
      protein: Math.round(totalMacros.protein / s),
      carbs: Math.round(totalMacros.carbs / s),
      fat: Math.round(totalMacros.fat / s),
    };
  }, [totalMacros, servings]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const results = await searchFoods(searchQuery.trim());
      setSearchResults(results);
    } catch {
      // fail silently
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddIngredient = (food: FoodSearchResult) => {
    const newIngredient: RecipeIngredient = {
      id: `ing_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      foodItem: {
        id: food.id,
        name: food.name,
        brand: food.brand,
        servingSize: food.servingSize,
        servingUnit: food.servingUnit,
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fat: food.fat,
        source: food.source,
        isCustom: food.source === 'custom',
      },
      servings: 1,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
    };
    setIngredients((prev) => [...prev, newIngredient]);
    setShowSearch(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateServings = (index: number, delta: number) => {
    setIngredients((prev) =>
      prev.map((ing, i) => {
        if (i !== index) return ing;
        const newServings = Math.max(0.25, ing.servings + delta);
        return { ...ing, servings: newServings };
      })
    );
  };

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Missing Name', 'Please enter a recipe name.');
      return;
    }
    if (ingredients.length === 0) {
      Alert.alert(
        'No Ingredients',
        'Add at least one ingredient to your recipe.'
      );
      return;
    }
    const parsedServings = parseFloat(servings);
    if (!Number.isFinite(parsedServings) || parsedServings <= 0) {
      Alert.alert('Invalid Servings', 'Enter a serving amount greater than zero.');
      return;
    }

    createRecipe({
      name: name.trim(),
      servings: parsedServings,
      ingredients,
    });

    Alert.alert('Recipe Saved!', '', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color={NutritionColors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Recipe</Text>
          <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
            <Save size={16} color="#fff" />
            <Text style={styles.saveBtnText}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.body}>
          {/* Recipe Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Recipe Name</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Chicken Stir Fry"
              placeholderTextColor={NutritionColors.textMuted}
              value={name}
              onChangeText={setName}
            />
          </View>

          {/* Servings */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Servings</Text>
            <TextInput
              style={[styles.textInput, { width: 100 }]}
              value={servings}
              onChangeText={setServings}
              keyboardType="decimal-pad"
              selectTextOnFocus
            />
          </View>

          {/* Macro Summary */}
          <View style={styles.macroSummary}>
            <Text style={styles.macroSummaryTitle}>Per Serving</Text>
            <View style={styles.macroRow}>
              <View style={styles.macroItem}>
                <Text
                  style={[
                    styles.macroValue,
                    { color: NutritionColors.caloriesColor },
                  ]}
                >
                  {perServing.calories}
                </Text>
                <Text style={styles.macroLabel}>cal</Text>
              </View>
              <View style={styles.macroItem}>
                <Text
                  style={[
                    styles.macroValue,
                    { color: NutritionColors.proteinColor },
                  ]}
                >
                  {perServing.protein}g
                </Text>
                <Text style={styles.macroLabel}>protein</Text>
              </View>
              <View style={styles.macroItem}>
                <Text
                  style={[
                    styles.macroValue,
                    { color: NutritionColors.carbsColor },
                  ]}
                >
                  {perServing.carbs}g
                </Text>
                <Text style={styles.macroLabel}>carbs</Text>
              </View>
              <View style={styles.macroItem}>
                <Text
                  style={[
                    styles.macroValue,
                    { color: NutritionColors.fatColor },
                  ]}
                >
                  {perServing.fat}g
                </Text>
                <Text style={styles.macroLabel}>fat</Text>
              </View>
            </View>
          </View>

          {/* Ingredients */}
          <View style={styles.inputGroup}>
            <View style={styles.ingredientHeader}>
              <Text style={styles.label}>
                Ingredients ({ingredients.length})
              </Text>
              <TouchableOpacity
                style={styles.addIngBtn}
                onPress={() => setShowSearch(true)}
              >
                <Plus size={16} color="#fff" />
                <Text style={styles.addIngText}>Add</Text>
              </TouchableOpacity>
            </View>

            {ingredients.map((ing, index) => (
              <View key={index} style={styles.ingredientCard}>
                <View style={styles.ingredientInfo}>
                  <Text style={styles.ingredientName} numberOfLines={1}>
                    {ing.foodItem.name}
                  </Text>
                  <Text style={styles.ingredientMacros}>
                    {Math.round(ing.calories * ing.servings)} cal · P:
                    {Math.round(ing.protein * ing.servings)}g · C:
                    {Math.round(ing.carbs * ing.servings)}g · F:
                    {Math.round(ing.fat * ing.servings)}g
                  </Text>
                </View>
                <View style={styles.ingredientActions}>
                  <TouchableOpacity
                    onPress={() => handleUpdateServings(index, -0.25)}
                  >
                    <Minus size={16} color={NutritionColors.textSecondary} />
                  </TouchableOpacity>
                  <Text style={styles.ingredientServings}>
                    {ing.servings}
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleUpdateServings(index, 0.25)}
                  >
                    <Plus size={16} color={NutritionColors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleRemoveIngredient(index)}
                    style={{ marginLeft: 8 }}
                  >
                    <X size={16} color={NutritionColors.error} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {ingredients.length === 0 && (
              <Text style={styles.noIngredients}>
                Tap &quot;Add&quot; to search and add ingredients
              </Text>
            )}
          </View>
        </ScrollView>

        {/* Search Modal Overlay */}
        {showSearch && (
          <View style={styles.searchOverlay}>
            <View style={styles.searchHeader}>
              <Text style={styles.searchTitle}>Add Ingredient</Text>
              <TouchableOpacity onPress={() => setShowSearch(false)}>
                <X size={24} color={NutritionColors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.searchBar}>
              <Search size={18} color={NutritionColors.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search foods..."
                placeholderTextColor={NutritionColors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
                autoFocus
              />
              {isSearching && (
                <ActivityIndicator color={NutritionColors.primary} />
              )}
            </View>

            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingBottom: 20 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.searchResult}
                  onPress={() => handleAddIngredient(item)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.searchResultName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.searchResultMeta}>
                      {Math.round(item.calories)} cal ·{' '}
                      {item.servingSize}{item.servingUnit}
                    </Text>
                  </View>
                  <Plus size={18} color={NutritionColors.primary} />
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.searchEmpty}>
                  {searchQuery.trim()
                    ? 'No results found'
                    : 'Type to search for ingredients'}
                </Text>
              }
            />
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: NutritionColors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: NutritionColors.text,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: NutritionColors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  body: {
    padding: 16,
    gap: 16,
    paddingBottom: 100,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: NutritionColors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: NutritionColors.inputBackground,
    borderWidth: 1,
    borderColor: NutritionColors.inputBorder,
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: NutritionColors.text,
  },
  macroSummary: {
    backgroundColor: NutritionColors.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: NutritionColors.cardBorder,
  },
  macroSummaryTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: NutritionColors.textSecondary,
    marginBottom: 8,
    textAlign: 'center',
  },
  macroRow: {
    flexDirection: 'row',
    gap: 8,
  },
  macroItem: {
    flex: 1,
    alignItems: 'center',
  },
  macroValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  macroLabel: {
    fontSize: 11,
    color: NutritionColors.textMuted,
    marginTop: 2,
  },
  ingredientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addIngBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: NutritionColors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  addIngText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  ingredientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: NutritionColors.card,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: NutritionColors.cardBorder,
  },
  ingredientInfo: {
    flex: 1,
  },
  ingredientName: {
    fontSize: 14,
    fontWeight: '600',
    color: NutritionColors.text,
  },
  ingredientMacros: {
    fontSize: 11,
    color: NutritionColors.textSecondary,
    marginTop: 2,
  },
  ingredientActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ingredientServings: {
    fontSize: 14,
    fontWeight: '700',
    color: NutritionColors.text,
    minWidth: 30,
    textAlign: 'center',
  },
  noIngredients: {
    fontSize: 14,
    color: NutritionColors.textMuted,
    textAlign: 'center',
    paddingVertical: 20,
  },
  // Search overlay
  searchOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: NutritionColors.background,
    padding: 16,
  },
  searchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  searchTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: NutritionColors.text,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: NutritionColors.inputBackground,
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: NutritionColors.text,
  },
  searchResult: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: NutritionColors.card,
    borderRadius: 10,
    padding: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: NutritionColors.cardBorder,
    gap: 8,
  },
  searchResultName: {
    fontSize: 14,
    fontWeight: '600',
    color: NutritionColors.text,
  },
  searchResultMeta: {
    fontSize: 12,
    color: NutritionColors.textSecondary,
    marginTop: 2,
  },
  searchEmpty: {
    fontSize: 14,
    color: NutritionColors.textMuted,
    textAlign: 'center',
    paddingTop: 30,
  },
});
