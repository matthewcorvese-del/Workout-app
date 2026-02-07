import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WeightUnit } from '@/types/workout';

const SETTINGS_KEY = 'user_settings';

export interface UserProfile {
  name: string;
  age: number;
  sex: 'male' | 'female';
  heightCm: number;
  weightKg: number;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
}

export interface Settings {
  weightUnit: WeightUnit;
  defaultRestTimer: number;   // seconds
  autoStartRestTimer: boolean;
  showWarmupSets: boolean;
  darkMode: boolean;
  profile: UserProfile;
}

const defaultProfile: UserProfile = {
  name: '',
  age: 30,
  sex: 'male',
  heightCm: 175,
  weightKg: 75,
  activityLevel: 'moderate',
};

const defaultSettings: Settings = {
  weightUnit: 'lbs',
  defaultRestTimer: 90,
  autoStartRestTimer: true,
  showWarmupSets: true,
  darkMode: true,
  profile: defaultProfile,
};

interface SettingsContextValue {
  settings: Settings;
  updateSettings: (update: Partial<Settings>) => void;
  updateProfile: (update: Partial<UserProfile>) => void;
  resetSettings: () => void;
  isLoaded: boolean;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load settings on mount
  useEffect(() => {
    AsyncStorage.getItem(SETTINGS_KEY)
      .then((raw) => {
        if (raw) {
          try {
            const saved = JSON.parse(raw);
            setSettings({ ...defaultSettings, ...saved });
          } catch {
            // corrupt data, use defaults
          }
        }
      })
      .finally(() => setIsLoaded(true));
  }, []);

  // Persist on change
  const persist = useCallback((s: Settings) => {
    AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  }, []);

  const updateSettings = useCallback(
    (update: Partial<Settings>) => {
      setSettings((prev) => {
        const next = { ...prev, ...update };
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const updateProfile = useCallback(
    (update: Partial<UserProfile>) => {
      setSettings((prev) => {
        const next = { ...prev, profile: { ...prev.profile, ...update } };
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const resetSettings = useCallback(() => {
    setSettings(defaultSettings);
    persist(defaultSettings);
  }, [persist]);

  return (
    <SettingsContext.Provider
      value={{ settings, updateSettings, updateProfile, resetSettings, isLoaded }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
