import { router, publicProcedure } from '../trpc';
import { z } from 'zod';
import { prisma } from '~/server/prisma';

export const timeEntriesRouter = router({
  create: publicProcedure
    .input(z.object({
      boardId: z.string(),
      taskId: z.string().optional(),
      duration: z.number(),
      startTime: z.date().optional(),
      endTime: z.date().optional(),
      note: z.string().optional(),
    }))
    .mutation(({ input }) => {
      return prisma.timeEntry.create({ data: input });
    }),

  update: publicProcedure
    .input(z.object({
      id: z.string(),
      duration: z.number().optional(),
      startTime: z.date().optional(),
      endTime: z.date().optional(),
      note: z.string().optional(),
    }))
    .mutation(({ input }) => {
      const { id, ...data } = input;
      return prisma.timeEntry.update({ where: { id }, data });
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input }) => {
      return prisma.timeEntry.delete({ where: { id: input.id } });
    }),
});
