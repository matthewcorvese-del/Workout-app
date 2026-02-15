import React from 'react';
import { Tabs } from 'expo-router';
import { Home, Utensils, BookOpen, Settings } from 'lucide-react-native';
import NutritionColors from '@/constants/nutritionColors';
import TopNavigationRibbon from '@/components/TopNavigationRibbon';
import { View } from 'react-native';

export default function NutritionLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: NutritionColors.background }}>
      <TopNavigationRibbon />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: NutritionColors.tabBar,
            borderTopColor: NutritionColors.tabBarBorder,
            borderTopWidth: 1,
            height: 85,
            paddingBottom: 25,
            paddingTop: 8,
          },
          tabBarActiveTintColor: NutritionColors.tabActive,
          tabBarInactiveTintColor: NutritionColors.tabInactive,
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
          },
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size }) => (
              <Home size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="log"
          options={{
            title: 'Log',
            tabBarIcon: ({ color, size }) => (
              <Utensils size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="recipes"
          options={{
            title: 'Recipes',
            tabBarIcon: ({ color, size }) => (
              <BookOpen size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="create-recipe"
          options={{
            href: null, // Hidden from tab bar
          }}
        />
        <Tabs.Screen
          name="nutrition-settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ color, size }) => (
              <Settings size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}
