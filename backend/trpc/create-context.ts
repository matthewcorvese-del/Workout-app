import { initTRPC } from '@trpc/server';
import superjson from 'superjson';

export interface Context {
  // Add user context, auth, etc. as needed
}

export function createContext(): Record<string, unknown> {
  return {};
}

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const middleware = t.middleware;
