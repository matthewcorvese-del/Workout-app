// In-memory webhook data storage
// NOTE: This is ephemeral in serverless environments. For production,
// replace with a database (Vercel KV, Supabase, etc.).

export interface OuraWebhookEvent {
  event_type: string;
  data_type: string;
  user_id: string;
  timestamp: string;
  data?: Record<string, unknown>;
}

export interface StoredActivityData {
  userId: string;
  date: string;
  calories?: number;
  steps?: number;
  activeMinutes?: number;
  heartRate?: { bpm: number; timestamp: string }[];
  workouts?: {
    activity: string;
    calories: number;
    duration: number;
    startTime: string;
    endTime: string;
  }[];
  sessions?: {
    type: string;
    startTime: string;
    endTime: string;
    heartRate?: number;
  }[];
  stress?: {
    stressHigh?: number;
    recoveryHigh?: number;
    dayScore?: number;
  };
  sleep?: {
    totalSleep?: number;
    efficiency?: number;
    score?: number;
    restingHeartRate?: number;
  };
  updatedAt: string;
}

// In-memory store — keyed by `userId:date`
const store = new Map<string, StoredActivityData>();

export function getStorageKey(userId: string, date: string): string {
  return `${userId}:${date}`;
}

export function getActivityData(userId: string, date: string): StoredActivityData | undefined {
  return store.get(getStorageKey(userId, date));
}

export function setActivityData(data: StoredActivityData): void {
  store.set(getStorageKey(data.userId, data.date), data);
}

export function updateActivityData(
  userId: string,
  date: string,
  update: Partial<StoredActivityData>
): StoredActivityData {
  const key = getStorageKey(userId, date);
  const existing = store.get(key) || {
    userId,
    date,
    updatedAt: new Date().toISOString(),
  };

  const updated: StoredActivityData = {
    ...existing,
    ...update,
    userId,
    date,
    updatedAt: new Date().toISOString(),
  };

  store.set(key, updated);
  return updated;
}

export function getAllDataForUser(userId: string): StoredActivityData[] {
  const results: StoredActivityData[] = [];
  for (const [key, value] of store.entries()) {
    if (key.startsWith(`${userId}:`)) {
      results.push(value);
    }
  }
  return results.sort((a, b) => b.date.localeCompare(a.date));
}

export function clearDataForUser(userId: string): void {
  for (const key of store.keys()) {
    if (key.startsWith(`${userId}:`)) {
      store.delete(key);
    }
  }
}

// Store raw webhook events for debugging
const webhookEvents: OuraWebhookEvent[] = [];

export function recordWebhookEvent(event: OuraWebhookEvent): void {
  webhookEvents.push(event);
  // Keep last 100 events
  if (webhookEvents.length > 100) {
    webhookEvents.splice(0, webhookEvents.length - 100);
  }
}

export function getRecentWebhookEvents(limit: number = 20): OuraWebhookEvent[] {
  return webhookEvents.slice(-limit);
}
