import { router, protectedProcedure } from '../trpc';
import { z } from 'zod';
import { prisma } from '~/server/prisma';

export const notificationRouter = router({
  /** 訂閱推播通知（存儲 PushSubscription） */
  subscribe: protectedProcedure
    .input(z.object({
      endpoint: z.string(),
      p256dh: z.string(),
      auth: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      await prisma.pushSubscription.upsert({
        where: {
          userId_endpoint: { userId: ctx.userId, endpoint: input.endpoint },
        },
        update: { p256dh: input.p256dh, auth: input.auth, enabled: true },
        create: {
          userId: ctx.userId,
          endpoint: input.endpoint,
          p256dh: input.p256dh,
          auth: input.auth,
        },
      });
      return { success: true };
    }),

  /** 取消特定裝置的訂閱 */
  unsubscribe: protectedProcedure
    .input(z.object({ endpoint: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await prisma.pushSubscription.deleteMany({
        where: { userId: ctx.userId, endpoint: input.endpoint },
      });
      return { success: true };
    }),

  /** 切換所有裝置的通知開關 */
  toggle: protectedProcedure
    .input(z.object({ enabled: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await prisma.pushSubscription.updateMany({
        where: { userId: ctx.userId },
        data: { enabled: input.enabled },
      });
      return { success: true };
    }),

  /** 查詢通知狀態 */
  status: protectedProcedure.query(async ({ ctx }) => {
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId: ctx.userId },
      select: { enabled: true },
    });
    return {
      enabled: subscriptions.some((s) => s.enabled),
      deviceCount: subscriptions.length,
    };
  }),
});
