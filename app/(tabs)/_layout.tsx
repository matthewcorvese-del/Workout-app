import React from 'react';
import { Tabs } from 'expo-router';
import { Dumbbell, BarChart3, Settings, BookOpen } from 'lucide-react-native';
import { useAppMode } from '@/contexts/AppModeContext';
import Colors from '@/constants/colors';
import TopNavigationRibbon from '@/components/TopNavigationRibbon';
import { View } from 'react-native';

export default function TabsLayout() {
  const { mode } = useAppMode();

  // When in nutrition mode, this tab navigator shouldn't be visible
  // The root layout handles switching between (tabs) and (nutrition)

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <TopNavigationRibbon />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: Colors.tabBar,
            borderTopColor: Colors.tabBarBorder,
            borderTopWidth: 1,
            height: 85,
            paddingBottom: 25,
            paddingTop: 8,
          },
          tabBarActiveTintColor: Colors.tabActive,
          tabBarInactiveTintColor: Colors.tabInactive,
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Workouts',
            tabBarIcon: ({ color, size }) => (
              <Dumbbell size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="progress"
          options={{
            title: 'Progress',
            tabBarIcon: ({ color, size }) => (
              <BarChart3 size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="library"
          options={{
            title: 'Library',
            tabBarIcon: ({ color, size }) => (
              <BookOpen size={size} color={color} />
            ),
            href: null, // Hidden from tab bar, navigated to programmatically
          }}
        />
        <Tabs.Screen
          name="settings"
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
