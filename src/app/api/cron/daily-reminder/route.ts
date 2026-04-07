import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '~/server/prisma';
import { sendPushToUser } from '~/server/routers/notification.service';

/** 根據用戶的 timezone 取得「今天零時」對應的 UTC 時間 */
function getTodayStartForTimezone(timezone: string | null): Date {
  const tz = timezone ?? 'UTC';
  // Get "today" date string in the user's timezone (YYYY-MM-DD format)
  const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: tz });
  // Parse as midnight UTC, then adjust by timezone offset
  // Approach: create a date formatter that tells us the offset
  const nowUtc = new Date();
  const inTz = new Date(nowUtc.toLocaleString('en-US', { timeZone: tz }));
  const offsetMs = inTz.getTime() - nowUtc.getTime();

  const [year, month, day] = todayStr.split('-').map(Number);
  // Midnight in user's TZ = that date at 00:00 local = UTC minus the offset
  return new Date(Date.UTC(year, month - 1, day) - offsetMs);
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

  // Check each user's activity based on their local "today"
  const inactiveUserIds: string[] = [];

  for (const sub of activeSubscribers) {
    const todayStart = getTodayStartForTimezone(sub.user.timezone);
    const hasActivity = await prisma.timeEntry.findFirst({
      where: {
        board: { user_id: sub.userId },
        createdAt: { gte: todayStart },
      },
      select: { id: true },
    });

    if (!hasActivity) {
      inactiveUserIds.push(sub.userId);
    }
  }

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
