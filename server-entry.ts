import 'dotenv/config';
import { serve } from '@hono/node-server';
import app from './backend/hono';

// For Vercel serverless, we export the fetch handler
export default app;

// For local development
if (process.env.NODE_ENV === 'development') {
  const port = parseInt(process.env.PORT || '3000', 10);
  serve({ fetch: app.fetch, port }, (info) => {
    console.log(`🚀 Server running at http://localhost:${info.port}`);
  });
}
