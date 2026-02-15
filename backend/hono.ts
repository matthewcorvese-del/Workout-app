import { createHmac } from 'node:crypto';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { trpcServer } from '@hono/trpc-server';
import { appRouter } from './trpc/app-router';
import { createContext } from './trpc/create-context';
import {
  getActivityData,
  recordWebhookEvent,
  updateActivityData,
} from './services/oura-webhook-storage';

const app = new Hono();

// ─── Config ───

const OURA_CLIENT_ID = process.env.OURA_CLIENT_ID || '556b8aab-8415-4977-8ffd-b2837c4f6ece';
const OURA_CLIENT_SECRET = process.env.OURA_CLIENT_SECRET || '';
const OURA_TOKEN_URL = 'https://api.ouraring.com/oauth/token';
const OURA_API_BASE = 'https://api.ouraring.com/v2';
const OURA_WEBHOOK_CALLBACK_URL = process.env.OURA_WEBHOOK_CALLBACK_URL || '';
const OURA_VERIFICATION_TOKEN = process.env.OURA_VERIFICATION_TOKEN || '';
const OURA_ACCESS_TOKEN = process.env.OURA_ACCESS_TOKEN || '';
const OURA_TIMEZONE = process.env.OURA_TIMEZONE || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

// ─── Middleware ───

