import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '~/server/prisma';
import { sendPushToUser } from '~/server/routers/notification.service';

/** 根據用戶的 timezone 取得「今天零時」對應的 UTC 時間 */
function getTodayStartForTimezone(timezone: string | null): Date {
  const tz = timezone ?? 'UTC';
  try {
    const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: tz });
    const nowUtc = new Date();
    const inTz = new Date(nowUtc.toLocaleString('en-US', { timeZone: tz }));
    const offsetMs = inTz.getTime() - nowUtc.getTime();

    const [year, month, day] = todayStr.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day) - offsetMs);
  } catch {
    // Invalid timezone — fall back to UTC
    const d = new Date();
    d.setUTCHours(0, 0, 0, 0);
    return d;
  }
}

export async function POST(req: NextRequest) {
  // Verify request source
  const cronSecret = process.env.CRON_SECRET;
  const auth = req.headers.get('authorization');
  if (!cronSecret || auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Find all users with active push subscriptions, including their timezone
  const activeSubscribers = await prisma.pushSubscription.findMany({
    where: { enabled: true },
    select: { userId: true, user: { select: { timezone: true } } },
    distinct: ['userId'],
  });

  if (activeSubscribers.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  // Group subscribers by their "today start" to batch queries
  const usersByTodayStart = new Map<number, string[]>();
  for (const sub of activeSubscribers) {
    const todayStart = getTodayStartForTimezone(sub.user.timezone);
    const key = todayStart.getTime();
    const list = usersByTodayStart.get(key);
    if (list) {
      list.push(sub.userId);
    } else {
      usersByTodayStart.set(key, [sub.userId]);
    }
  }

  // Batch query: for each unique "today start", find users who have activity
  const activeUserIds = new Set<string>();
  await Promise.all(
    [...usersByTodayStart.entries()].map(async ([ts, userIds]) => {
      const entries = await prisma.timeEntry.findMany({
        where: {
          board: { user_id: { in: userIds } },
          createdAt: { gte: new Date(ts) },
        },
        select: { board: { select: { user_id: true } } },
        distinct: ['boardId'],
      });
      for (const e of entries) {
        activeUserIds.add(e.board.user_id);
      }
    }),
  );

  const allUserIds = activeSubscribers.map((s) => s.userId);
  const inactiveUserIds = allUserIds.filter((uid) => !activeUserIds.has(uid));

  const results = await Promise.allSettled(
    inactiveUserIds.map((uid) =>
      sendPushToUser(uid, {
        title: 'Study Reminder 📚',
        body: "You haven't started studying today! Keep your streak going!",
        url: '/dashboard',
      }),
    ),
  );

  const sent = results.filter((r) => r.status === 'fulfilled').length;
  return NextResponse.json({ sent, total: inactiveUserIds.length });
}
