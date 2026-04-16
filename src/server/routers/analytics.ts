/**
 * Analytics router for LearnTrack
 * Provides dashboard summary stats, weekly breakdown, board distribution, and daily trend
 */
import { router, protectedProcedure } from '../trpc';
import { z } from 'zod';
import { prisma } from '~/server/prisma';
import { formatInTimeZone } from 'date-fns-tz';
import { toLocalDateKey, localDayStartUTC, subLocalDateDays } from '~/lib/timezoneUtils';

// 8 色依色相環每 45° 取一色，飽和度壓在 35-50%（復古陶瓷風），任意組合皆和諧
const CHART_COLORS = ['#6A9CC8', '#5BAD8A', '#D4A84C', '#C87474', '#9884CC', '#4AB8B8', '#D08456', '#BC7CAC'];

/** Return the "effective date" of a time entry: startTime if set, otherwise createdAt. */
function effectiveDate(entry: { startTime: Date | null; createdAt: Date }): Date {
  return entry.startTime ?? entry.createdAt;
}

/** 取得指定時區的本地星期幾（Mon=0 … Sun=6） */
function getLocalDayOfWeekMonZero(utcDate: Date, tz: string): number {
  return parseInt(formatInTimeZone(utcDate, tz, 'i')) - 1;
}

/** 取得指定時區的本地日期（1-31） */
function getLocalDay(utcDate: Date, tz: string): number {
  return parseInt(toLocalDateKey(utcDate, tz).split('-')[2], 10);
}

/** 取得指定時區的本地月份（0-11） */
function getLocalMonth0(utcDate: Date, tz: string): number {
  return parseInt(toLocalDateKey(utcDate, tz).split('-')[1], 10) - 1;
}

/** 往回一個本地日（處理 DST 安全） */
function prevLocalDayStr(localDateStr: string, tz: string): string {
  const midnight = localDayStartUTC(localDateStr, tz);
  return toLocalDateKey(new Date(midnight.getTime() - 1), tz);
}

