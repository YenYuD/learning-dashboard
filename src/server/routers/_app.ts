/**
 * This file contains the root router of your tRPC-backend
 */
import { createCallerFactory, publicProcedure, router } from '../trpc';
import { boardRouter } from './board';
import { timeEntriesRouter } from './timeEntries';
import { listRouter } from './list';
import { taskRouter } from './task';
import { analyticsRouter } from './analytics';
import { friendRouter } from './friend';
import { rankingRouter } from './ranking';
import { friendStatsRouter } from './friendStats';
import { notificationRouter } from './notification';
import { userRouter } from './user';

export const appRouter = router({
  healthcheck: publicProcedure.query(() => 'Learning Dashboard API is running!'),
  // Add your routers here:
  board: boardRouter,
  timeEntries: timeEntriesRouter,
  list: listRouter,
  task: taskRouter,
  analytics: analyticsRouter,
  friend: friendRouter,
  ranking: rankingRouter,
  friendStats: friendStatsRouter,
  notification: notificationRouter,
  user: userRouter,
});

export const createCaller = createCallerFactory(appRouter);

export type AppRouter = typeof appRouter;
