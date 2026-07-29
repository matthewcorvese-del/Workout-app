import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Plus, X, Trash2 } from 'lucide-react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { useNutrition } from '@/contexts/NutritionContext';
import NutritionColors from '@/constants/nutritionColors';
import { FoodSearchResult, MealType, FoodItem } from '@/types/nutrition';
import { getLocalDateKey } from '@/lib/localDate';

const mealOptions: { type: MealType; label: string; color: string }[] = [
  { type: 'breakfast', label: 'Breakfast', color: NutritionColors.breakfastColor },
  { type: 'lunch', label: 'Lunch', color: NutritionColors.lunchColor },
  { type: 'dinner', label: 'Dinner', color: NutritionColors.dinnerColor },
  { type: 'snack', label: 'Snack', color: NutritionColors.snackColor },
];

export default function LogScreen() {
  const { searchFoods, addFoodLog, todayLogs, deleteFoodLog } =
    useNutrition();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FoodSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<MealType>('lunch');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedFood, setSelectedFood] = useState<FoodSearchResult | null>(null);
  const [servings, setServings] = useState('1');

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setIsSearching(true);
    try {
      const results = await searchFoods(query.trim());
      setResults(results);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  }, [query, searchFoods]);

  const handleSelectFood = (food: FoodSearchResult) => {
    setSelectedFood(food);
    setServings('1');
    setShowAddModal(true);
  };

  const handleLogFood = () => {
    if (!selectedFood) return;
    const parsedServings = parseFloat(servings);
    if (!Number.isFinite(parsedServings) || parsedServings <= 0) {
      Alert.alert('Invalid Servings', 'Enter a serving amount greater than zero.');
      return;
    }
    const today = getLocalDateKey();

    const foodItem: FoodItem = {
      id: selectedFood.id,
      name: selectedFood.name,
      brand: selectedFood.brand,
      servingSize: selectedFood.servingSize,
      servingUnit: selectedFood.servingUnit,
      calories: selectedFood.calories,
      protein: selectedFood.protein,
      carbs: selectedFood.carbs,
      fat: selectedFood.fat,
      source: selectedFood.source,
      isCustom: selectedFood.source === 'custom',
    };

    addFoodLog({
      foodItem,
      mealType: selectedMeal,
      servings: parsedServings,
      date: today,
    });

    setShowAddModal(false);
    setSelectedFood(null);
    Alert.alert('Logged!', `${selectedFood.name} added to ${selectedMeal}`);
  };

  const handleDeleteLog = (id: string) => {
    deleteFoodLog(id);
  };

  const renderDeleteAction = (onDelete: () => void) => (
    <TouchableOpacity
      style={styles.swipeDeleteAction}
      onPress={onDelete}
      activeOpacity={0.8}
    >
      <Trash2 size={14} color="#fff" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <Text style={styles.headerTitle}>Log Food</Text>

      {/* Meal Selector */}
      <View style={styles.mealRow}>
        {mealOptions.map((m) => (
          <TouchableOpacity
            key={m.type}
            style={[
              styles.mealChip,
              selectedMeal === m.type && {
                backgroundColor: m.color,
                borderColor: m.color,
              },
            ]}
            onPress={() => setSelectedMeal(m.type)}
          >
            <Text
              style={[
                styles.mealChipText,
                selectedMeal === m.type && styles.mealChipTextActive,
              ]}
            >
              {m.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Search size={18} color={NutritionColors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search foods (USDA, custom)..."
          placeholderTextColor={NutritionColors.textMuted}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        {isSearching && <ActivityIndicator color={NutritionColors.primary} />}
      </View>

      {/* Search Results / Today's Log */}
      {results.length > 0 ? (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <Text style={styles.listHeader}>
              Search Results ({results.length})
            </Text>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.foodCard}
              onPress={() => handleSelectFood(item)}
              activeOpacity={0.7}
            >
              <View style={styles.foodInfo}>
                <Text style={styles.foodName} numberOfLines={1}>
                  {item.name}
                </Text>
                {item.brand && (
                  <Text style={styles.foodBrand}>{item.brand}</Text>
                )}
                <Text style={styles.foodServing}>
                  {item.servingSize}{item.servingUnit} · {item.source}
                </Text>
              </View>
              <View style={styles.foodMacros}>
                <Text style={styles.foodCalories}>{Math.round(item.calories)}</Text>
                <Text style={styles.foodCalLabel}>cal</Text>
                <View style={styles.foodMacroRow}>
                  <Text style={styles.foodMacroText}>
                    P:{Math.round(item.protein)}
                  </Text>
                  <Text style={styles.foodMacroText}>
                    C:{Math.round(item.carbs)}
                  </Text>
                  <Text style={styles.foodMacroText}>
                    F:{Math.round(item.fat)}
                  </Text>
                </View>
              </View>
              <Plus size={18} color={NutritionColors.primary} />
            </TouchableOpacity>
          )}
        />
      ) : (
        <FlatList
          data={todayLogs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            todayLogs.length > 0 ? (
              <Text style={styles.listHeader}>
                Today&apos;s Log ({todayLogs.length})
              </Text>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Search size={40} color={NutritionColors.textMuted} />
              <Text style={styles.emptyTitle}>Search for food to log</Text>
              <Text style={styles.emptyText}>
                Search the USDA database or your custom foods
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <Swipeable
              overshootRight={false}
              renderRightActions={() =>
                renderDeleteAction(() => handleDeleteLog(item.id))
              }
            >
              <TouchableOpacity style={styles.logCard} activeOpacity={0.8}>
                <View
                  style={[
                    styles.mealIndicator,
                    {
                      backgroundColor:
                        mealOptions.find((m) => m.type === item.mealType)
                          ?.color || NutritionColors.primary,
                    },
                  ]}
                />
                <View style={styles.logInfo}>
                  <Text style={styles.logName} numberOfLines={1}>
                    {item.foodItem.name}
                  </Text>
                  <Text style={styles.logMeta}>
                    {item.servings} serving{item.servings !== 1 ? 's' : ''} ·{' '}
                    {item.mealType}
                  </Text>
                </View>
                <Text style={styles.logCalories}>{item.calories} cal</Text>
              </TouchableOpacity>
            </Swipeable>
          )}
        />
      )}

      {/* Add Food Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Log Food</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <X size={24} color={NutritionColors.text} />
              </TouchableOpacity>
            </View>

            {selectedFood && (
              <View style={styles.modalBody}>
                <Text style={styles.modalFoodName}>{selectedFood.name}</Text>
                {selectedFood.brand && (
                  <Text style={styles.modalFoodBrand}>
                    {selectedFood.brand}
                  </Text>
                )}

                <View style={styles.servingsRow}>
                  <Text style={styles.servingsLabel}>Servings</Text>
                  <TextInput
                    style={styles.servingsInput}
                    value={servings}
                    onChangeText={setServings}
                    keyboardType="decimal-pad"
                    selectTextOnFocus
                  />
                </View>

                <View style={styles.macroPreview}>
                  <View style={styles.macroPreviewItem}>
                    <Text style={styles.macroPreviewValue}>
                      {Math.round(
                        selectedFood.calories * (parseFloat(servings) || 1)
                      )}
                    </Text>
                    <Text style={styles.macroPreviewLabel}>Calories</Text>
                  </View>
                  <View style={styles.macroPreviewItem}>
                    <Text style={styles.macroPreviewValue}>
                      {Math.round(
                        selectedFood.protein * (parseFloat(servings) || 1)
                      )}g
                    </Text>
                    <Text style={styles.macroPreviewLabel}>Protein</Text>
                  </View>
                  <View style={styles.macroPreviewItem}>
                    <Text style={styles.macroPreviewValue}>
                      {Math.round(
                        selectedFood.carbs * (parseFloat(servings) || 1)
                      )}g
                    </Text>
                    <Text style={styles.macroPreviewLabel}>Carbs</Text>
                  </View>
                  <View style={styles.macroPreviewItem}>
                    <Text style={styles.macroPreviewValue}>
                      {Math.round(
                        selectedFood.fat * (parseFloat(servings) || 1)
                      )}g
                    </Text>
                    <Text style={styles.macroPreviewLabel}>Fat</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.logBtn}
                  onPress={handleLogFood}
                  activeOpacity={0.7}
                >
                  <Text style={styles.logBtnText}>
                    Log to {selectedMeal.charAt(0).toUpperCase() + selectedMeal.slice(1)}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: NutritionColors.background,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: NutritionColors.text,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  mealRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 6,
  },
  mealChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: NutritionColors.card,
    borderWidth: 1,
    borderColor: NutritionColors.cardBorder,
  },
  mealChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: NutritionColors.textSecondary,
  },
  mealChipTextActive: {
    color: '#fff',
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
  listHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: NutritionColors.textSecondary,
    marginBottom: 8,
  },
  foodCard: {
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
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: 14,
    fontWeight: '600',
    color: NutritionColors.text,
  },
  foodBrand: {
    fontSize: 12,
    color: NutritionColors.textSecondary,
  },
  foodServing: {
    fontSize: 11,
    color: NutritionColors.textMuted,
    marginTop: 2,
  },
  foodMacros: {
    alignItems: 'flex-end',
  },
  foodCalories: {
    fontSize: 16,
    fontWeight: '800',
    color: NutritionColors.caloriesColor,
  },
  foodCalLabel: {
    fontSize: 10,
    color: NutritionColors.textMuted,
  },
  foodMacroRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 2,
  },
  foodMacroText: {
    fontSize: 10,
    color: NutritionColors.textSecondary,
  },
  logCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: NutritionColors.card,
    borderRadius: 10,
    padding: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: NutritionColors.cardBorder,
  },
  swipeDeleteAction: {
    width: 64,
    marginBottom: 6,
    borderRadius: 10,
    backgroundColor: NutritionColors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealIndicator: {
    width: 4,
    height: 28,
    borderRadius: 2,
    marginRight: 10,
  },
  logInfo: {
    flex: 1,
  },
  logName: {
    fontSize: 14,
    fontWeight: '600',
    color: NutritionColors.text,
  },
  logMeta: {
    fontSize: 12,
    color: NutritionColors.textSecondary,
    marginTop: 2,
  },
  logCalories: {
    fontSize: 15,
    fontWeight: '700',
    color: NutritionColors.caloriesColor,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: NutritionColors.text,
  },
  emptyText: {
    fontSize: 14,
    color: NutritionColors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: NutritionColors.modalBackground,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: NutritionColors.text,
  },
  modalBody: {
    gap: 12,
  },
  modalFoodName: {
    fontSize: 17,
    fontWeight: '700',
    color: NutritionColors.text,
  },
  modalFoodBrand: {
    fontSize: 14,
    color: NutritionColors.textSecondary,
    marginTop: -4,
  },
  servingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  servingsLabel: {
    fontSize: 15,
    color: NutritionColors.text,
    fontWeight: '500',
  },
  servingsInput: {
    backgroundColor: NutritionColors.inputBackground,
    borderWidth: 1,
    borderColor: NutritionColors.inputBorder,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    color: NutritionColors.text,
    fontWeight: '700',
    width: 80,
    textAlign: 'center',
  },
  macroPreview: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  macroPreviewItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: NutritionColors.card,
    borderRadius: 8,
    padding: 10,
  },
  macroPreviewValue: {
    fontSize: 16,
    fontWeight: '700',
    color: NutritionColors.text,
  },
  macroPreviewLabel: {
    fontSize: 11,
    color: NutritionColors.textSecondary,
    marginTop: 2,
  },
  logBtn: {
    backgroundColor: NutritionColors.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  logBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
