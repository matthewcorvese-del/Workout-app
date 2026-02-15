import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppModeProvider } from '@/contexts/AppModeContext';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { WorkoutProvider } from '@/contexts/WorkoutContext';
import { NutritionProvider } from '@/contexts/NutritionContext';
import { OuraProvider } from '@/contexts/OuraContext';
import { trpc, trpcClient } from '@/lib/trpc';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 2,
    },
  },
});

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <SettingsProvider>
            <AppModeProvider>
              <OuraProvider>
                <WorkoutProvider>
                  <NutritionProvider>
                    <StatusBar style="light" />
                    <Stack
                      screenOptions={{
                        headerShown: false,
                        contentStyle: { backgroundColor: '#0A1628' },
                        animation: 'fade',
                      }}
                    >
                      <Stack.Screen name="(tabs)" />
                      <Stack.Screen name="(nutrition)" />
                      <Stack.Screen
                        name="active-workout"
                        options={{
                          presentation: 'fullScreenModal',
                          animation: 'slide_from_bottom',
                        }}
                      />
                    </Stack>
                  </NutritionProvider>
                </WorkoutProvider>
              </OuraProvider>
            </AppModeProvider>
          </SettingsProvider>
        </QueryClientProvider>
      </trpc.Provider>
    </GestureHandlerRootView>
  );
}
