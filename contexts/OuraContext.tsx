import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { calorieEstimator } from '@/lib/calorieEstimator';

const OURA_TOKENS_KEY = 'oura_tokens';
const OURA_DATA_KEY = 'oura_data_cache';

const OURA_CLIENT_ID = '556b8aab-8415-4977-8ffd-b2837c4f6ece';
const OURA_API_BASE =
  process.env.EXPO_PUBLIC_OURA_API_BASE || 'https://api.ouraring.com/v2';
const BACKEND_URL =
  process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3000';
const USE_WEBHOOKS =
  process.env.EXPO_PUBLIC_OURA_USE_WEBHOOKS === 'true';

const SCOPES = ['daily', 'personal', 'heartrate', 'workout', 'session'];
const REDIRECT_URI = 'workout-tracker-app-v3://oauth';

// ─── Types ───

interface OuraTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number; // ms timestamp
  token_type: string;
}

export interface OuraDailyActivity {
  date: string;
  totalCalories: number;
  activeCalories: number;
  steps: number;
  activeMinutes: number;
  sedentaryMinutes: number;
  meetDailyTargets: number;
}

export interface OuraHeartRate {
  bpm: number;
  timestamp: string;
}

export interface OuraWorkout {
  activity: string;
  calories: number;
  duration: number;
  startTime: string;
  endTime: string;
  intensity: string;
}

export interface OuraSleep {
  date: string;
  totalSleep: number;    // minutes
  efficiency: number;
  score: number;
  restingHeartRate: number;
}

export interface OuraStress {
  date: string;
  stressHigh: number;
  recoveryHigh: number;
  dayScore: number;
}

export interface OuraData {
  dailyActivity: OuraDailyActivity | null;
  heartRate: OuraHeartRate[];
  workouts: OuraWorkout[];
  sleep: OuraSleep | null;
  stress: OuraStress | null;
  lastFetched: string | null;
}

interface OuraContextValue {
  // Auth
  isConnected: boolean;
  isLoading: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;

  // Data
  data: OuraData;
  refreshData: () => Promise<void>;

  // Calorie estimation
  estimatedCalories: number;
  actualCalories: number | null;
}

const OuraContext = createContext<OuraContextValue | undefined>(undefined);

const emptyData: OuraData = {
  dailyActivity: null,
  heartRate: [],
  workouts: [],
  sleep: null,
  stress: null,
  lastFetched: null,
};

// ─── Provider ───

