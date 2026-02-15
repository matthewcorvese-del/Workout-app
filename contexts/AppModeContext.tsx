import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SharedValue, useSharedValue, withTiming } from 'react-native-reanimated';

const APP_MODE_KEY = 'app_mode';

export type AppMode = 'fitness' | 'nutrition';

interface AppModeContextValue {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  toggleMode: () => void;
  animationProgress: SharedValue<number>; // 0 = fitness, 1 = nutrition
}

const AppModeContext = createContext<AppModeContextValue | undefined>(undefined);

export function AppModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<AppMode>('fitness');
  const animationProgress = useSharedValue(0);

  // Load saved mode on mount
  useEffect(() => {
    AsyncStorage.getItem(APP_MODE_KEY)
      .then((saved) => {
        if (saved === 'nutrition') {
          setModeState('nutrition');
          animationProgress.value = 1;
        }
      })
      .catch(() => {
        // keep default mode on storage read failure
      });
  }, [animationProgress]);

  const setMode = useCallback(
    (newMode: AppMode) => {
      setModeState(newMode);
      AsyncStorage.setItem(APP_MODE_KEY, newMode).catch(() => {
        // keep runtime state even if persisting fails
      });
      animationProgress.value = withTiming(newMode === 'nutrition' ? 1 : 0, {
        duration: 300,
      });
    },
    [animationProgress]
  );

  const toggleMode = useCallback(() => {
    setMode(mode === 'fitness' ? 'nutrition' : 'fitness');
  }, [mode, setMode]);

  return (
    <AppModeContext.Provider value={{ mode, setMode, toggleMode, animationProgress }}>
      {children}
    </AppModeContext.Provider>
  );
}

export function useAppMode(): AppModeContextValue {
  const ctx = useContext(AppModeContext);
  if (!ctx) throw new Error('useAppMode must be used within AppModeProvider');
  return ctx;
}
