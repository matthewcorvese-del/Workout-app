import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const APP_MODE_KEY = 'app_mode';

export type AppMode = 'fitness' | 'nutrition';

interface AppModeContextValue {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  toggleMode: () => void;
  animationProgress: Animated.Value; // 0 = fitness, 1 = nutrition
}

const AppModeContext = createContext<AppModeContextValue | undefined>(undefined);

export function AppModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<AppMode>('fitness');
  const animationProgress = useRef(new Animated.Value(0)).current;

  // Load saved mode on mount
  useEffect(() => {
    AsyncStorage.getItem(APP_MODE_KEY).then((saved) => {
      if (saved === 'nutrition') {
        setModeState('nutrition');
        animationProgress.setValue(1);
      }
    });
  }, []);

  const setMode = useCallback(
    (newMode: AppMode) => {
      setModeState(newMode);
      AsyncStorage.setItem(APP_MODE_KEY, newMode);
      Animated.timing(animationProgress, {
        toValue: newMode === 'nutrition' ? 1 : 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
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
