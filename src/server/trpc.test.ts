import { describe, it, expect } from 'vitest';
import { TRPCError } from '@trpc/server';

// Test the protectedProcedure behavior by checking it rejects unauthenticated context

describe('protectedProcedure', () => {
  it('throws UNAUTHORIZED when no session in context', async () => {
    const { protectedProcedure, router, createCallerFactory } = await import('./trpc');

    // Create a test router with a protected procedure
    const testRouter = router({
      secret: protectedProcedure.query(({ ctx }) => {
        return { userId: ctx.userId };
      }),
    });

    // Create caller with no session (empty context)
    const createCaller = createCallerFactory(testRouter);
    const caller = createCaller({ session: null, userId: null });

    await expect(caller.secret()).rejects.toThrow(TRPCError);
    await expect(caller.secret()).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    });
  });

  it('passes through when session exists', async () => {
    const { protectedProcedure, router, createCallerFactory } = await import('./trpc');

    const testRouter = router({
      secret: protectedProcedure.query(({ ctx }) => {
        return { userId: ctx.userId };
      }),
    });

    const createCaller = createCallerFactory(testRouter);
    const caller = createCaller({
      session: { user: { id: 'test-user', email: 'test@test.com', name: 'Test' }, expires: '' },
      userId: 'test-user',
    });

    const result = await caller.secret();
    expect(result.userId).toBe('test-user');
  });
});
