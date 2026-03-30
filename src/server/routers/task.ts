import { router, protectedProcedure } from '../trpc';
import { z } from 'zod';
import { prisma } from '~/server/prisma';

export const taskRouter = router({
  byId: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(({ ctx, input }) => {
      return prisma.task.findFirstOrThrow({
        where: {
          id: input.id,
          list: { board: { user_id: ctx.userId } },
        },
        include: {
          list: { select: { boardId: true } },
          timeEntries: true,
        },
      });
    }),

  create: protectedProcedure
    .input(z.object({
      listId: z.string(),
      title: z.string().min(1),
      description: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify list/board ownership via join
      const maxOrder = await prisma.task.findFirst({
        where: {
          listId: input.listId,
          list: { board: { user_id: ctx.userId } },
        },
        orderBy: { order: 'desc' },
        select: { order: true },
      });
      return prisma.task.create({
        data: { ...input, order: (maxOrder?.order ?? -1) + 1 },
      });
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      title: z.string().min(1).optional(),
      description: z.string().optional(),
    }))
    .mutation(({ ctx, input }) => {
      const { id, ...data } = input;
      return prisma.task.update({
        where: { id, list: { board: { user_id: ctx.userId } } },
        data,
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) => {
      return prisma.task.delete({
        where: { id: input.id, list: { board: { user_id: ctx.userId } } },
      });
    }),

  // 處理同 list 內排序，以及跨 list 移動
  reorder: protectedProcedure
    .input(z.object({
      tasks: z.array(z.object({
        id: z.string(),
        listId: z.string(),
        order: z.number(),
      })),
    }))
    .mutation(({ ctx, input }) => {
      return prisma.$transaction(
        input.tasks.map(({ id, listId, order }) =>
          prisma.task.update({
            where: { id, list: { board: { user_id: ctx.userId } } },
            data: { listId, order },
          })
        )
      );
    }),
});
