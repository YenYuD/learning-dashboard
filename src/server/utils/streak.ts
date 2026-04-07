import { prisma } from '~/server/prisma';

/** Streak 最多回溯天數 */
const MAX_STREAK_LOOKBACK_DAYS = 90;

/** 從 timeEntry 的 createdAt 列表計算連續學習天數 */
export function calculateStreakFromDates(dates: Date[]): number {
  const dateSet = new Set(
    dates.map((d) => {
      const dt = new Date(d);
      return `${dt.getUTCFullYear()}-${dt.getUTCMonth()}-${dt.getUTCDate()}`;
    }),
  );

  let streak = 0;
  const cursor = new Date();
  cursor.setUTCHours(0, 0, 0, 0);

  // If no entry today, start checking from yesterday
  const todayKey = `${cursor.getUTCFullYear()}-${cursor.getUTCMonth()}-${cursor.getUTCDate()}`;
  if (!dateSet.has(todayKey)) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  while (true) {
    const key = `${cursor.getUTCFullYear()}-${cursor.getUTCMonth()}-${cursor.getUTCDate()}`;
    if (!dateSet.has(key)) break;
    streak++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
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
export async function calculateStreak(userId: string): Promise<number> {
  const entries = await prisma.timeEntry.findMany({
    where: {
      board: { user_id: userId },
      createdAt: { gte: getLookbackDate() },
    },
    select: { createdAt: true },
  });

  return calculateStreakFromDates(entries.map((e) => e.createdAt));
}

/** 批量計算多個用戶的連續學習天數（單一查詢避免 N+1） */
export async function calculateStreaksForUsers(userIds: string[]): Promise<Map<string, number>> {
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
    result.set(uid, calculateStreakFromDates(dates));
  }
  return result;
}
