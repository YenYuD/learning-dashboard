import { router, protectedProcedure } from '../trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { prisma } from '~/server/prisma';
import { calculateStreakFromDates } from '~/server/utils/streak';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

/** 驗證查看者是被查看者的已接受好友 */
async function assertIsFriend(viewerId: string, friendId: string) {
  const friendship = await prisma.friendship.findFirst({
    where: {
      status: 'ACCEPTED',
      OR: [
        { requesterId: viewerId, addresseeId: friendId },
        { requesterId: friendId, addresseeId: viewerId },
      ],
    },
  });
  if (!friendship) {
    throw new TRPCError({ code: 'FORBIDDEN', message: '你們不是好友' });
  }
}

/** 本週一的 UTC 零時 */
function getWeekStart(): Date {
  const now = new Date();
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d;
}

export const friendStatsRouter = router({
  /** 好友的摘要統計 */
  getSummary: protectedProcedure
    .input(z.object({ friendId: z.string() }))
    .query(async ({ ctx, input }) => {
      await assertIsFriend(ctx.userId, input.friendId);

      const weekStart = getWeekStart();
      const userFilter = { board: { user_id: input.friendId } };

      const [user, weekAgg, taskCount, streakEntries] = await prisma.$transaction([
        prisma.user.findUniqueOrThrow({
          where: { id: input.friendId },
          select: { name: true, image: true },
        }),
        prisma.timeEntry.aggregate({
          where: { ...userFilter, createdAt: { gte: weekStart } },
          _sum: { duration: true },
        }),
        prisma.task.count({
          where: {
            list: {
              board: { user_id: input.friendId },
              name: { in: ['done', 'complete', 'completed'], mode: 'insensitive' },
            },
            updatedAt: { gte: weekStart },
          },
        }),
        prisma.timeEntry.findMany({
          where: { ...userFilter, createdAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } },
          select: { createdAt: true },
        }),
      ]);

      // Streak 計算
      const streak = calculateStreakFromDates(streakEntries.map((e) => e.createdAt));

      return {
        name: user.name,
        image: user.image,
        weeklyMinutes: weekAgg._sum.duration ?? 0,
        weeklyTasks: taskCount,
        streak,
      };
    }),

  /** 好友的本週每日學習時數（折線圖） */
  getWeeklyChart: protectedProcedure
    .input(z.object({ friendId: z.string() }))
    .query(async ({ ctx, input }) => {
      await assertIsFriend(ctx.userId, input.friendId);

      const weekStart = getWeekStart();
      const entries = await prisma.timeEntry.findMany({
        where: {
          board: { user_id: input.friendId },
          createdAt: { gte: weekStart },
        },
        select: { createdAt: true, duration: true },
      });

      const dayMinutes = new Array(7).fill(0) as number[];
      for (const e of entries) {
        const d = new Date(e.createdAt);
        const dayIndex = (d.getUTCDay() + 6) % 7; // Monday = 0
        dayMinutes[dayIndex] += e.duration;
      }

      return DAY_LABELS.map((day, i) => ({ day, minutes: dayMinutes[i] }));
    }),

  /** 好友的 Board 時間分佈（圓餅圖） */
  getBoardBreakdown: protectedProcedure
    .input(z.object({ friendId: z.string() }))
    .query(async ({ ctx, input }) => {
      await assertIsFriend(ctx.userId, input.friendId);

      const results = await prisma.timeEntry.groupBy({
        by: ['boardId'],
        where: { board: { user_id: input.friendId } },
        _sum: { duration: true },
      });

      const boards = await prisma.board.findMany({
        where: { id: { in: results.map((r) => r.boardId) } },
        select: { id: true, name: true, color: true },
      });
      const boardMap = new Map(boards.map((b) => [b.id, b]));

      return results
        .map((r) => {
          const board = boardMap.get(r.boardId);
          return {
            name: board?.name ?? 'Unknown',
            color: board?.color ?? null,
            minutes: r._sum.duration ?? 0,
          };
        })
        .sort((a, b) => b.minutes - a.minutes);
    }),
});
