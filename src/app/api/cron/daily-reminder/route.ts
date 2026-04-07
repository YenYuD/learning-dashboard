import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '~/server/prisma';
import { sendPushToUser } from '~/server/routers/notification.service';

export async function POST(req: NextRequest) {
  // Verify request source
  const cronSecret = process.env.CRON_SECRET;
  const auth = req.headers.get('authorization');
  if (!cronSecret || auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  // Find all users with active push subscriptions
  const activeSubscribers = await prisma.pushSubscription.findMany({
    where: { enabled: true },
    select: { userId: true },
    distinct: ['userId'],
  });

  const userIds = activeSubscribers.map((s) => s.userId);
  if (userIds.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  // Find users who have studied today
  const activeToday = await prisma.timeEntry.findMany({
    where: {
      board: { user_id: { in: userIds } },
      createdAt: { gte: todayStart },
    },
    select: { board: { select: { user_id: true } } },
    distinct: ['boardId'],
  });

  const activeTodayIds = new Set(activeToday.map((e) => e.board.user_id));

  // Only send reminders to users who haven't studied today
  const inactiveUserIds = userIds.filter((uid) => !activeTodayIds.has(uid));

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
