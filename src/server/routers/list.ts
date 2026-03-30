import { router, protectedProcedure } from '../trpc';
import { z } from 'zod';
import { prisma } from '~/server/prisma';
import { TRPCError } from '@trpc/server';

export const listRouter = router({
  create: protectedProcedure
    .input(z.object({
      boardId: z.string(),
      name: z.string().min(1),
      description: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify board ownership before creating list
      const board = await prisma.board.findFirst({
        where: { id: input.boardId, user_id: ctx.userId },
        select: { id: true },
      });
      if (!board) throw new TRPCError({ code: 'NOT_FOUND', message: 'Board not found' });

      const maxOrder = await prisma.list.findFirst({
        where: { boardId: input.boardId },
        orderBy: { order: 'desc' },
        select: { order: true },
      });
      return prisma.list.create({
        data: { ...input, order: (maxOrder?.order ?? -1) + 1 },
      });
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().min(1).optional(),
      description: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return prisma.list.update({
        where: { id, board: { user_id: ctx.userId } },
        data,
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return prisma.list.delete({
        where: { id: input.id, board: { user_id: ctx.userId } },
      });
    }),

  reorder: protectedProcedure
    .input(z.object({
      boardId: z.string(),
      listIds: z.array(z.string()),
    }))
    .mutation(async ({ ctx, input }) => {
      return prisma.$transaction(
        input.listIds.map((id, index) =>
          prisma.list.update({
            where: { id, board: { user_id: ctx.userId } },
            data: { order: index },
          })
        )
      );
    }),
});
