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
const OURA_TIMEZONE =
  process.env.EXPO_PUBLIC_OURA_TIMEZONE ||
  Intl.DateTimeFormat().resolvedOptions().timeZone ||
  'UTC';

const SCOPES = ['daily', 'personal', 'heartrate', 'workout', 'session'];
const REDIRECT_URI = 'workout-tracker-app-v3://oauth';

function formatLocalDate(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: OURA_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;

  if (!year || !month || !day) {
    return date.toISOString().slice(0, 10);
  }

  return `${year}-${month}-${day}`;
}

function shiftLocalDays(date: Date, days: number): Date {
  const localDate = formatLocalDate(date);
  const [year, month, day] = localDate.split('-').map(Number);
  const anchor = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  anchor.setUTCDate(anchor.getUTCDate() + days);
  return anchor;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function getMinutesElapsedInConfiguredDay(date: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: OURA_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? '0');
  const minute = Number(parts.find((part) => part.type === 'minute')?.value ?? '0');
  return clamp(hour * 60 + minute, 0, 1440);
}

function isTimestampOnDate(timestamp: string, targetDate: string): boolean {
  const parsed = new Date(timestamp);
  if (Number.isNaN(parsed.getTime())) return false;
  return formatLocalDate(parsed) === targetDate;
}

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
  const lastReconcileAt = useRef<number>(0);
  const reconcileInFlight = useRef(false);
  const learningBackfillInFlight = useRef(false);
  const lastLearningBackfillAt = useRef<number>(0);

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

  const connect = async () => {
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
          } else {
            console.error('[Oura] ❌ Token exchange failed:', response.status, await response.text());
          }
        } else {
          console.warn('[Oura] ⚠️ No authorization code in redirect');
        }
      } else {
        console.warn('[Oura] Auth session cancelled or failed:', result.type);
      }
    } catch (err) {
      console.error('[Oura] ❌ OAuth connect error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const disconnect = useCallback(async () => {
    await clearTokens();
    setData(emptyData);
    await AsyncStorage.removeItem(OURA_DATA_KEY);
  }, [clearTokens]);

  // ─── Data Fetching ───

  const fetchFromOura = useCallback(
    async (endpoint: string, accessToken: string, params?: Record<string, string>) => {
      let allData: any[] = [];
      let nextToken: string | undefined;

      do {
        const queryParams = { ...params };
        if (nextToken) {
          queryParams['next_token'] = nextToken;
        }
        const queryString = Object.keys(queryParams).length > 0
          ? '?' + new URLSearchParams(queryParams).toString()
          : '';
        const url = `${OURA_API_BASE}${endpoint}${queryString}`;
        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!response.ok) {
          const body = await response.text();
          console.error('[Oura] ❌ API error:', response.status, body);
          throw new Error(`Oura API error: ${response.status} - ${body}`);
        }
        const json = await response.json();

        // If response doesn't have a data array, return as-is (no pagination)
        if (!Array.isArray(json.data)) {
          return json;
        }

        allData = [...allData, ...json.data];
        nextToken = json.next_token;

      } while (nextToken);

      return { data: allData };
    },
    []
  );

  const backfillLearningHistoryIfNeeded = useCallback(
    async (accessToken: string, today: string) => {
      if (learningBackfillInFlight.current) return;

      const nowMs = Date.now();
      const cooldownMs = 6 * 60 * 60 * 1000;
      if (nowMs - lastLearningBackfillAt.current < cooldownMs) {
        return;
      }

      learningBackfillInFlight.current = true;
      try {
        const now = new Date();
        const startDate = formatLocalDate(shiftLocalDays(now, -14));
        const endDate = formatLocalDate(shiftLocalDays(now, -1));

        const historyRes = await fetchFromOura('/usercollection/daily_activity', accessToken, {
          start_date: startDate,
          end_date: endDate,
        });

        const historyDays = Array.isArray(historyRes.data) ? historyRes.data : [];
        for (const day of historyDays) {
          if (!day || typeof day !== 'object') continue;
          const dayStr = (day as any).day as string | undefined;
          if (!dayStr || dayStr === today) continue;

          const totalCalories = Number((day as any).total_calories ?? 0);
          if (totalCalories <= 0) continue;

          const steps = Number((day as any).steps ?? 0);
          const activeMinutes = Number((day as any).high_activity_time ?? 0) / 60;

          await calorieEstimator.reconcile(
            dayStr,
            Math.round(totalCalories)
          );

          await calorieEstimator.recordActualCalories(
            dayStr,
            Math.round(totalCalories),
            Math.round(steps),
            Math.round(activeMinutes)
          );
        }

        lastLearningBackfillAt.current = nowMs;
      } catch (err) {
        console.warn('[Oura] Learning backfill failed:', err);
      } finally {
        learningBackfillInFlight.current = false;
      }
    },
    [fetchFromOura]
  );

  const fetchAllData = useCallback(
    async (accessToken: string) => {
      const now = new Date();
      const today = formatLocalDate(now);
      const yesterday = formatLocalDate(shiftLocalDays(now, -1));
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

        if (activityRes.status === 'fulfilled' && activityRes.value.data?.length > 0) {
          const allDays = activityRes.value.data;
          
          // Prefer today's data, fall back to most recent (yesterday)
          const todayData = allDays.find((d: any) => d.day === today);
          const a = todayData || allDays[allDays.length - 1]; // fallback to latest
          const isFromToday = a.day === today;
          
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

          // Only update calorie estimator with complete data
          if (isComplete) {
            await calorieEstimator.reconcile(
              a.day,
              newData.dailyActivity.totalCalories
            );
          }
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

        const minutesElapsed = Math.max(1, getMinutesElapsedInConfiguredDay(now));
        const bmrDay = calorieEstimator.getBMR();
        const remainingMinutes = Math.max(0, 1440 - minutesElapsed);

        const todayWorkouts = (newData.workouts || []).filter(
          (workout) =>
            isTimestampOnDate(workout.startTime, today) ||
            isTimestampOnDate(workout.endTime, today)
        );
        const workoutCalories = todayWorkouts.reduce(
          (sum, workout) => sum + (Number.isFinite(workout.calories) ? workout.calories : 0),
          0
        );

        const workoutWindows: { start: number; end: number }[] = todayWorkouts
          .map((workout) => {
            const start = new Date(workout.startTime).getTime();
            const end = new Date(workout.endTime).getTime();
            if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) {
              return null;
            }
            return { start, end };
          })
          .filter((window): window is { start: number; end: number } => window !== null);

        const restingHr =
          newData.sleep?.restingHeartRate || data.sleep?.restingHeartRate || 55;
        const hrThreshold = restingHr + 8;
        const hrSamples = newData.heartRate.filter((sample) =>
          isTimestampOnDate(sample.timestamp, today)
        );
        const hrKcalPerBeatMinute = 0.012;
        let nonWorkoutHrCalories = 0;

        for (const sample of hrSamples) {
          const sampleMs = new Date(sample.timestamp).getTime();
          if (!Number.isFinite(sampleMs)) continue;
          const inWorkout = workoutWindows.some(
            (window) => sampleMs >= window.start && sampleMs <= window.end
          );
          if (inWorkout) continue;

          const excess = Math.max(0, sample.bpm - hrThreshold);
          nonWorkoutHrCalories += excess * hrKcalPerBeatMinute * 5;
        }

        const todaySteps =
          newData.dailyActivity?.date === today ? newData.dailyActivity.steps : 0;
        const stepCalories = todaySteps * 0.04;
        const nonWorkoutActiveCalories =
          nonWorkoutHrCalories * 0.7 + stepCalories * 0.3;

        const activeElapsedCalories = workoutCalories + nonWorkoutActiveCalories;
        const activeRatePerMinute =
          activeElapsedCalories / Math.max(60, minutesElapsed);
        const projectedActiveRemainder =
          activeRatePerMinute * remainingMinutes * 0.65;

        const provisionalRaw =
          bmrDay + activeElapsedCalories + projectedActiveRemainder;
        const provisionalBounded = clamp(provisionalRaw, bmrDay * 0.9, bmrDay * 2.8);
        const provisionalEstimate = calorieEstimator.applyProvisionalBias(provisionalBounded);

        const hasFinalTodayActivity =
          !!newData.dailyActivity &&
          newData.dailyActivity.date === today &&
          !newData.dailyActivity.isPartial;

        if (hasFinalTodayActivity) {
          setEstimatedCalories(newData.dailyActivity!.totalCalories);
        } else {
          await backfillLearningHistoryIfNeeded(accessToken, today);
          setEstimatedCalories(provisionalEstimate);
          await calorieEstimator.recordEstimatedCalories(
            today,
            provisionalEstimate,
            todaySteps,
            newData.dailyActivity?.date === today
              ? newData.dailyActivity.activeMinutes
              : 0
          );
        }
      } catch (err) {
        console.error('Error fetching Oura data:', err);
      }
    },
    [fetchFromOura, backfillLearningHistoryIfNeeded, data.sleep?.restingHeartRate]
  );

  const reconcileIfNeeded = useCallback(
    async (accessToken: string) => {
      if (!USE_WEBHOOKS) return;

      const today = formatLocalDate(new Date());
      const activity = data.dailyActivity;
      const needsReconcile =
        !activity ||
        activity.date !== today ||
        activity.isPartial === true;

      if (!needsReconcile) return;
      if (reconcileInFlight.current) return;

      const nowMs = Date.now();
      if (nowMs - lastReconcileAt.current < 3 * 60 * 1000) {
        return;
      }

      reconcileInFlight.current = true;
      try {
        const yesterday = formatLocalDate(shiftLocalDays(new Date(), -1));
        await fetch(`${BACKEND_URL}/api/oura/reconcile`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            access_token: accessToken,
            startDate: yesterday,
            endDate: today,
          }),
        });
        lastReconcileAt.current = nowMs;
      } catch (err) {
        console.warn('[Oura] Reconcile request failed:', err);
      } finally {
        reconcileInFlight.current = false;
      }
    },
    [data.dailyActivity]
  );

  const refreshData = useCallback(async () => {
    const accessToken = await refreshTokenIfNeeded();
    if (!accessToken) return;
    setIsLoading(true);
    try {
      await reconcileIfNeeded(accessToken);
      await fetchAllData(accessToken);
    } finally {
      setIsLoading(false);
    }
  }, [refreshTokenIfNeeded, reconcileIfNeeded, fetchAllData]);

  // Auto-refresh with adaptive frequency based on data completeness
  useEffect(() => {
    if (!isConnected) return;
    
    // Check if we have partial data
    const hasPartialData = data.dailyActivity?.isPartial;
    
    // Refresh more frequently (every 5 minutes) if data is partial
    // Otherwise, refresh every 15 minutes
    const refreshInterval = hasPartialData ? 5 * 60 * 1000 : 15 * 60 * 1000;

    const interval = setInterval(refreshData, refreshInterval);
    return () => clearInterval(interval);
  }, [isConnected, refreshData, data.dailyActivity?.isPartial]);

  // Only report actual calories when today's data is complete
  const todayForActual = formatLocalDate(new Date());
  const actualCalories =
    data.dailyActivity?.date === todayForActual && !data.dailyActivity?.isPartial
      ? data.dailyActivity.totalCalories
      : null;

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
