import { describe, it, expect, vi, beforeEach } from 'vitest';

const userFindUnique = vi.fn();
const friendInviteFindUnique = vi.fn();
const friendshipFindFirst = vi.fn();
const $transaction = vi.fn();

// Mock prisma before importing the router
vi.mock('~/server/prisma', () => ({
  prisma: {
    user: {
      findUnique: userFindUnique,
    },
    friendInvite: {
      findUnique: friendInviteFindUnique,
    },
    friendship: {
      findFirst: friendshipFindFirst,
    },
    $transaction,
  },
}));

describe('friend.invite.use — demo guard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws FORBIDDEN when the actor is the demo account', async () => {
    const { friendRouter } = await import('./friend');
    const { createCallerFactory } = await import('../trpc');

    // Mock: actor lookup returns demo email
    userFindUnique.mockResolvedValueOnce({
      email: 'demo@learning-dashboard.app',
    });

    const createCaller = createCallerFactory(friendRouter);
    const caller = createCaller({
      session: { user: { id: 'demo-user-id', email: 'demo@learning-dashboard.app', name: 'Demo' }, expires: '' },
      userId: 'demo-user-id',
    });

    await expect(
      caller.invite.use({ token: 'some-token', action: 'accept' })
    ).rejects.toMatchObject({
      code: 'FORBIDDEN',
      message: 'Demo 帳號無法接受好友邀請',
    });
  });

  it('does NOT throw FORBIDDEN for a normal user', async () => {
    const { friendRouter } = await import('./friend');
    const { createCallerFactory } = await import('../trpc');

    // Mock: actor lookup returns a normal email
    userFindUnique.mockResolvedValueOnce({
      email: 'user@example.com',
    });

    // Mock: invite not found (so it fails early with NOT_FOUND, not FORBIDDEN)
    friendInviteFindUnique.mockResolvedValueOnce(null);

    const createCaller = createCallerFactory(friendRouter);
    const caller = createCaller({
      session: { user: { id: 'real-user-id', email: 'user@example.com', name: 'User' }, expires: '' },
      userId: 'real-user-id',
    });

    await expect(
      caller.invite.use({ token: 'some-token', action: 'accept' })
    ).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });
});
