import { prisma } from '~/server/prisma';
import { toLocalDateKey, subLocalDateDays } from '~/lib/timezoneUtils';

/** Streak 最多回溯天數 */
const MAX_STREAK_LOOKBACK_DAYS = 90;

/** 從 timeEntry 的日期列表計算連續學習天數（timezone-aware） */
export function calculateStreakFromDates(dates: Date[], timezone = 'UTC'): number {
  const dateSet = new Set(dates.map((d) => toLocalDateKey(new Date(d), timezone)));

  let streak = 0;
  let cursorStr = toLocalDateKey(new Date(), timezone);

  // 今天沒有記錄則從昨天開始算
  if (!dateSet.has(cursorStr)) {
    cursorStr = subLocalDateDays(cursorStr, 1);
  }

  while (dateSet.has(cursorStr) && streak <= MAX_STREAK_LOOKBACK_DAYS) {
    streak++;
    cursorStr = subLocalDateDays(cursorStr, 1);
  }

  return streak;
}

function getLookbackDate(): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - MAX_STREAK_LOOKBACK_DAYS);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/** 計算單一用戶的連續學習天數 */
export async function calculateStreak(userId: string, timezone = 'UTC'): Promise<number> {
  const entries = await prisma.timeEntry.findMany({
    where: {
      board: { user_id: userId },
      createdAt: { gte: getLookbackDate() },
    },
    select: { createdAt: true },
  });

  return calculateStreakFromDates(entries.map((e) => e.createdAt), timezone);
}

/** 批量計算多個用戶的連續學習天數（單一查詢避免 N+1） */
export async function calculateStreaksForUsers(userIds: string[], timezone = 'UTC'): Promise<Map<string, number>> {
  const entries = await prisma.timeEntry.findMany({
    where: {
      board: { user_id: { in: userIds } },
      createdAt: { gte: getLookbackDate() },
    },
    select: { createdAt: true, board: { select: { user_id: true } } },
  });

  // Group dates by user
  const userDates = new Map<string, Date[]>();
  for (const uid of userIds) userDates.set(uid, []);
  for (const e of entries) {
    userDates.get(e.board.user_id)?.push(e.createdAt);
  }

  const result = new Map<string, number>();
  for (const [uid, dates] of userDates) {
    result.set(uid, calculateStreakFromDates(dates, timezone));
  }
  return result;
}
