import { prisma } from '~/server/prisma';

/** 取得用戶的所有已接受好友 ID 列表 */
export async function getAcceptedFriendIds(userId: string): Promise<string[]> {
  const friendships = await prisma.friendship.findMany({
    where: {
      status: 'ACCEPTED',
      OR: [{ requesterId: userId }, { addresseeId: userId }],
    },
    select: { requesterId: true, addresseeId: true },
  });
  return friendships.map((f) =>
    f.requesterId === userId ? f.addresseeId : f.requesterId,
  );
}
