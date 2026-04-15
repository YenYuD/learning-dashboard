import { prisma } from '~/server/prisma';

/** Streak 最多回溯天數 */
const MAX_STREAK_LOOKBACK_DAYS = 90;

/** UTC Date → "YYYY-MM-DD" key（統一格式，避免 getUTCMonth() 0-indexed 與 toISOString() 不一致） */
function toDateKey(d: Date): string {
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/** 從 timeEntry 的 createdAt 列表計算連續學習天數 */
export function calculateStreakFromDates(dates: Date[]): number {
  const dateSet = new Set(dates.map((d) => toDateKey(new Date(d))));

  let streak = 0;
  const cursor = new Date();
  cursor.setUTCHours(0, 0, 0, 0);

  // If no entry today, start checking from yesterday
  if (!dateSet.has(toDateKey(cursor))) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  while (true) {
    if (!dateSet.has(toDateKey(cursor))) break;
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
