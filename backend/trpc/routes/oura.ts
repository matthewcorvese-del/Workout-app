import { z } from 'zod';
import { publicProcedure, router } from '../create-context';
import {
  getActivityData,
  getAllDataForUser,
  getRecentWebhookEvents,
} from '../../services/oura-webhook-storage';

export const ouraRouter = router({
  // Get activity data for a specific date
  getDailyActivity: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        date: z.string(), // YYYY-MM-DD
      })
    )
    .query(({ input }) => {
      const data = getActivityData(input.userId, input.date);
      return data ?? null;
    }),

  // Get activity data for a date range
  getActivityRange: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        startDate: z.string(),
        endDate: z.string(),
      })
    )
    .query(({ input }) => {
      const allData = getAllDataForUser(input.userId);
      return allData.filter(
        (d) => d.date >= input.startDate && d.date <= input.endDate
      );
    }),

  // Get all stored data for a user
  getAllUserData: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(({ input }) => {
      return getAllDataForUser(input.userId);
    }),

  // Get recent webhook events (for debugging)
  getRecentEvents: publicProcedure
    .input(z.object({ limit: z.number().optional() }))
    .query(({ input }) => {
      return getRecentWebhookEvents(input.limit);
    }),
});
