import { router } from './create-context';
import { ouraRouter } from './routes/oura';

export const appRouter = router({
  oura: ouraRouter,
});

export type AppRouter = typeof appRouter;
