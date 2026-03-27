/**
 * Analytics router for Learning Dashboard
 * Provides dashboard summary stats, weekly breakdown, board distribution, and daily trend
 */
import { router, publicProcedure } from '../trpc';
import { z } from 'zod';
import { prisma } from '~/server/prisma';

const CHART_COLORS = [
  '#EF4444',
  '#3B82F6',
  '#10B981',
  '#F59E0B',
  '#8B5CF6',
  '#EC4899',
  '#06B6D4',
  '#84CC16',
];

export const analyticsRouter = router({
  /** Dashboard summary: today / week / month totals with trend vs previous period */
  summary: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      // Monday of current week
      const weekStart = new Date(todayStart);
      weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));

      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      // Previous periods
      const yesterdayStart = new Date(todayStart);
      yesterdayStart.setDate(yesterdayStart.getDate() - 1);

      const lastWeekStart = new Date(weekStart);
      lastWeekStart.setDate(lastWeekStart.getDate() - 7);

      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      const userFilter = { board: { user_id: input.userId } };

      const [
        todayAgg,
        yesterdayAgg,
        weekAgg,
        lastWeekAgg,
        monthAgg,
        lastMonthAgg,
        boardCount,
      ] = await prisma.$transaction([
        prisma.timeEntry.aggregate({
          where: { ...userFilter, createdAt: { gte: todayStart } },
          _sum: { duration: true },
        }),
        prisma.timeEntry.aggregate({
          where: { ...userFilter, createdAt: { gte: yesterdayStart, lt: todayStart } },
          _sum: { duration: true },
        }),
        prisma.timeEntry.aggregate({
          where: { ...userFilter, createdAt: { gte: weekStart } },
          _sum: { duration: true },
        }),
        prisma.timeEntry.aggregate({
          where: { ...userFilter, createdAt: { gte: lastWeekStart, lt: weekStart } },
          _sum: { duration: true },
        }),
        prisma.timeEntry.aggregate({
          where: { ...userFilter, createdAt: { gte: monthStart } },
          _sum: { duration: true },
        }),
        prisma.timeEntry.aggregate({
          where: { ...userFilter, createdAt: { gte: lastMonthStart, lt: monthStart } },
          _sum: { duration: true },
        }),
        prisma.board.count({ where: { user_id: input.userId } }),
      ]);

      return {
        today: {
          minutes: todayAgg._sum.duration ?? 0,
          prevMinutes: yesterdayAgg._sum.duration ?? 0,
        },
        week: {
          minutes: weekAgg._sum.duration ?? 0,
          prevMinutes: lastWeekAgg._sum.duration ?? 0,
        },
        month: {
          minutes: monthAgg._sum.duration ?? 0,
          prevMinutes: lastMonthAgg._sum.duration ?? 0,
        },
        boardCount,
      };
    }),

  /** Weekly bar chart – time per board per day of the current week */
  weeklyByBoard: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      const now = new Date();
      const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));

      const entries = await prisma.timeEntry.findMany({
        where: {
          board: { user_id: input.userId },
          createdAt: { gte: weekStart },
        },
        include: { board: { select: { name: true } } },
      });

      const days = ['週一', '週二', '週三', '週四', '週五', '週六', '週日'];
      const result = days.map((day) => ({ day }) as Record<string, string | number>);

      for (const entry of entries) {
        const dayIndex = (new Date(entry.createdAt).getDay() + 6) % 7;
        const boardName = entry.board.name;
        const current = (result[dayIndex][boardName] as number) || 0;
        result[dayIndex][boardName] = +(current + entry.duration / 60).toFixed(1);
      }

      const boardNames = [...new Set(entries.map((e) => e.board.name))];

      return { data: result, boardNames };
    }),

  /** Donut chart – time distribution by board */
  boardDistribution: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        since: z.date().optional(),
      }),
    )
    .query(async ({ input }) => {
      const where: Record<string, unknown> = {
        board: { user_id: input.userId },
      };
      if (input.since) {
        where.createdAt = { gte: input.since };
      }

      const entries = await prisma.timeEntry.groupBy({
        by: ['boardId'],
        where,
        _sum: { duration: true },
      });

      const boards = await prisma.board.findMany({
        where: { user_id: input.userId },
        select: { id: true, name: true, color: true },
      });

      const boardMap = new Map(boards.map((b) => [b.id, b]));
      const totalMinutes = entries.reduce((s, e) => s + (e._sum.duration ?? 0), 0);

      return entries.map((e, i) => {
        const board = boardMap.get(e.boardId);
        return {
          name: board?.name ?? 'Unknown',
          value:
            totalMinutes > 0
              ? Math.round(((e._sum.duration ?? 0) / totalMinutes) * 100)
              : 0,
          color: CHART_COLORS[i % CHART_COLORS.length],
        };
      });
    }),

  /** Daily trend – hours per day for the last N days */
  dailyTrend: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        days: z.number().default(7),
      }),
    )
    .query(async ({ input }) => {
      const now = new Date();
      const startDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - (input.days - 1),
      );

      // Fetch all entries in range at once instead of N queries
      const entries = await prisma.timeEntry.findMany({
        where: {
          board: { user_id: input.userId },
          createdAt: { gte: startDate },
        },
        select: { duration: true, createdAt: true },
      });

      // Bucket by day
      const buckets = new Map<string, number>();
      for (const entry of entries) {
        const d = new Date(entry.createdAt);
        const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        buckets.set(key, (buckets.get(key) ?? 0) + entry.duration);
      }

      const result = [];
      for (let i = input.days - 1; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
        const minutes = buckets.get(key) ?? 0;
        result.push({
          date: `${date.getMonth() + 1}/${date.getDate()}`,
          hours: +(minutes / 60).toFixed(1),
        });
      }

      return result;
    }),
});
