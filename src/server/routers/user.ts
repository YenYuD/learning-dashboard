import { router, protectedProcedure } from '../trpc';
import { z } from 'zod';
import { prisma } from '~/server/prisma';

export const userRouter = router({
  me: protectedProcedure.query(async ({ ctx }) => {
    return await prisma.user.findUnique({
      where: { id: ctx.userId },
      select: { id: true, name: true, email: true, image: true },
    });
  }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, '名稱為必填').max(50, '名稱不可超過 50 字'),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await prisma.user.update({
        where: { id: ctx.userId },
        data: { name: input.name.trim() },
        select: { id: true, name: true, email: true, image: true },
      });
    }),
});
