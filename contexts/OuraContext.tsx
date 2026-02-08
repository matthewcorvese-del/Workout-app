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
  isPartial?: boolean; // Flag indicating if data is incomplete for the day
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
    console.log('[Oura] 🔵 Starting OAuth connection...');
    console.log('[Oura] Backend URL:', BACKEND_URL);
    setIsLoading(true);
    try {
      const authUrl =
        `https://cloud.ouraring.com/oauth/authorize?` +
        `client_id=${OURA_CLIENT_ID}` +
        `&response_type=code` +
        `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
        `&scope=${SCOPES.join('+')}` +
        `&state=${Math.random().toString(36).substring(7)}`;

      console.log('[Oura] 🌐 Opening auth session...');
      const result = await WebBrowser.openAuthSessionAsync(authUrl, REDIRECT_URI);
      console.log('[Oura] Auth session result:', result.type);

      if (result.type === 'success' && result.url) {
        const url = new URL(result.url);
        const code = url.searchParams.get('code');
        console.log('[Oura] ✅ Got authorization code');

        if (code) {
          // Exchange code for tokens via backend proxy
          console.log('[Oura] 🔄 Exchanging code for tokens...');
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
            console.log('[Oura] ✅ Token exchange successful');
            const data = await response.json();
            const newTokens: OuraTokens = {
              access_token: data.access_token,
              refresh_token: data.refresh_token,
              expires_at: Date.now() + (data.expires_in || 3600) * 1000,
              token_type: data.token_type || 'Bearer',
            };
            console.log('[Oura] 💾 Saving tokens...');
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
            console.log('[Oura] 📊 Fetching initial data...');
            await fetchAllData(data.access_token);
            console.log('[Oura] ✅ Connection complete!');
          } else {
            console.error('[Oura] ❌ Token exchange failed:', response.status, await response.text());
          }
        } else {
          console.warn('[Oura] ⚠️ No authorization code in redirect');
        }
      } else {
        console.log('[Oura] ⚠️ Auth session cancelled or failed:', result.type);
      }
    } catch (err) {
      console.error('[Oura] ❌ OAuth connect error:', err);
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
      const url = `${OURA_API_BASE}${endpoint}${queryString}`;
      console.log('[Oura] 🌐 Fetching:', url);
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!response.ok) {
        const body = await response.text();
        console.error('[Oura] ❌ API error:', response.status, body);
        throw new Error(`Oura API error: ${response.status} - ${body}`);
      }
      const json = await response.json();
      return json;
    },
    []
  );

  const fetchAllData = useCallback(
    async (accessToken: string) => {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const yesterday = new Date(now.getTime() - 86400000).toISOString().split('T')[0];
      const params = { start_date: today, end_date: today };
      // Activity needs a wider range — today's summary may not exist yet
      const activityParams = { start_date: yesterday, end_date: today };

      try {
        const [activityRes, heartRateRes, workoutRes, sleepRes, stressRes] =
          await Promise.allSettled([
            fetchFromOura('/usercollection/daily_activity', accessToken, activityParams),
            fetchFromOura('/usercollection/heartrate', accessToken, params),
            fetchFromOura('/usercollection/workout', accessToken, params),
            fetchFromOura('/usercollection/daily_sleep', accessToken, params),
            fetchFromOura('/usercollection/daily_stress', accessToken, params),
          ]);

        const newData: OuraData = { ...emptyData, lastFetched: new Date().toISOString() };

        // Log raw API responses
        console.log('[Oura] 📡 Activity response status:', activityRes.status);
        if (activityRes.status === 'fulfilled') {
          console.log('[Oura] 📡 Activity raw data:', JSON.stringify(activityRes.value, null, 2));
        } else {
          console.log('[Oura] ❌ Activity fetch failed:', activityRes.reason);
        }

        if (activityRes.status === 'fulfilled' && activityRes.value.data?.length > 0) {
          const allDays = activityRes.value.data;
          console.log(`[Oura] 📊 Activity: got ${allDays.length} day(s) of data`);
          
          // Prefer today's data, fall back to most recent (yesterday)
          const todayData = allDays.find((d: any) => d.day === today);
          const a = todayData || allDays[allDays.length - 1]; // fallback to latest
          const isFromToday = a.day === today;
          
          console.log('[Oura] 📊 Using activity for day:', a.day, '(isFromToday:', isFromToday, ')');
          console.log('[Oura] 📊 Fields — steps:', a.steps, '| active_calories:', a.active_calories, '| total_calories:', a.total_calories, '| high_activity_time:', a.high_activity_time);
          
          // Daily activity is considered complete after 4 AM the next day (Oura's day boundary)
          const dataDay = new Date(a.day + 'T00:00:00');
          const dayAfterData = new Date(dataDay);
          dayAfterData.setDate(dayAfterData.getDate() + 1);
          dayAfterData.setHours(4, 0, 0, 0);
          const isComplete = now >= dayAfterData;
          
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
            isPartial: isFromToday && !isComplete,
          };

          console.log('[Oura] ✅ Parsed dailyActivity:', JSON.stringify(newData.dailyActivity));

          // Only update calorie estimator with complete data
          if (isComplete) {
            await calorieEstimator.recordActualCalories(
              a.day,
              newData.dailyActivity.totalCalories,
              newData.dailyActivity.steps,
              newData.dailyActivity.activeMinutes
            );
          } else {
            console.log('[Oura] Partial/in-progress daily activity data - will refresh more frequently');
          }
        } else if (activityRes.status === 'fulfilled') {
          console.log('[Oura] ⚠️ No activity data for yesterday or today. Response:', JSON.stringify(activityRes.value));
        }

        console.log('[Oura] 📡 HeartRate status:', heartRateRes.status, heartRateRes.status === 'fulfilled' ? `(${heartRateRes.value.data?.length ?? 0} entries)` : '');
        console.log('[Oura] 📡 Workout status:', workoutRes.status, workoutRes.status === 'fulfilled' ? `(${workoutRes.value.data?.length ?? 0} entries)` : '');
        console.log('[Oura] 📡 Sleep status:', sleepRes.status);
        console.log('[Oura] 📡 Stress status:', stressRes.status);

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

        // Update estimated calories based on whether data is complete
        if (newData.dailyActivity?.isPartial) {
          // For partial data, show estimated total for the full day
          setEstimatedCalories(
            calorieEstimator.estimateCaloriesAtTime(24) // Estimate for full day
          );
        } else {
          setEstimatedCalories(
            newData.dailyActivity?.totalCalories ||
              calorieEstimator.estimateCaloriesAtTime(new Date().getHours())
          );
        }
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

  // Auto-refresh with adaptive frequency based on data completeness
  useEffect(() => {
    if (!isConnected) return;
    
    // Check if we have partial data
    const hasPartialData = data.dailyActivity?.isPartial;
    
    // Refresh more frequently (every 5 minutes) if data is partial
    // Otherwise, refresh every 15 minutes
    const refreshInterval = hasPartialData ? 5 * 60 * 1000 : 15 * 60 * 1000;
    
    console.log(`[Oura] Auto-refresh interval: ${refreshInterval / 60000} minutes${hasPartialData ? ' (partial data)' : ''}`);
    
    const interval = setInterval(refreshData, refreshInterval);
    return () => clearInterval(interval);
  }, [isConnected, refreshData, data.dailyActivity?.isPartial]);

  // Only report actual calories if data is complete (not partial)
  const actualCalories = data.dailyActivity?.isPartial 
    ? null // Don't report partial data as "actual"
    : (data.dailyActivity?.totalCalories ?? null);

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
