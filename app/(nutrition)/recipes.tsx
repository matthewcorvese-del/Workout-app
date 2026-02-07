import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Search, Plus, ChefHat, Trash2, ChevronRight } from 'lucide-react-native';
import { useNutrition } from '@/contexts/NutritionContext';
import NutritionColors from '@/constants/nutritionColors';
import { Recipe, MealType } from '@/types/nutrition';

export default function RecipesScreen() {
  const { recipes, deleteRecipe, addFoodLog } = useNutrition();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = searchQuery.trim()
    ? recipes.filter((r) =>
        r.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : recipes;

  const handleQuickLog = (recipe: Recipe) => {
    const today = new Date().toISOString().split('T')[0];
    addFoodLog({
      foodItem: {
        id: `recipe_${recipe.id}`,
        name: recipe.name,
        servingSize: recipe.servings,
        servingUnit: 'serving',
        calories: recipe.totalMacros.calories / recipe.servings,
        protein: recipe.totalMacros.protein / recipe.servings,
        carbs: recipe.totalMacros.carbs / recipe.servings,
        fat: recipe.totalMacros.fat / recipe.servings,
        source: 'custom',
        isCustom: true,
      },
      mealType: 'lunch' as MealType,
      servings: 1,
      date: today,
    });
    Alert.alert('Logged!', `1 serving of ${recipe.name} added`);
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Recipe', 'Remove this recipe permanently?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteRecipe(id) },
    ]);
  };

  const renderRecipe = ({ item }: { item: Recipe }) => {
    const perServing = {
      calories: Math.round(item.totalMacros.calories / item.servings),
      protein: Math.round(item.totalMacros.protein / item.servings),
      carbs: Math.round(item.totalMacros.carbs / item.servings),
      fat: Math.round(item.totalMacros.fat / item.servings),
    };

    return (
      <View style={styles.recipeCard}>
        <TouchableOpacity
          style={styles.recipeMain}
          onPress={() => handleQuickLog(item)}
          activeOpacity={0.7}
        >
          <View style={styles.recipeInfo}>
            <Text style={styles.recipeName} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.recipeMeta}>
              {item.ingredients.length} ingredients · {item.servings} serving
              {item.servings !== 1 ? 's' : ''}
            </Text>
            <View style={styles.macroRow}>
              <Text style={[styles.macroTag, { color: NutritionColors.caloriesColor }]}>
                {perServing.calories} cal
              </Text>
              <Text style={[styles.macroTag, { color: NutritionColors.proteinColor }]}>
                P:{perServing.protein}g
              </Text>
              <Text style={[styles.macroTag, { color: NutritionColors.carbsColor }]}>
                C:{perServing.carbs}g
              </Text>
              <Text style={[styles.macroTag, { color: NutritionColors.fatColor }]}>
                F:{perServing.fat}g
              </Text>
            </View>
          </View>
          <ChevronRight size={18} color={NutritionColors.textMuted} />
        </TouchableOpacity>
        <View style={styles.recipeActions}>
          <TouchableOpacity
            style={styles.quickLogBtn}
            onPress={() => handleQuickLog(item)}
          >
            <Plus size={14} color="#fff" />
            <Text style={styles.quickLogText}>Quick Log</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => handleDelete(item.id)}
          >
            <Trash2 size={14} color={NutritionColors.danger} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Recipes</Text>
        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => router.push('/(nutrition)/create-recipe')}
          activeOpacity={0.7}
        >
          <Plus size={18} color="#fff" />
          <Text style={styles.createBtnText}>Create</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Search size={18} color={NutritionColors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search recipes..."
          placeholderTextColor={NutritionColors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={renderRecipe}
        ListEmptyComponent={
          <View style={styles.empty}>
            <ChefHat size={48} color={NutritionColors.textMuted} />
            <Text style={styles.emptyTitle}>No Recipes Yet</Text>
            <Text style={styles.emptyText}>
              Create recipes to quickly log complex meals with accurate macros
            </Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => router.push('/(nutrition)/create-recipe')}
            >
              <Plus size={18} color="#fff" />
              <Text style={styles.emptyBtnText}>Create Recipe</Text>
            </TouchableOpacity>
          </View>
        }
      />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: NutritionColors.text,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: NutritionColors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  createBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: NutritionColors.inputBackground,
    borderRadius: 10,
    paddingHorizontal: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: NutritionColors.text,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  recipeCard: {
    backgroundColor: NutritionColors.card,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: NutritionColors.cardBorder,
    overflow: 'hidden',
  },
  recipeMain: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 8,
  },
  recipeInfo: {
    flex: 1,
  },
  recipeName: {
    fontSize: 16,
    fontWeight: '700',
    color: NutritionColors.text,
  },
  recipeMeta: {
    fontSize: 12,
    color: NutritionColors.textSecondary,
    marginTop: 2,
  },
  macroRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  macroTag: {
    fontSize: 11,
    fontWeight: '600',
  },
  recipeActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: NutritionColors.cardBorder,
    alignItems: 'center',
  },
  quickLogBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 6,
    backgroundColor: NutritionColors.primary + '20',
  },
  quickLogText: {
    color: NutritionColors.primary,
    fontWeight: '600',
    fontSize: 13,
  },
  deleteBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderLeftWidth: 1,
    borderLeftColor: NutritionColors.cardBorder,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 80,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: NutritionColors.text,
  },
  emptyText: {
    fontSize: 14,
    color: NutritionColors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 20,
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: NutritionColors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
    marginTop: 8,
  },
  emptyBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});
