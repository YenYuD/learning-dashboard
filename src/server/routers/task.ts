import { router, publicProcedure } from '../trpc';
import { z } from 'zod';
import { prisma } from '~/server/prisma';

export const taskRouter = router({
  create: publicProcedure
    .input(z.object({
      listId: z.string(),
      title: z.string().min(1),
      description: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const maxOrder = await prisma.task.findFirst({
        where: { listId: input.listId },
        orderBy: { order: 'desc' },
        select: { order: true },
      });
      return prisma.task.create({
        data: { ...input, order: (maxOrder?.order ?? -1) + 1 },
      });
    }),

  update: publicProcedure
    .input(z.object({
      id: z.string(),
      title: z.string().min(1).optional(),
      description: z.string().optional(),
    }))
    .mutation(({ input }) => {
      const { id, ...data } = input;
      return prisma.task.update({ where: { id }, data });
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input }) => {
      return prisma.task.delete({ where: { id: input.id } });
    }),

  // 處理同 list 內排序，以及跨 list 移動
  reorder: publicProcedure
    .input(z.object({
      tasks: z.array(z.object({
        id: z.string(),
        listId: z.string(),
        order: z.number(),
      })),
    }))
    .mutation(({ input }) => {
      return prisma.$transaction(
        input.tasks.map(({ id, listId, order }) =>
          prisma.task.update({ where: { id }, data: { listId, order } })
        )
      );
    }),
});
