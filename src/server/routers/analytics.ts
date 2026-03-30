/**
 * Analytics router for Learning Dashboard
 * Provides dashboard summary stats, weekly breakdown, board distribution, and daily trend
 */
import { router, protectedProcedure } from '../trpc';
import { z } from 'zod';
import { prisma } from '~/server/prisma';

// 8 色依色相環每 45° 取一色，飽和度壓在 35-50%（復古陶瓷風），任意組合皆和諧
const CHART_COLORS = ['#6A9CC8', '#5BAD8A', '#D4A84C', '#C87474', '#9884CC', '#4AB8B8', '#D08456', '#BC7CAC'];

export const analyticsRouter = router({
  /** Dashboard summary: today / week / month / year totals + streak */
  summary: protectedProcedure
    .input(z.object({
      // Client passes its local date as "YYYY-MM-DD" so server-side date
      // boundaries match the user's timezone rather than server UTC.
      todayDate: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      // Anchor all calculations to the client's local midnight (treated as UTC midnight)
      const todayStart = new Date(input.todayDate + 'T00:00:00.000Z');
      const y = todayStart.getUTCFullYear();
      const m = todayStart.getUTCMonth();

      // Monday of current week
      const weekStart = new Date(todayStart);
      weekStart.setUTCDate(weekStart.getUTCDate() - ((weekStart.getUTCDay() + 6) % 7));

      const monthStart = new Date(Date.UTC(y, m, 1));
      const yearStart  = new Date(Date.UTC(y, 0, 1));

      const yesterdayStart = new Date(todayStart);
      yesterdayStart.setUTCDate(yesterdayStart.getUTCDate() - 1);

      const lastWeekStart = new Date(weekStart);
      lastWeekStart.setUTCDate(lastWeekStart.getUTCDate() - 7);

      const lastMonthStart = new Date(Date.UTC(y, m - 1, 1));

      const userFilter = { board: { user_id: ctx.userId } };

      const [
        todayAgg,
        yesterdayAgg,
        weekAgg,
        lastWeekAgg,
        monthAgg,
        lastMonthAgg,
        yearAgg,
        streakEntries,
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
        prisma.timeEntry.aggregate({
          where: { ...userFilter, createdAt: { gte: yearStart } },
          _sum: { duration: true },
        }),
        // Fetch all entry dates for streak calculation (select only createdAt)
        prisma.timeEntry.findMany({
          where: userFilter,
          select: { createdAt: true },
        }),
      ]);

      // Build a Set of UTC date keys "YYYY-M-D" for O(1) lookup
      const dateSet = new Set(
        streakEntries.map((e) => {
          const d = new Date(e.createdAt);
          return `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
        }),
      );

      // Count consecutive days backwards from today
      let streak = 0;
      const cursor = new Date(todayStart);
      while (true) {
        const key = `${cursor.getUTCFullYear()}-${cursor.getUTCMonth()}-${cursor.getUTCDate()}`;
        if (!dateSet.has(key)) break;
        streak++;
        cursor.setUTCDate(cursor.getUTCDate() - 1);
      }

      return {
        today:  { minutes: todayAgg._sum.duration  ?? 0, prevMinutes: yesterdayAgg._sum.duration ?? 0 },
        week:   { minutes: weekAgg._sum.duration   ?? 0, prevMinutes: lastWeekAgg._sum.duration  ?? 0 },
        month:  { minutes: monthAgg._sum.duration  ?? 0, prevMinutes: lastMonthAgg._sum.duration ?? 0 },
        year:   { minutes: yearAgg._sum.duration   ?? 0 },
        streak,
      };
    }),

  /** Weekly bar chart – time per board per day/week, filtered by timeRange */
  weeklyByBoard: protectedProcedure
    .input(
      z.object({
        timeRange: z.enum(['today', 'week', 'month', 'year']).default('week'),
      }),
    )
    .query(async ({ ctx, input }) => {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      let startDate: Date;
      let labels: string[];
      let getDayIndex: (date: Date) => number;

      if (input.timeRange === 'today') {
        startDate = today;
        labels = ['今天'];
        getDayIndex = () => 0;
      } else if (input.timeRange === 'week') {
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - ((startDate.getDay() + 6) % 7));
        labels = ['週一', '週二', '週三', '週四', '週五', '週六', '週日'];
        getDayIndex = (date: Date) => (date.getDay() + 6) % 7;
      } else if (input.timeRange === 'month') {
        // month – group by week within the month
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        labels = ['第1週', '第2週', '第3週', '第4週', '第5週'];
        getDayIndex = (date: Date) => Math.min(Math.floor((date.getDate() - 1) / 7), 4);
      } else {
        // year – group by month
        startDate = new Date(now.getFullYear(), 0, 1);
        labels = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
        getDayIndex = (date: Date) => date.getMonth();
      }

      const entries = await prisma.timeEntry.findMany({
        where: {
          board: { user_id: ctx.userId },
          createdAt: { gte: startDate },
        },
        include: { board: { select: { name: true, color: true } } },
      });

      const result = labels.map((day) => ({ day }) as Record<string, string | number>);

      for (const entry of entries) {
        const index = getDayIndex(new Date(entry.createdAt));
        if (index >= 0 && index < labels.length) {
          const boardName = entry.board.name;
          const current = (result[index][boardName] as number) || 0;
          result[index][boardName] = +(current + entry.duration / 60).toFixed(1);
        }
      }

      const boardNames = [...new Set(entries.map((e) => e.board.name))];
      const boardColors: Record<string, string | null> = {};
      for (const entry of entries) {
        boardColors[entry.board.name] = entry.board.color;
      }

      return { data: result, boardNames, boardColors };
    }),

  /** Donut chart – time distribution by board */
  boardDistribution: protectedProcedure
    .input(
      z.object({
        since: z.date().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = {
        board: { user_id: ctx.userId },
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
        where: { user_id: ctx.userId },
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
          color: board?.color ?? CHART_COLORS[i % CHART_COLORS.length],
        };
      });
    }),

  /** Monthly calendar – total minutes per day for a given year/month */
  monthlyCalendar: protectedProcedure
    .input(z.object({
      year:  z.number(),
      month: z.number(), // 1-12, from client's local date
    }))
    .query(async ({ ctx, input }) => {
      const monthStart = new Date(Date.UTC(input.year, input.month - 1, 1));
      const monthEnd   = new Date(Date.UTC(input.year, input.month,     1)); // exclusive

      const entries = await prisma.timeEntry.findMany({
        where: {
          board: { user_id: ctx.userId },
          createdAt: { gte: monthStart, lt: monthEnd },
        },
        select: { duration: true, createdAt: true },
      });

      const buckets = new Map<number, number>();
      for (const entry of entries) {
        const day = new Date(entry.createdAt).getUTCDate();
        buckets.set(day, (buckets.get(day) ?? 0) + entry.duration);
      }

      return Array.from(buckets.entries()).map(([day, minutes]) => ({ day, minutes }));
    }),

  /** Monthly board breakdown – total minutes per board for current month */
  monthlyBoardBreakdown: protectedProcedure
    .input(z.object({
      year:   z.number(),
      month:  z.number(), // 1-12
    }))
    .query(async ({ ctx, input }) => {
      const monthStart = new Date(Date.UTC(input.year, input.month - 1, 1));
      const monthEnd   = new Date(Date.UTC(input.year, input.month,     1));

      const entries = await prisma.timeEntry.groupBy({
        by: ['boardId'],
        where: {
          board: { user_id: ctx.userId },
          createdAt: { gte: monthStart, lt: monthEnd },
        },
        _sum: { duration: true },
      });

      const boards = await prisma.board.findMany({
        where: { id: { in: entries.map((e) => e.boardId) } },
        select: { id: true, name: true, color: true },
      });

      const boardMap = new Map(boards.map((b) => [b.id, { name: b.name, color: b.color }]));

      return entries
        .map((e) => ({
          name: boardMap.get(e.boardId)?.name ?? 'Unknown',
          color: boardMap.get(e.boardId)?.color ?? null,
          minutes: e._sum.duration ?? 0,
        }))
        .sort((a, b) => b.minutes - a.minutes);
    }),

  /** Daily trend – hours per day for the last N days */
  dailyTrend: protectedProcedure
    .input(
      z.object({
        days: z.number().default(7),
      }),
    )
    .query(async ({ ctx, input }) => {
      const now = new Date();
      const startDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - (input.days - 1),
      );

      // Fetch all entries in range at once instead of N queries
      const entries = await prisma.timeEntry.findMany({
        where: {
          board: { user_id: ctx.userId },
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
