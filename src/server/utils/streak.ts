import { prisma } from '~/server/prisma';

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

/** 計算用戶的連續學習天數 */
export async function calculateStreak(userId: string): Promise<number> {
  const entries = await prisma.timeEntry.findMany({
    where: { board: { user_id: userId } },
    select: { createdAt: true },
  });

  return calculateStreakFromDates(entries.map((e) => e.createdAt));
}
