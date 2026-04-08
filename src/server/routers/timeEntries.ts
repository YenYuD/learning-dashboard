import { router, protectedProcedure } from '../trpc';
import { z } from 'zod';
import { prisma } from '~/server/prisma';
import { checkMilestoneAndNotify, checkRankingChangeAndNotify } from './notification.service';

export const timeEntriesRouter = router({
  create: protectedProcedure
    .input(z.object({
      boardId: z.string(),
      taskId: z.string().optional(),
      duration: z.number(),
      startTime: z.date().optional(),
      endTime: z.date().optional(),
      note: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const entry = await prisma.timeEntry.create({ data: input });

      // Fire-and-forget: async notification hooks, don't block response
      const user = await prisma.user.findUnique({
        where: { id: ctx.userId },
        select: { name: true },
      });

      checkMilestoneAndNotify(ctx.userId, user?.name ?? null, input.duration).catch(console.error);
      checkRankingChangeAndNotify(ctx.userId, user?.name ?? null, input.duration).catch(console.error);

      return entry;
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      duration: z.number().optional(),
      startTime: z.date().optional(),
      endTime: z.date().optional(),
      note: z.string().optional(),
    }))
    .mutation(({ ctx, input }) => {
      const { id, ...data } = input;
      return prisma.timeEntry.update({
        where: { id, board: { user_id: ctx.userId } },
        data,
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) => {
      return prisma.timeEntry.delete({
        where: { id: input.id, board: { user_id: ctx.userId } },
      });
    }),
});
