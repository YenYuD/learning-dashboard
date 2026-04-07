import { prisma } from '~/server/prisma';
import { env } from '~/server/env';
import { getAcceptedFriendIds } from '~/server/utils/friend';

interface NotificationPayload {
  title: string;
  body: string;
  url?: string;
}

/** Cached web-push instance */
let webPushInstance: typeof import('web-push') | null | undefined;

/** 動態載入 web-push（避免在不需要推播的環境中產生錯誤），快取初始化結果 */
async function getWebPush() {
  if (webPushInstance !== undefined) return webPushInstance;

  const publicKey = env.VAPID_PUBLIC_KEY;
  const privateKey = env.VAPID_PRIVATE_KEY;
  const email = env.VAPID_EMAIL;

  if (!publicKey || !privateKey || !email) {
    console.warn('[notification] VAPID keys not configured, skipping push');
    webPushInstance = null;
    return null;
  }

  const webPush = await import('web-push');
  webPush.setVapidDetails(email, publicKey, privateKey);
  webPushInstance = webPush;
  return webPush;
}

/** 向單一用戶的所有啟用裝置發送推播 */
export async function sendPushToUser(userId: string, payload: NotificationPayload) {
  const webPush = await getWebPush();
  if (!webPush) return;

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId, enabled: true },
  });

  const results = await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webPush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload),
        );
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } });
        }
        throw err;
      }
    }),
  );

  const failed = results.filter((r) => r.status === 'rejected');
  if (failed.length > 0) {
    console.warn(`[notification] ${failed.length}/${subscriptions.length} push(es) failed for user ${userId}`);
  }
}

/** 向多個用戶發送推播 */
export async function sendPushToUsers(userIds: string[], payload: NotificationPayload) {
  await Promise.allSettled(userIds.map((uid) => sendPushToUser(uid, payload)));
}

/** 里程碑門檻（分鐘） — 5hr, 10hr, 20hr, 50hr */
const MILESTONE_THRESHOLDS = [300, 600, 1200, 3000];

/** 檢查用戶是否跨越里程碑，並通知好友 */
export async function checkMilestoneAndNotify(userId: string, userName: string | null, addedMinutes: number) {
  const now = new Date();
  const weekStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  weekStart.setUTCDate(weekStart.getUTCDate() - ((weekStart.getUTCDay() + 6) % 7));

  const agg = await prisma.timeEntry.aggregate({
    where: { board: { user_id: userId }, createdAt: { gte: weekStart } },
    _sum: { duration: true },
  });
  const totalMinutes = agg._sum.duration ?? 0;
  const previousMinutes = totalMinutes - addedMinutes;

  const crossedThreshold = MILESTONE_THRESHOLDS.find((threshold) => {
    return previousMinutes < threshold && totalMinutes >= threshold;
  });

  if (!crossedThreshold) return;

  const hours = crossedThreshold / 60;
  const displayName = userName ?? 'Someone';

  const friendIds = await getAcceptedFriendIds(userId);

  if (friendIds.length === 0) return;

  await sendPushToUsers(friendIds, {
    title: 'Friend Milestone! 🎉',
    body: `${displayName} just hit ${hours} hours this week!`,
    url: `/friends/${userId}`,
  });
}

/** 檢查排名變動並通知被超越者 */
export async function checkRankingChangeAndNotify(userId: string, userName: string | null, addedMinutes: number) {
  const friendIds = await getAcceptedFriendIds(userId);
  if (friendIds.length === 0) return;

  const allUserIds = [userId, ...friendIds];
  const now = new Date();
  const weekStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  weekStart.setUTCDate(weekStart.getUTCDate() - ((weekStart.getUTCDay() + 6) % 7));

  const results = await prisma.timeEntry.groupBy({
    by: ['boardId'],
    where: { board: { user_id: { in: allUserIds } }, createdAt: { gte: weekStart } },
    _sum: { duration: true },
  });

  const boards = await prisma.board.findMany({
    where: { id: { in: results.map((r) => r.boardId) } },
    select: { id: true, user_id: true },
  });
  const boardUserMap = new Map(boards.map((b) => [b.id, b.user_id]));

  const userMinutes = new Map<string, number>();
  for (const uid of allUserIds) userMinutes.set(uid, 0);
  for (const r of results) {
    const uid = boardUserMap.get(r.boardId);
    if (uid) userMinutes.set(uid, (userMinutes.get(uid) ?? 0) + (r._sum.duration ?? 0));
  }

  const sorted = [...userMinutes.entries()].sort((a, b) => b[1] - a[1]);
  const myIndex = sorted.findIndex(([uid]) => uid === userId);

  if (myIndex < sorted.length - 1) {
    const overtakenUserId = sorted[myIndex + 1][0];
    const overtakenMinutes = sorted[myIndex + 1][1];
    const myMinutes = userMinutes.get(userId) ?? 0;

    const previousMinutes = myMinutes - addedMinutes;
    if (previousMinutes <= overtakenMinutes && myMinutes > overtakenMinutes) {
      const displayName = userName ?? 'Someone';
      await sendPushToUser(overtakenUserId, {
        title: 'Ranking Change',
        body: `${displayName} passed you! You're now ranked #${myIndex + 2} this week.`,
        url: '/ranking',
      });
    }
  }
}
