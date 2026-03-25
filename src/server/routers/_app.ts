/**
 * This file contains the root router of your tRPC-backend
 */
import { createCallerFactory, publicProcedure, router } from '../trpc';
import { boardRouter } from './board';
// import { listRouter } from './list';
// import { taskRouter } from './task';
// import { timeEntryRouter } from './timeEntry';

export const appRouter = router({
  healthcheck: publicProcedure.query(() => 'Learning Dashboard API is running!'),

  // Add your routers here:
  board: boardRouter,
  // list: listRouter,
  // task: taskRouter,
  // timeEntry: timeEntryRouter,
});

export const createCaller = createCallerFactory(appRouter);

export type AppRouter = typeof appRouter;
