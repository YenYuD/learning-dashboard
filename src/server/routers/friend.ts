import { router, protectedProcedure } from '../trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { prisma } from '~/server/prisma';

/**
 * 查詢兩個用戶之間是否已存在 friendship（雙向）
 */
async function findExistingFriendship(userA: string, userB: string) {
  return prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId: userA, addresseeId: userB },
        { requesterId: userB, addresseeId: userA },
      ],
    },
  });
}

/**
 * 取得用戶的所有已接受好友 ID 列表
 */
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

export const friendRouter = router({
  invite: router({
    /** 產生邀請連結（一次性，7 天效期） */
    create: protectedProcedure.mutation(async ({ ctx }) => {
      const invite = await prisma.friendInvite.create({
        data: {
          inviterId: ctx.userId,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });
      return { token: invite.token };
    }),

    /** 驗證邀請連結是否有效 */
    validate: protectedProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ ctx, input }) => {
        const invite = await prisma.friendInvite.findUnique({
          where: { token: input.token },
          include: { inviter: { select: { name: true, image: true } } },
        });

        if (!invite) {
          return { valid: false as const, reason: 'not_found' as const };
        }
        if (invite.usedById) {
          return { valid: false as const, reason: 'used' as const };
        }
        if (invite.expiresAt < new Date()) {
          return { valid: false as const, reason: 'expired' as const };
        }
        if (invite.inviterId === ctx.userId) {
          return { valid: false as const, reason: 'self' as const };
        }

        const existing = await findExistingFriendship(invite.inviterId, ctx.userId);
        if (existing && (existing.status === 'ACCEPTED' || existing.status === 'PENDING')) {
          return { valid: false as const, reason: 'already_friends' as const };
        }

        return {
          valid: true as const,
          inviterName: invite.inviter.name,
          inviterImage: invite.inviter.image,
        };
      }),

    /** 使用邀請連結（接受或拒絕） */
    use: protectedProcedure
      .input(z.object({
        token: z.string(),
        action: z.enum(['accept', 'decline']),
      }))
      .mutation(async ({ ctx, input }) => {
        const invite = await prisma.friendInvite.findUnique({
          where: { token: input.token },
        });

        if (!invite) throw new TRPCError({ code: 'NOT_FOUND', message: '邀請連結不存在' });
        if (invite.usedById) throw new TRPCError({ code: 'BAD_REQUEST', message: '此連結已被使用' });
        if (invite.expiresAt < new Date()) throw new TRPCError({ code: 'BAD_REQUEST', message: '此連結已過期' });
        if (invite.inviterId === ctx.userId) throw new TRPCError({ code: 'BAD_REQUEST', message: '不能加自己為好友' });

        const existing = await findExistingFriendship(invite.inviterId, ctx.userId);
        if (existing?.status === 'ACCEPTED') {
          throw new TRPCError({ code: 'BAD_REQUEST', message: '你們已經是好友了' });
        }

        const status = input.action === 'accept' ? 'ACCEPTED' : 'DECLINED';

        await prisma.$transaction([
          existing
            ? prisma.friendship.update({
                where: { id: existing.id },
                data: { status },
              })
            : prisma.friendship.create({
                data: {
                  requesterId: invite.inviterId,
                  addresseeId: ctx.userId,
                  status,
                },
              }),
          prisma.friendInvite.update({
            where: { id: invite.id },
            data: { usedById: ctx.userId, usedAt: new Date() },
          }),
        ]);

        return { status };
      }),
  }),

  /** 取得所有已接受的好友列表 */
  list: protectedProcedure.query(async ({ ctx }) => {
    const friendships = await prisma.friendship.findMany({
      where: {
        status: 'ACCEPTED',
        OR: [{ requesterId: ctx.userId }, { addresseeId: ctx.userId }],
      },
      include: {
        requester: { select: { id: true, name: true, image: true } },
        addressee: { select: { id: true, name: true, image: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return friendships.map((f) => {
      const friend = f.requesterId === ctx.userId ? f.addressee : f.requester;
      return {
        friendshipId: f.id,
        id: friend.id,
        name: friend.name,
        image: friend.image,
        since: f.createdAt,
      };
    });
  }),

  /** 取得收到的待處理好友邀請 */
  pending: protectedProcedure.query(async ({ ctx }) => {
    const friendships = await prisma.friendship.findMany({
      where: {
        addresseeId: ctx.userId,
        status: 'PENDING',
      },
      include: {
        requester: { select: { id: true, name: true, image: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return friendships.map((f) => ({
      id: f.id,
      requester: f.requester,
      createdAt: f.createdAt,
    }));
  }),

  /** 移除好友 */
  remove: protectedProcedure
    .input(z.object({ friendshipId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const friendship = await prisma.friendship.findFirst({
        where: {
          id: input.friendshipId,
          OR: [{ requesterId: ctx.userId }, { addresseeId: ctx.userId }],
        },
      });
      if (!friendship) throw new TRPCError({ code: 'NOT_FOUND' });

      await prisma.friendship.delete({ where: { id: input.friendshipId } });
      return { success: true };
    }),
});
