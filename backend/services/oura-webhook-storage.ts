// Webhook data storage with file-based persistence for development.
// In production (Vercel serverless), replace with a database
// (e.g. Vercel KV, Supabase, Planetscale) since the filesystem
// is ephemeral across function invocations.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const IS_DEV = process.env.NODE_ENV === 'development';
const STORAGE_DIR = join(process.cwd(), '.data');
const STORAGE_FILE = join(STORAGE_DIR, 'oura-webhook-data.json');

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

// ─── Internal stores ───

let store = new Map<string, StoredActivityData>();
let webhookEvents: OuraWebhookEvent[] = [];

// ─── File-based persistence (development) ───

function loadFromDisk(): void {
  if (!IS_DEV) return;
  try {
    if (existsSync(STORAGE_FILE)) {
      const raw = readFileSync(STORAGE_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed.activityData && typeof parsed.activityData === 'object') {
        store = new Map(Object.entries(parsed.activityData));
      }
      if (Array.isArray(parsed.webhookEvents)) {
        webhookEvents = parsed.webhookEvents;
      }
      console.log(
        `[Storage] ✅ Loaded ${store.size} activity records and ${webhookEvents.length} events from disk`
      );
    }
  } catch (err) {
    console.error('[Storage] Failed to load from disk, starting fresh:', err);
  }
}

function saveToDisk(): void {
  if (!IS_DEV) return;
  try {
    if (!existsSync(STORAGE_DIR)) {
      mkdirSync(STORAGE_DIR, { recursive: true });
    }
    const data = {
      activityData: Object.fromEntries(store),
      webhookEvents,
      savedAt: new Date().toISOString(),
    };
    writeFileSync(STORAGE_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('[Storage] Failed to save to disk:', err);
  }
}

// Initialize from disk on module load
loadFromDisk();

// ─── Public API ───

export function getStorageKey(userId: string, date: string): string {
  return `${userId}:${date}`;
}

export function getActivityData(userId: string, date: string): StoredActivityData | undefined {
  return store.get(getStorageKey(userId, date));
}

export function setActivityData(data: StoredActivityData): void {
  store.set(getStorageKey(data.userId, data.date), data);
  saveToDisk();
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
  saveToDisk();
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
  saveToDisk();
}

// Store raw webhook events for debugging
export function recordWebhookEvent(event: OuraWebhookEvent): void {
  webhookEvents.push(event);
  // Keep last 100 events
  if (webhookEvents.length > 100) {
    webhookEvents.splice(0, webhookEvents.length - 100);
  }
  saveToDisk();
}

export function getRecentWebhookEvents(limit: number = 20): OuraWebhookEvent[] {
  return webhookEvents.slice(-limit);
}