export const analyticsRouter = router({
  /** Dashboard summary: today / week / month / year totals + streak */
  summary: protectedProcedure
    .input(z.object({
      timezone: z.string(), // IANA timezone string, e.g. "Asia/Taipei"
    }))
    .query(async ({ ctx, input }) => {
      const tz = input.timezone || 'UTC';

      // 今天的本地日期字串與各時間邊界（UTC timestamp）
      const todayDateStr    = toLocalDateKey(new Date(), tz);
      const [yStr, mStr]    = todayDateStr.split('-');
      const year            = parseInt(yStr);
      const month           = parseInt(mStr); // 1-indexed

      const todayStart      = localDayStartUTC(todayDateStr, tz);
      const yesterdayStart  = localDayStartUTC(prevLocalDayStr(todayDateStr, tz), tz);

      // 本週一（DST-safe：先算出日期字串再轉 UTC 零時，避免 ms 算術在 DST 日偏移）
      const dayOfWeek       = getLocalDayOfWeekMonZero(todayStart, tz);
      const mondayStr       = subLocalDateDays(todayDateStr, dayOfWeek);
      const weekStart       = localDayStartUTC(mondayStr, tz);
      const lastWeekStart   = localDayStartUTC(subLocalDateDays(mondayStr, 7), tz);

      // 本月、上月
      const mm              = String(month).padStart(2, '0');
      const monthStart      = localDayStartUTC(`${year}-${mm}-01`, tz);
      const prevMonthNum    = month === 1 ? 12 : month - 1;
      const prevMonthYear   = month === 1 ? year - 1 : year;
      const lastMonthStart  = localDayStartUTC(`${prevMonthYear}-${String(prevMonthNum).padStart(2, '0')}-01`, tz);

      // 今年
      const yearStart       = localDayStartUTC(`${year}-01-01`, tz);

      const userFilter = { board: { user_id: ctx.userId } };

      const allEntries = await prisma.timeEntry.findMany({
        where: { ...userFilter, OR: [
          { startTime: { gte: yearStart } },
          { startTime: null, createdAt: { gte: yearStart } },
        ] },
        select: { duration: true, startTime: true, createdAt: true },
      });

      let todayMin = 0, yesterdayMin = 0, weekMin = 0, lastWeekMin = 0;
      let monthMin = 0, lastMonthMin = 0, yearMin = 0;
      const dateSet = new Set<string>(); // local date keys "YYYY-MM-DD"

      for (const entry of allEntries) {
        const d   = effectiveDate(entry);
        const dur = entry.duration;

        dateSet.add(toLocalDateKey(d, tz));

        yearMin += dur;
        if (d >= todayStart)      todayMin     += dur;
        else if (d >= yesterdayStart) yesterdayMin += dur;
        if (d >= weekStart)       weekMin      += dur;
        else if (d >= lastWeekStart)  lastWeekMin  += dur;
        if (d >= monthStart)      monthMin     += dur;
        else if (d >= lastMonthStart) lastMonthMin += dur;
      }

      // Streak：從今天往回數連續有記錄的天數
      let streak = 0;
      let cursorStr = todayDateStr;
      while (dateSet.has(cursorStr)) {
        streak++;
        cursorStr = prevLocalDayStr(cursorStr, tz);
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
    .input(z.object({
      timeRange: z.enum(['today', 'week', 'month', 'year']).default('week'),
      timezone:  z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const tz           = input.timezone || 'UTC';
      const todayDateStr = toLocalDateKey(new Date(), tz);
      const [yStr, mStr] = todayDateStr.split('-');
      const year         = parseInt(yStr);
      const month        = parseInt(mStr); // 1-indexed
      const todayStart   = localDayStartUTC(todayDateStr, tz);

      let startDate: Date;
      let labels: string[];
      let getDayIndex: (date: Date) => number;

      if (input.timeRange === 'today') {
        startDate   = todayStart;
        labels      = ['今天'];
        getDayIndex = () => 0;

      } else if (input.timeRange === 'week') {
        const dayOfWeek = getLocalDayOfWeekMonZero(todayStart, tz);
        startDate       = localDayStartUTC(subLocalDateDays(todayDateStr, dayOfWeek), tz);
        labels          = ['週一', '週二', '週三', '週四', '週五', '週六', '週日'];
        getDayIndex     = (date: Date) => getLocalDayOfWeekMonZero(date, tz);

      } else if (input.timeRange === 'month') {
        const mm    = String(month).padStart(2, '0');
        startDate   = localDayStartUTC(`${year}-${mm}-01`, tz);
        labels      = ['第1週', '第2週', '第3週', '第4週', '第5週'];
        getDayIndex = (date: Date) => Math.min(Math.floor((getLocalDay(date, tz) - 1) / 7), 4);

      } else {
        // year
        startDate   = localDayStartUTC(`${year}-01-01`, tz);
        labels      = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
        getDayIndex = (date: Date) => getLocalMonth0(date, tz);
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
          const boardName              = entry.board.name;
          const current                = (result[index][boardName] as number) || 0;
          result[index][boardName]     = +(current + entry.duration / 60).toFixed(1);
        }
      }

      const boardNames = [...new Set(entries.map((e) => e.board.name))];
      const boardColors: Record<string, string | null> = {};
      for (const entry of entries) {
        boardColors[entry.board.name] = entry.board.color;
      }

      return { data: result, boardNames, boardColors };
    }),

  /** Donut chart – time distribution by board（since 由 client 傳入本地午夜，無需時區） */
  boardDistribution: protectedProcedure
    .input(z.object({
      since: z.date().optional(),
    }))
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

      const boardMap    = new Map(boards.map((b) => [b.id, b]));
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
      year:     z.number(),
      month:    z.number(), // 1-12
      timezone: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const tz         = input.timezone || 'UTC';
      const mm         = String(input.month).padStart(2, '0');
      const nextMonth  = input.month === 12 ? 1 : input.month + 1;
      const nextYear   = input.month === 12 ? input.year + 1 : input.year;
      const nextMM     = String(nextMonth).padStart(2, '0');

      const monthStart = localDayStartUTC(`${input.year}-${mm}-01`, tz);
      const monthEnd   = localDayStartUTC(`${nextYear}-${nextMM}-01`, tz);

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
        const day = getLocalDay(effectiveDate(entry), tz);
        buckets.set(day, (buckets.get(day) ?? 0) + entry.duration);
      }

      return Array.from(buckets.entries()).map(([day, minutes]) => ({ day, minutes }));
    }),

  /** Monthly board breakdown – total minutes per board for a given month */
  monthlyBoardBreakdown: protectedProcedure
    .input(z.object({
      year:     z.number(),
      month:    z.number(), // 1-12
      timezone: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const tz         = input.timezone || 'UTC';
      const mm         = String(input.month).padStart(2, '0');
      const nextMonth  = input.month === 12 ? 1 : input.month + 1;
      const nextYear   = input.month === 12 ? input.year + 1 : input.year;
      const nextMM     = String(nextMonth).padStart(2, '0');

      const monthStart = localDayStartUTC(`${input.year}-${mm}-01`, tz);
      const monthEnd   = localDayStartUTC(`${nextYear}-${nextMM}-01`, tz);

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
          name:    boardMap.get(e.boardId)?.name    ?? 'Unknown',
          color:   boardMap.get(e.boardId)?.color   ?? null,
          minutes: e._sum.duration ?? 0,
        }))
        .sort((a, b) => b.minutes - a.minutes);
    }),

  /** Daily trend – hours per day for the last N days */
  dailyTrend: protectedProcedure
    .input(z.object({
      days:     z.number().default(7),
      timezone: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const tz           = input.timezone || 'UTC';
      const todayDateStr = toLocalDateKey(new Date(), tz);
      const startDate    = localDayStartUTC(subLocalDateDays(todayDateStr, input.days - 1), tz);

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

      // 以本地日期分桶
      const buckets = new Map<string, number>();
      for (const entry of entries) {
        const key = toLocalDateKey(effectiveDate(entry), tz);
        buckets.set(key, (buckets.get(key) ?? 0) + entry.duration);
      }

      const result = [];
      for (let i = input.days - 1; i >= 0; i--) {
        const localKey = subLocalDateDays(todayDateStr, i);
        const [, monthStr, dayStr] = localKey.split('-');
        const minutes  = buckets.get(localKey) ?? 0;
        result.push({
          date:  `${parseInt(monthStr)}/${parseInt(dayStr)}`,
          hours: +(minutes / 60).toFixed(1),
        });
      }

      return result;
    }),
});