app.use('/*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Health Check ───

app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── On-demand Reconciliation ───

const RECONCILE_DATA_TYPES = [
  'daily_activity',
  'daily_sleep',
  'workout',
  'session',
  'daily_stress',
] as const;

type ReconcileDataType = (typeof RECONCILE_DATA_TYPES)[number];

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

function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function getLastTwoDates(): { startDate: string; endDate: string } {
  const now = new Date();
  const yesterday = shiftLocalDays(now, -1);

  return {
    startDate: formatLocalDate(yesterday),
    endDate: formatLocalDate(now),
  };
}

function enumerateDates(startDate: string, endDate: string): string[] {
  const result: string[] = [];
  const current = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  while (current <= end) {
    const yyyy = current.getFullYear();
    const mm = String(current.getMonth() + 1).padStart(2, '0');
    const dd = String(current.getDate()).padStart(2, '0');
    result.push(`${yyyy}-${mm}-${dd}`);
    current.setDate(current.getDate() + 1);
  }

  return result;
}

app.post('/api/oura/reconcile', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const token = body.access_token || OURA_ACCESS_TOKEN;
    const userId = body.userId || 'default';

    if (!token) {
      return c.json({ error: 'No access token provided' }, 400);
    }

    const defaults = getLastTwoDates();
    const startDate = body.startDate || defaults.startDate;
    const endDate = body.endDate || defaults.endDate;

    if (!isIsoDate(startDate) || !isIsoDate(endDate)) {
      return c.json({ error: 'Invalid date format. Expected YYYY-MM-DD' }, 400);
    }

    if (startDate > endDate) {
      return c.json({ error: 'startDate must be <= endDate' }, 400);
    }

    const requestedTypes = Array.isArray(body.dataTypes)
      ? (body.dataTypes as string[])
      : [...RECONCILE_DATA_TYPES];

    const dataTypes: ReconcileDataType[] = requestedTypes.filter((type): type is ReconcileDataType =>
      RECONCILE_DATA_TYPES.includes(type as ReconcileDataType)
    );

    if (dataTypes.length === 0) {
      return c.json({ error: 'No valid dataTypes provided' }, 400);
    }

    const dates = enumerateDates(startDate, endDate);
    const results: Array<{
      date: string;
      dataType: ReconcileDataType;
      status: 'ok' | 'error';
      error?: string;
    }> = [];

    for (const date of dates) {
      for (const dataType of dataTypes) {
        try {
          await fetchAndStoreOuraData({
            token,
            userId,
            fallbackDate: date,
            dataType,
          });
          results.push({ date, dataType, status: 'ok' });
        } catch (err) {
          results.push({
            date,
            dataType,
            status: 'error',
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }
    }

    const failures = results.filter((r) => r.status === 'error').length;

    return c.json({
      userId,
      startDate,
      endDate,
      dataTypes,
      totalTasks: results.length,
      failures,
      results,
    });
  } catch (err) {
    console.error('[Reconcile] Error:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// ─── OAuth Token Exchange ───

app.post('/api/oauth/token', async (c) => {
  try {
    const body = await c.req.json();
    const { code, redirect_uri, grant_type, refresh_token } = body;

    console.log('[Backend] 🔄 Token exchange request:', {
      grant_type: grant_type || 'authorization_code',
      has_code: !!code,
      has_refresh_token: !!refresh_token,
      redirect_uri,
    });

    const params = new URLSearchParams();
    params.set('client_id', OURA_CLIENT_ID);
    params.set('client_secret', OURA_CLIENT_SECRET);
    params.set('grant_type', grant_type || 'authorization_code');

    if (grant_type === 'refresh_token' && refresh_token) {
      params.set('refresh_token', refresh_token);
    } else if (code) {
      params.set('code', code);
      params.set('redirect_uri', redirect_uri || 'workout-tracker-app-v3://oauth');
    }

    console.log('[Backend] 📤 Sending to Oura:', Object.fromEntries(params.entries()));

    const response = await fetch(OURA_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[Backend] ❌ Oura API error:', response.status, data);
      return c.json({ error: 'Token exchange failed', details: data }, 400);
    }

    console.log('[Backend] ✅ Token exchange successful');
    return c.json(data);
  } catch (err) {
    console.error('OAuth token exchange error:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// ─── Webhook Setup ───

app.post('/api/oauth/webhook-setup', async (c) => {
  try {
    const body = await c.req.json();
    const { access_token } = body;

    const token = access_token || OURA_ACCESS_TOKEN;
    if (!token) {
      return c.json({ error: 'No access token provided' }, 400);
    }

    const dataTypes = ['daily_activity', 'daily_sleep', 'workout', 'session', 'daily_stress'];
    const results = [];

    for (const dataType of dataTypes) {
      try {
        const response = await fetch(`${OURA_API_BASE}/webhook/subscription`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-client-id': OURA_CLIENT_ID,
            'x-client-secret': OURA_CLIENT_SECRET,
          },
          body: JSON.stringify({
            callback_url: OURA_WEBHOOK_CALLBACK_URL,
            verification_token: OURA_VERIFICATION_TOKEN,
            event_type: 'update',
            data_type: dataType,
          }),
        });

        const data = await response.json();
        results.push({ dataType, status: response.status, data });
      } catch (err) {
        results.push({ dataType, status: 'error', error: String(err) });
      }
    }

    return c.json({ subscriptions: results });
  } catch (err) {
    console.error('Webhook setup error:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// ─── Webhook Receiver ───

// GET — Oura sends this for verification
app.get('/api/oura-webhook', (c) => {
  const verificationToken = c.req.query('verification_token');
  const challenge = c.req.query('challenge');

  if (verificationToken && verificationToken === OURA_VERIFICATION_TOKEN) {
    // Oura expects the challenge echoed back in JSON format
    if (challenge) {
      return c.json({ challenge }, 200);
    }
    return c.text(verificationToken, 200);
  }

  return c.json({ error: 'Invalid verification token' }, 403);
});

// POST — Oura sends webhook events here
app.post('/api/oura-webhook', async (c) => {
  try {
    // Read raw body first for HMAC verification, then parse
    const rawBody = await c.req.text();
    const body = JSON.parse(rawBody);

    // Verify HMAC signature (required per Oura API spec)
    const signature = c.req.header('x-oura-signature');
    const timestamp = c.req.header('x-oura-timestamp');

    if (OURA_CLIENT_SECRET && signature && timestamp) {
      const hmac = createHmac('sha256', OURA_CLIENT_SECRET);
      hmac.update(timestamp + rawBody);
      const calculatedSignature = hmac.digest('hex').toUpperCase();

      if (calculatedSignature !== signature) {
        console.error('[Webhook] ❌ Invalid HMAC signature');
        return c.json({ error: 'Invalid signature' }, 401);
      }
      console.log('[Webhook] ✅ HMAC signature verified');
    } else if (OURA_CLIENT_SECRET) {
      console.warn('[Webhook] ⚠️ No signature headers present — skipping verification');
    }

    // Record the raw event
    recordWebhookEvent({
      event_type: body.event_type,
      data_type: body.data_type,
      user_id: body.user_id || 'unknown',
      timestamp: new Date().toISOString(),
      data: body,
    });

    const userId = body.user_id || 'default';
    const eventDate = getEventDate(body.event_time);
    const objectId = typeof body.object_id === 'string' ? body.object_id : undefined;

    // If we have an access token, fetch the latest data for this user
    const token = OURA_ACCESS_TOKEN;
    if (token && body.data_type) {
      try {
        await fetchAndStoreOuraData({
          token,
          userId,
          fallbackDate: eventDate,
          dataType: body.data_type,
          objectId,
        });
      } catch (err) {
        console.error('Error fetching Oura data after webhook:', err);
      }
    }

    return c.json({ status: 'received' });
  } catch (err) {
    console.error('Webhook processing error:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// ─── Fetch Oura Data Helper ───

function getEventDate(eventTime: unknown): string {
  if (typeof eventTime !== 'string') {
    return formatLocalDate(new Date());
  }

  const parsed = new Date(eventTime);
  if (Number.isNaN(parsed.getTime())) {
    return formatLocalDate(new Date());
  }

  return formatLocalDate(parsed);
}

function extractDateFromDateTime(value: unknown, fallbackDate: string): string {
  if (typeof value !== 'string') return fallbackDate;
  const [datePart] = value.split('T');
  if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
    return datePart;
  }
  return fallbackDate;
}

function extractDateFromDailyDoc(doc: Record<string, unknown>, fallbackDate: string): string {
  const day = doc.day;
  if (typeof day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(day)) {
    return day;
  }
  return fallbackDate;
}

async function fetchAndStoreOuraData(
  params: {
    token: string;
    userId: string;
    fallbackDate: string;
    dataType: string;
    objectId?: string;
  }
): Promise<void> {
  const { token, userId, fallbackDate, dataType, objectId } = params;
  const headers = { Authorization: `Bearer ${token}` };
  const queryParams = `start_date=${fallbackDate}&end_date=${fallbackDate}`;

  const getDocumentOrFirst = async (
    collectionPath: string
  ): Promise<Record<string, unknown> | undefined> => {
    if (objectId) {
      const byIdRes = await fetch(`${OURA_API_BASE}/usercollection/${collectionPath}/${objectId}`, {
        headers,
      });
      if (byIdRes.ok) {
        const singleDoc = await byIdRes.json();
        if (singleDoc && typeof singleDoc === 'object') {
          return singleDoc as Record<string, unknown>;
        }
      }
    }

    const rangeRes = await fetch(`${OURA_API_BASE}/usercollection/${collectionPath}?${queryParams}`, {
      headers,
    });
    const rangeData = await rangeRes.json();
    if (rangeData.data?.[0] && typeof rangeData.data[0] === 'object') {
      return rangeData.data[0] as Record<string, unknown>;
    }
    return undefined;
  };

  const getCollection = async (collectionPath: string): Promise<Record<string, unknown>[]> => {
    if (objectId) {
      const byIdRes = await fetch(`${OURA_API_BASE}/usercollection/${collectionPath}/${objectId}`, {
        headers,
      });
      if (byIdRes.ok) {
        const singleDoc = await byIdRes.json();
        if (singleDoc && typeof singleDoc === 'object') {
          return [singleDoc as Record<string, unknown>];
        }
      }
    }

    const rangeRes = await fetch(`${OURA_API_BASE}/usercollection/${collectionPath}?${queryParams}`, {
      headers,
    });
    const rangeData = await rangeRes.json();
    if (Array.isArray(rangeData.data)) {
      return rangeData.data as Record<string, unknown>[];
    }
    return [];
  };

  switch (dataType) {
    case 'daily_activity': {
      const activity = await getDocumentOrFirst('daily_activity');
      if (activity) {
        const storeDate = extractDateFromDailyDoc(activity, fallbackDate);
        updateActivityData(userId, storeDate, {
          calories: activity.total_calories as number | undefined,
          steps: activity.steps as number | undefined,
          activeMinutes:
            typeof activity.high_activity_time === 'number'
              ? Math.round(activity.high_activity_time / 60)
              : undefined,
        });
      }
      break;
    }
    case 'workout': {
      const workoutsData = await getCollection('workout');
      for (const workout of workoutsData) {
        const storeDate = extractDateFromDateTime(workout.start_datetime, fallbackDate);
        const existing = getActivityData(userId, storeDate);
        const nextWorkouts = [
          ...(existing?.workouts ?? []),
          {
            activity: (workout.activity as string) || 'unknown',
            calories: (workout.calories as number) || 0,
            duration: (workout.duration as number) || 0,
            startTime: (workout.start_datetime as string) || '',
            endTime: (workout.end_datetime as string) || '',
          },
        ];
        updateActivityData(userId, storeDate, {
          workouts: nextWorkouts,
        });
      }
      break;
    }
    case 'session': {
      const sessionsData = await getCollection('session');
      for (const session of sessionsData) {
        const storeDate = extractDateFromDateTime(session.start_datetime, fallbackDate);
        const existing = getActivityData(userId, storeDate);
        const nextSessions = [
          ...(existing?.sessions ?? []),
          {
            type: (session.type as string) || 'unknown',
            startTime: (session.start_datetime as string) || '',
            endTime: (session.end_datetime as string) || '',
          },
        ];
        updateActivityData(userId, storeDate, {
          sessions: nextSessions,
        });
      }
      break;
    }
    case 'daily_stress': {
      const stress = await getDocumentOrFirst('daily_stress');
      if (stress) {
        const storeDate = extractDateFromDailyDoc(stress, fallbackDate);
        updateActivityData(userId, storeDate, {
          stress: {
            stressHigh: stress.stress_high as number | undefined,
            recoveryHigh: stress.recovery_high as number | undefined,
            dayScore: stress.day_summary as number | undefined,
          },
        });
      }
      break;
    }
    case 'daily_sleep': {
      const sleep = await getDocumentOrFirst('daily_sleep');
      if (sleep) {
        const storeDate = extractDateFromDailyDoc(sleep, fallbackDate);
        updateActivityData(userId, storeDate, {
          sleep: {
            totalSleep:
              typeof sleep.total_sleep_duration === 'number'
                ? Math.round(sleep.total_sleep_duration / 60)
              : undefined,
            efficiency: sleep.efficiency as number | undefined,
            score: sleep.score as number | undefined,
            restingHeartRate: sleep.lowest_heart_rate as number | undefined,
          },
        });
      }
      break;
    }
  }
}

// ─── tRPC ───

app.use('/api/trpc/*', trpcServer({
  router: appRouter,
  createContext,
}));

export default app;
