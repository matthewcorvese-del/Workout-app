import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { trpcServer } from '@hono/trpc-server';
import { appRouter } from './trpc/app-router';
import { createContext } from './trpc/create-context';
import {
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

// ─── OAuth Token Exchange ───

app.post('/api/oauth/token', async (c) => {
  try {
    const body = await c.req.json();
    const { code, redirect_uri, grant_type, refresh_token } = body;

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

    const response = await fetch(OURA_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      return c.json({ error: 'Token exchange failed', details: data }, 400);
    }

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

    const dataTypes = ['daily_activity', 'workout', 'session', 'daily_stress'];
    const results = [];

    for (const dataType of dataTypes) {
      try {
        const response = await fetch(`${OURA_API_BASE}/webhook/subscription`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
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

  if (verificationToken && verificationToken === OURA_VERIFICATION_TOKEN) {
    return c.text(verificationToken, 200);
  }

  return c.json({ error: 'Invalid verification token' }, 403);
});

// POST — Oura sends webhook events here
app.post('/api/oura-webhook', async (c) => {
  try {
    const body = await c.req.json();

    // Record the raw event
    recordWebhookEvent({
      event_type: body.event_type,
      data_type: body.data_type,
      user_id: body.user_id || 'unknown',
      timestamp: new Date().toISOString(),
      data: body,
    });

    const userId = body.user_id || 'default';
    const today = new Date().toISOString().split('T')[0];

    // If we have an access token, fetch the latest data for this user
    const token = OURA_ACCESS_TOKEN;
    if (token && body.data_type) {
      try {
        await fetchAndStoreOuraData(token, userId, today, body.data_type);
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

async function fetchAndStoreOuraData(
  token: string,
  userId: string,
  date: string,
  dataType: string
): Promise<void> {
  const headers = { Authorization: `Bearer ${token}` };
  const params = `start_date=${date}&end_date=${date}`;

  switch (dataType) {
    case 'daily_activity': {
      const res = await fetch(`${OURA_API_BASE}/usercollection/daily_activity?${params}`, { headers });
      const data = await res.json();
      if (data.data?.[0]) {
        const activity = data.data[0];
        updateActivityData(userId, date, {
          calories: activity.total_calories,
          steps: activity.steps,
          activeMinutes: activity.high_activity_time
            ? Math.round(activity.high_activity_time / 60)
            : undefined,
        });
      }
      break;
    }
    case 'workout': {
      const res = await fetch(`${OURA_API_BASE}/usercollection/workout?${params}`, { headers });
      const data = await res.json();
      if (data.data) {
        const workouts = data.data.map((w: Record<string, unknown>) => ({
          activity: w.activity as string,
          calories: w.calories as number,
          duration: w.duration as number,
          startTime: w.start_datetime as string,
          endTime: w.end_datetime as string,
        }));
        updateActivityData(userId, date, { workouts });
      }
      break;
    }
    case 'session': {
      const res = await fetch(`${OURA_API_BASE}/usercollection/session?${params}`, { headers });
      const data = await res.json();
      if (data.data) {
        const sessions = data.data.map((s: Record<string, unknown>) => ({
          type: s.type as string,
          startTime: s.start_datetime as string,
          endTime: s.end_datetime as string,
        }));
        updateActivityData(userId, date, { sessions });
      }
      break;
    }
    case 'daily_stress': {
      const res = await fetch(`${OURA_API_BASE}/usercollection/daily_stress?${params}`, { headers });
      const data = await res.json();
      if (data.data?.[0]) {
        const stress = data.data[0];
        updateActivityData(userId, date, {
          stress: {
            stressHigh: stress.stress_high,
            recoveryHigh: stress.recovery_high,
            dayScore: stress.day_summary,
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
