/**
 * Analytics router for LearnTrack
 * Provides dashboard summary stats, weekly breakdown, board distribution, and daily trend
 */
import { router, protectedProcedure } from '../trpc';
import { z } from 'zod';
import { prisma } from '~/server/prisma';

// 8 色依色相環每 45° 取一色，飽和度壓在 35-50%（復古陶瓷風），任意組合皆和諧
const CHART_COLORS = ['#6A9CC8', '#5BAD8A', '#D4A84C', '#C87474', '#9884CC', '#4AB8B8', '#D08456', '#BC7CAC'];

/** Return the "effective date" of a time entry: startTime if set, otherwise createdAt. */
function effectiveDate(entry: { startTime: Date | null; createdAt: Date }): Date {
  return entry.startTime ?? entry.createdAt;
}

/** UTC Date → "YYYY-MM-DD" key（統一格式，避免 getUTCMonth() 0-indexed 造成不一致） */
function toDateKey(d: Date): string {
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

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

      // Fetch all entries from the start of the year (covers all needed ranges)
      // and use effectiveDate (startTime ?? createdAt) for bucketing.
      const allEntries = await prisma.timeEntry.findMany({
        where: { ...userFilter, OR: [
          { startTime: { gte: yearStart } },
          { startTime: null, createdAt: { gte: yearStart } },
        ] },
        select: { duration: true, startTime: true, createdAt: true },
      });

      let todayMin = 0, yesterdayMin = 0, weekMin = 0, lastWeekMin = 0;
      let monthMin = 0, lastMonthMin = 0, yearMin = 0;
      const dateSet = new Set<string>();

      for (const entry of allEntries) {
        const d = effectiveDate(entry);
        const dur = entry.duration;

        // streak date set
        dateSet.add(toDateKey(d));

        yearMin += dur;
        if (d >= todayStart) todayMin += dur;
        else if (d >= yesterdayStart) yesterdayMin += dur;
        if (d >= weekStart) weekMin += dur;
        else if (d >= lastWeekStart) lastWeekMin += dur;
        if (d >= monthStart) monthMin += dur;
        else if (d >= lastMonthStart) lastMonthMin += dur;
      }

      // Count consecutive days backwards from today
      let streak = 0;
      const cursor = new Date(todayStart);
      while (true) {
        if (!dateSet.has(toDateKey(cursor))) break;
        streak++;
        cursor.setUTCDate(cursor.getUTCDate() - 1);
      }

      return {
        today:  { minutes: todayMin,  prevMinutes: yesterdayMin },
        week:   { minutes: weekMin,   prevMinutes: lastWeekMin },
        month:  { minutes: monthMin,  prevMinutes: lastMonthMin },
        year:   { minutes: yearMin },
        streak,
      };
    }),

  /** Weekly bar chart – time per board per day/week, filtered by timeRange */
  weeklyByBoard: protectedProcedure
    .input(
      z.object({
        timeRange: z.enum(['today', 'week', 'month', 'year']).default('week'),
        todayDate: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Anchor to the client's local midnight (treated as UTC midnight)
      const today = new Date(input.todayDate + 'T00:00:00.000Z');
      const y = today.getUTCFullYear();
      const m = today.getUTCMonth();

      let startDate: Date;
      let labels: string[];
      let getDayIndex: (date: Date) => number;

      if (input.timeRange === 'today') {
        startDate = today;
        labels = ['今天'];
        getDayIndex = () => 0;
      } else if (input.timeRange === 'week') {
        startDate = new Date(today);
        startDate.setUTCDate(startDate.getUTCDate() - ((startDate.getUTCDay() + 6) % 7));
        labels = ['週一', '週二', '週三', '週四', '週五', '週六', '週日'];
        getDayIndex = (date: Date) => (date.getUTCDay() + 6) % 7;
      } else if (input.timeRange === 'month') {
        // month – group by week within the month
        startDate = new Date(Date.UTC(y, m, 1));
        labels = ['第1週', '第2週', '第3週', '第4週', '第5週'];
        getDayIndex = (date: Date) => Math.min(Math.floor((date.getUTCDate() - 1) / 7), 4);
      } else {
        // year – group by month
        startDate = new Date(Date.UTC(y, 0, 1));
        labels = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
        getDayIndex = (date: Date) => date.getUTCMonth();
      }

      const entries = await prisma.timeEntry.findMany({
        where: {
          board: { user_id: ctx.userId },
          OR: [
            { startTime: { gte: startDate } },
            { startTime: null, createdAt: { gte: startDate } },
          ],
        },
        include: { board: { select: { name: true, color: true } } },
      });

      const result = labels.map((day) => ({ day }) as Record<string, string | number>);

      for (const entry of entries) {
        const index = getDayIndex(effectiveDate(entry));
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
      const baseFilter: Record<string, unknown> = {
        board: { user_id: ctx.userId },
      };
      if (input.since) {
        baseFilter.OR = [
          { startTime: { gte: input.since } },
          { startTime: null, createdAt: { gte: input.since } },
        ];
      }

      const rawEntries = await prisma.timeEntry.findMany({
        where: baseFilter,
        select: { boardId: true, duration: true },
      });

      const grouped = new Map<string, number>();
      for (const e of rawEntries) {
        grouped.set(e.boardId, (grouped.get(e.boardId) ?? 0) + e.duration);
      }

      const entries = Array.from(grouped.entries()).map(([boardId, sum]) => ({
        boardId,
        _sum: { duration: sum },
      }));

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
          OR: [
            { startTime: { gte: monthStart, lt: monthEnd } },
            { startTime: null, createdAt: { gte: monthStart, lt: monthEnd } },
          ],
        },
        select: { duration: true, startTime: true, createdAt: true },
      });

      const buckets = new Map<number, number>();
      for (const entry of entries) {
        const day = effectiveDate(entry).getUTCDate();
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

      // Cannot use groupBy with COALESCE, so fetch + group manually
      const rawEntries = await prisma.timeEntry.findMany({
        where: {
          board: { user_id: ctx.userId },
          OR: [
            { startTime: { gte: monthStart, lt: monthEnd } },
            { startTime: null, createdAt: { gte: monthStart, lt: monthEnd } },
          ],
        },
        select: { boardId: true, duration: true, startTime: true, createdAt: true },
      });

      const grouped = new Map<string, number>();
      for (const e of rawEntries) {
        grouped.set(e.boardId, (grouped.get(e.boardId) ?? 0) + e.duration);
      }

      const entries = Array.from(grouped.entries()).map(([boardId, sum]) => ({
        boardId,
        _sum: { duration: sum },
      }));

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
        todayDate: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Anchor to the client's local midnight (treated as UTC midnight)
      const today = new Date(input.todayDate + 'T00:00:00.000Z');
      const startDate = new Date(today);
      startDate.setUTCDate(startDate.getUTCDate() - (input.days - 1));

      // Fetch all entries in range at once instead of N queries
      const entries = await prisma.timeEntry.findMany({
        where: {
          board: { user_id: ctx.userId },
          OR: [
            { startTime: { gte: startDate } },
            { startTime: null, createdAt: { gte: startDate } },
          ],
        },
        select: { duration: true, startTime: true, createdAt: true },
      });

      // Bucket by day (using UTC to match client's date)
      const buckets = new Map<string, number>();
      for (const entry of entries) {
        const d = effectiveDate(entry);
        const key = toDateKey(d);
        buckets.set(key, (buckets.get(key) ?? 0) + entry.duration);
      }

      const result = [];
      for (let i = input.days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setUTCDate(date.getUTCDate() - i);
        const key = toDateKey(date);
        const minutes = buckets.get(key) ?? 0;
        result.push({
          date: `${date.getUTCMonth() + 1}/${date.getUTCDate()}`,
          hours: +(minutes / 60).toFixed(1),
        });
      }

      return result;
    }),
});