export function OuraProvider({ children }: { children: React.ReactNode }) {
  const [tokens, setTokens] = useState<OuraTokens | null>(null);
  const [data, setData] = useState<OuraData>(emptyData);
  const [isLoading, setIsLoading] = useState(false);
  const [estimatedCalories, setEstimatedCalories] = useState(0);
  const initialized = useRef(false);

  const isConnected = !!tokens?.access_token;

  // ─── Load on mount ───
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    Promise.all([
      AsyncStorage.getItem(OURA_TOKENS_KEY),
      AsyncStorage.getItem(OURA_DATA_KEY),
      calorieEstimator.load(),
    ]).then(([tokensRaw, dataRaw]) => {
      if (tokensRaw) {
        try {
          setTokens(JSON.parse(tokensRaw));
        } catch {}
      }
      if (dataRaw) {
        try {
          setData(JSON.parse(dataRaw));
        } catch {}
      }
      setEstimatedCalories(
        calorieEstimator.estimateCaloriesAtTime(new Date().getHours())
      );
    });
  }, []);

  // ─── Token Management ───

  const saveTokens = useCallback(async (t: OuraTokens) => {
    setTokens(t);
    await AsyncStorage.setItem(OURA_TOKENS_KEY, JSON.stringify(t));
  }, []);

  const clearTokens = useCallback(async () => {
    setTokens(null);
    await AsyncStorage.removeItem(OURA_TOKENS_KEY);
  }, []);

  const refreshTokenIfNeeded = useCallback(async (): Promise<string | null> => {
    if (!tokens) return null;

    // Check if token is still valid (with 5min buffer)
    if (tokens.expires_at > Date.now() + 5 * 60 * 1000) {
      return tokens.access_token;
    }

    // Refresh via backend proxy
    try {
      const response = await fetch(`${BACKEND_URL}/api/oauth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant_type: 'refresh_token',
          refresh_token: tokens.refresh_token,
        }),
      });

      if (!response.ok) {
        console.error('Token refresh failed');
        await clearTokens();
        return null;
      }

      const data = await response.json();
      const newTokens: OuraTokens = {
        access_token: data.access_token,
        refresh_token: data.refresh_token || tokens.refresh_token,
        expires_at: Date.now() + (data.expires_in || 3600) * 1000,
        token_type: data.token_type || 'Bearer',
      };
      await saveTokens(newTokens);
      return newTokens.access_token;
    } catch (err) {
      console.error('Token refresh error:', err);
      return null;
    }
  }, [tokens, saveTokens, clearTokens]);

  // ─── OAuth Connect ───

  const connect = useCallback(async () => {
    setIsLoading(true);
    try {
      const authUrl =
        `https://cloud.ouraring.com/oauth/authorize?` +
        `client_id=${OURA_CLIENT_ID}` +
        `&response_type=code` +
        `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
        `&scope=${SCOPES.join('+')}` +
        `&state=${Math.random().toString(36).substring(7)}`;

      const result = await WebBrowser.openAuthSessionAsync(authUrl, REDIRECT_URI);

      if (result.type === 'success' && result.url) {
        const url = new URL(result.url);
        const code = url.searchParams.get('code');

        if (code) {
          // Exchange code for tokens via backend proxy
          const response = await fetch(`${BACKEND_URL}/api/oauth/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              code,
              redirect_uri: REDIRECT_URI,
              grant_type: 'authorization_code',
            }),
          });

          if (response.ok) {
            const data = await response.json();
            const newTokens: OuraTokens = {
              access_token: data.access_token,
              refresh_token: data.refresh_token,
              expires_at: Date.now() + (data.expires_in || 3600) * 1000,
              token_type: data.token_type || 'Bearer',
            };
            await saveTokens(newTokens);

            // Set up webhooks if configured
            if (USE_WEBHOOKS) {
              try {
                await fetch(`${BACKEND_URL}/api/oauth/webhook-setup`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ access_token: data.access_token }),
                });
              } catch (err) {
                console.warn('Webhook setup failed:', err);
              }
            }

            // Fetch initial data
            await fetchAllData(data.access_token);
          }
        }
      }
    } catch (err) {
      console.error('OAuth connect error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [saveTokens]);

  const disconnect = useCallback(async () => {
    await clearTokens();
    setData(emptyData);
    await AsyncStorage.removeItem(OURA_DATA_KEY);
  }, [clearTokens]);

  // ─── Data Fetching ───

  const fetchFromOura = useCallback(
    async (endpoint: string, accessToken: string, params?: Record<string, string>) => {
      const queryString = params
        ? '?' + new URLSearchParams(params).toString()
        : '';
      const response = await fetch(`${OURA_API_BASE}${endpoint}${queryString}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!response.ok) throw new Error(`Oura API error: ${response.status}`);
      return response.json();
    },
    []
  );

  const fetchAllData = useCallback(
    async (accessToken: string) => {
      const today = new Date().toISOString().split('T')[0];
      const params = { start_date: today, end_date: today };

      try {
        const [activityRes, heartRateRes, workoutRes, sleepRes, stressRes] =
          await Promise.allSettled([
            fetchFromOura('/usercollection/daily_activity', accessToken, params),
            fetchFromOura('/usercollection/heartrate', accessToken, params),
            fetchFromOura('/usercollection/workout', accessToken, params),
            fetchFromOura('/usercollection/daily_sleep', accessToken, params),
            fetchFromOura('/usercollection/daily_stress', accessToken, params),
          ]);

        const newData: OuraData = { ...emptyData, lastFetched: new Date().toISOString() };

        if (activityRes.status === 'fulfilled' && activityRes.value.data?.[0]) {
          const a = activityRes.value.data[0];
          newData.dailyActivity = {
            date: a.day || today,
            totalCalories: a.total_calories || 0,
            activeCalories: a.active_calories || 0,
            steps: a.steps || 0,
            activeMinutes: a.high_activity_time
              ? Math.round(a.high_activity_time / 60)
              : 0,
            sedentaryMinutes: a.sedentary_time
              ? Math.round(a.sedentary_time / 60)
              : 0,
            meetDailyTargets: a.meet_daily_targets || 0,
          };

          // Update calorie estimator with actual data
          await calorieEstimator.recordActualCalories(
            today,
            newData.dailyActivity.totalCalories,
            newData.dailyActivity.steps,
            newData.dailyActivity.activeMinutes
          );
        }

        if (heartRateRes.status === 'fulfilled' && heartRateRes.value.data) {
          newData.heartRate = heartRateRes.value.data.map((hr: any) => ({
            bpm: hr.bpm,
            timestamp: hr.timestamp,
          }));
        }

        if (workoutRes.status === 'fulfilled' && workoutRes.value.data) {
          newData.workouts = workoutRes.value.data.map((w: any) => ({
            activity: w.activity,
            calories: w.calories,
            duration: w.duration,
            startTime: w.start_datetime,
            endTime: w.end_datetime,
            intensity: w.intensity,
          }));
        }

        if (sleepRes.status === 'fulfilled' && sleepRes.value.data?.[0]) {
          const s = sleepRes.value.data[0];
          newData.sleep = {
            date: s.day || today,
            totalSleep: s.total_sleep_duration
              ? Math.round(s.total_sleep_duration / 60)
              : 0,
            efficiency: s.efficiency || 0,
            score: s.score || 0,
            restingHeartRate: s.lowest_heart_rate || 0,
          };

          // Update BMR from sleep data's resting heart rate
          if (newData.sleep.restingHeartRate > 0) {
            // Rough BMR adjustment: lower RHR typically means higher BMR efficiency
            const baseBMR = calorieEstimator.getBMR();
            // Keep BMR stable, just update if we have profile data
          }
        }

        if (stressRes.status === 'fulfilled' && stressRes.value.data?.[0]) {
          const st = stressRes.value.data[0];
          newData.stress = {
            date: st.day || today,
            stressHigh: st.stress_high || 0,
            recoveryHigh: st.recovery_high || 0,
            dayScore: st.day_summary || 0,
          };
        }

        setData(newData);
        await AsyncStorage.setItem(OURA_DATA_KEY, JSON.stringify(newData));

        // Update estimated calories
        setEstimatedCalories(
          newData.dailyActivity?.totalCalories ||
            calorieEstimator.estimateCaloriesAtTime(new Date().getHours())
        );
      } catch (err) {
        console.error('Error fetching Oura data:', err);
      }
    },
    [fetchFromOura]
  );

  const refreshData = useCallback(async () => {
    const accessToken = await refreshTokenIfNeeded();
    if (!accessToken) return;
    setIsLoading(true);
    try {
      await fetchAllData(accessToken);
    } finally {
      setIsLoading(false);
    }
  }, [refreshTokenIfNeeded, fetchAllData]);

  // Auto-refresh every 15 minutes when connected
  useEffect(() => {
    if (!isConnected) return;
    const interval = setInterval(refreshData, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [isConnected, refreshData]);

  const actualCalories = data.dailyActivity?.totalCalories ?? null;

  return (
    <OuraContext.Provider
      value={{
        isConnected,
        isLoading,
        connect,
        disconnect,
        data,
        refreshData,
        estimatedCalories,
        actualCalories,
      }}
    >
      {children}
    </OuraContext.Provider>
  );
}

export function useOura(): OuraContextValue {
  const ctx = useContext(OuraContext);
  if (!ctx) throw new Error('useOura must be used within OuraProvider');
  return ctx;
}
