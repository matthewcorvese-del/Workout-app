import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Dumbbell, Apple } from 'lucide-react-native';
import { useAppMode } from '@/contexts/AppModeContext';
import Colors from '@/constants/colors';
import NutritionColors from '@/constants/nutritionColors';

export default function TopNavigationRibbon() {
  const { mode, setMode, animationProgress } = useAppMode();

  const backgroundColor = animationProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [Colors.background, NutritionColors.background],
  });

  const indicatorLeft = animationProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '50%'],
  });

  const indicatorColor = animationProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [Colors.primary, NutritionColors.primary],
  });

  return (
    <Animated.View style={[styles.container, { backgroundColor }]}>
      <View style={styles.tabs}>
        <TouchableOpacity
          style={styles.tab}
          onPress={() => setMode('fitness')}
          activeOpacity={0.7}
        >
          <Dumbbell
            size={18}
            color={mode === 'fitness' ? Colors.primary : Colors.textMuted}
          />
          <Text
            style={[
              styles.tabText,
              mode === 'fitness' && { color: Colors.primary, fontWeight: '700' },
            ]}
          >
            Fitness
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tab}
          onPress={() => setMode('nutrition')}
          activeOpacity={0.7}
        >
          <Apple
            size={18}
            color={
              mode === 'nutrition'
                ? NutritionColors.primary
                : NutritionColors.textMuted
            }
          />
          <Text
            style={[
              styles.tabText,
              mode === 'nutrition' && {
                color: NutritionColors.primary,
                fontWeight: '700',
              },
            ]}
          >
            Nutrition
          </Text>
        </TouchableOpacity>
      </View>

      {/* Animated indicator */}
      <View style={styles.indicatorTrack}>
        <Animated.View
          style={[
            styles.indicator,
            {
              left: indicatorLeft,
              backgroundColor: indicatorColor,
            },
          ]}
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 4,
    paddingBottom: 0,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 8,
  },
  tabText: {
    fontSize: 15,
    color: '#64748B',
    fontWeight: '500',
  },
  indicatorTrack: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.05)',
    position: 'relative',
  },
  indicator: {
    position: 'absolute',
    width: '50%',
    height: '100%',
    borderRadius: 1.5,
  },
});
