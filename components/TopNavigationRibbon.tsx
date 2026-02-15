import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Dumbbell, Apple } from 'lucide-react-native';
import Animated, { interpolateColor, useAnimatedStyle } from 'react-native-reanimated';
import { useAppMode } from '@/contexts/AppModeContext';
import Colors from '@/constants/colors';
import NutritionColors from '@/constants/nutritionColors';

function TopNavigationRibbon() {
  const { mode, setMode, animationProgress } = useAppMode();
  const insets = useSafeAreaInsets();
  const [indicatorTrackWidth, setIndicatorTrackWidth] = useState(0);

  const containerAnimatedStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: interpolateColor(
        animationProgress.value,
        [0, 1],
        [Colors.background, NutritionColors.background]
      ),
    };
  });

  const indicatorAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: (indicatorTrackWidth / 2) * animationProgress.value }],
      backgroundColor: interpolateColor(
        animationProgress.value,
        [0, 1],
        [Colors.primary, NutritionColors.primary]
      ),
    };
  });

  const handleIndicatorTrackLayout = (event: any) => {
    setIndicatorTrackWidth(event.nativeEvent.layout.width);
  };

  return (
    <Animated.View
      style={[
        styles.container,
        containerAnimatedStyle,
        { paddingTop: insets.top + 4 },
      ]}
    >
      <View style={styles.tabs}>
        <TouchableOpacity
          style={styles.tab}
          onPress={() => setMode('fitness')}
          activeOpacity={0.7}
          accessible
          accessibilityRole="tab"
          accessibilityLabel="Fitness mode"
          accessibilityState={{ selected: mode === 'fitness' }}
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
          accessible
          accessibilityRole="tab"
          accessibilityLabel="Nutrition mode"
          accessibilityState={{ selected: mode === 'nutrition' }}
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
      <View style={styles.indicatorTrack} onLayout={handleIndicatorTrackLayout}>
        <Animated.View
          style={[
            styles.indicator,
            indicatorAnimatedStyle,
          ]}
        />
      </View>
    </Animated.View>
  );
}

export default React.memo(TopNavigationRibbon);

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
