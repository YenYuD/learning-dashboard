import { router, protectedProcedure } from '../trpc';
import { z } from 'zod';
import { prisma } from '~/server/prisma';
import { getAcceptedFriendIds } from './friend';
import { calculateStreak } from '~/server/utils/streak';

/** 取得時間範圍起始日 */
function getTimeRangeStart(timeRange: 'week' | 'month'): Date {
  const now = new Date();
  if (timeRange === 'week') {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7)); // Monday
    return d;
  }
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

/** 計算用戶在時間範圍內完成的任務數 */
async function countCompletedTasks(userId: string, since: Date): Promise<number> {
  return prisma.task.count({
    where: {
      list: {
        board: { user_id: userId },
        name: { in: ['Done', 'done', 'Complete', 'complete', 'Completed', 'completed'] },
      },
      updatedAt: { gte: since },
    },
  });
}

export const rankingRouter = router({
  /** 取得排行榜 */
  leaderboard: protectedProcedure
    .input(z.object({
      dimension: z.enum(['hours', 'streak', 'tasks']),
      timeRange: z.enum(['week', 'month']).default('week'),
    }))
    .query(async ({ ctx, input }) => {
      const friendIds = await getAcceptedFriendIds(ctx.userId);
      const allUserIds = [ctx.userId, ...friendIds];

      const users = await prisma.user.findMany({
        where: { id: { in: allUserIds } },
        select: { id: true, name: true, image: true },
      });
      const userMap = new Map(users.map((u) => [u.id, u]));

      let entries: { userId: string; value: number }[];

      if (input.dimension === 'hours') {
        const since = getTimeRangeStart(input.timeRange);
        const results = await prisma.timeEntry.groupBy({
          by: ['boardId'],
          where: {
            board: { user_id: { in: allUserIds } },
            createdAt: { gte: since },
          },
          _sum: { duration: true },
        });

        const boards = await prisma.board.findMany({
          where: { id: { in: results.map((r) => r.boardId) } },
          select: { id: true, user_id: true },
        });
        const boardUserMap = new Map(boards.map((b) => [b.id, b.user_id]));

        const userMinutes = new Map<string, number>();
        for (const uid of allUserIds) userMinutes.set(uid, 0);
        for (const r of results) {
          const uid = boardUserMap.get(r.boardId);
          if (uid) userMinutes.set(uid, (userMinutes.get(uid) ?? 0) + (r._sum.duration ?? 0));
        }

        entries = allUserIds.map((uid) => ({ userId: uid, value: userMinutes.get(uid) ?? 0 }));

      } else if (input.dimension === 'streak') {
        entries = await Promise.all(
          allUserIds.map(async (uid) => ({
            userId: uid,
            value: await calculateStreak(uid),
          })),
        );

      } else {
        const since = getTimeRangeStart(input.timeRange);
        entries = await Promise.all(
          allUserIds.map(async (uid) => ({
            userId: uid,
            value: await countCompletedTasks(uid, since),
          })),
        );
      }

      // 排序（降序）並加上名次（dense ranking）
      entries.sort((a, b) => b.value - a.value);

      let currentRank = 1;
      return entries.map((entry, i) => {
        if (i > 0 && entry.value < entries[i - 1].value) {
          currentRank = i + 1;
        }
        const user = userMap.get(entry.userId);
        return {
          rank: currentRank,
          userId: entry.userId,
          name: user?.name ?? null,
          image: user?.image ?? null,
          value: entry.value,
        };
      });
    }),

  /** 取得自己的各維度統計 */
  myStats: protectedProcedure.query(async ({ ctx }) => {
    const weekStart = getTimeRangeStart('week');

    const [weekAgg, streak, weeklyTasks] = await Promise.all([
      prisma.timeEntry.aggregate({
        where: {
          board: { user_id: ctx.userId },
          createdAt: { gte: weekStart },
        },
        _sum: { duration: true },
      }),
      calculateStreak(ctx.userId),
      countCompletedTasks(ctx.userId, weekStart),
    ]);

    return {
      weeklyMinutes: weekAgg._sum.duration ?? 0,
      streak,
      weeklyTasks,
    };
  }),
});
