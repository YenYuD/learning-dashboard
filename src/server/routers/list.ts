import { router, publicProcedure } from '../trpc';
import { z } from 'zod';
import { prisma } from '~/server/prisma';

export const listRouter = router({
  create: publicProcedure
    .input(z.object({
      boardId: z.string(),
      name: z.string().min(1),
      description: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const maxOrder = await prisma.list.findFirst({
        where: { boardId: input.boardId },
        orderBy: { order: 'desc' },
        select: { order: true },
      });
      return prisma.list.create({
        data: { ...input, order: (maxOrder?.order ?? -1) + 1 },
      });
    }),

  update: publicProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().min(1).optional(),
      description: z.string().optional(),
    }))
    .mutation(({ input }) => {
      const { id, ...data } = input;
      return prisma.list.update({ where: { id }, data });
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input }) => {
      return prisma.list.delete({ where: { id: input.id } });
    }),

  reorder: publicProcedure
    .input(z.object({
      boardId: z.string(),
      listIds: z.array(z.string()),
    }))
    .mutation(({ input }) => {
      return prisma.$transaction(
        input.listIds.map((id, index) =>
          prisma.list.update({ where: { id }, data: { order: index } })
        )
      );
    }),
});
