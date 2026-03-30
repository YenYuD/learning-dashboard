'use client';

import { useSession } from 'next-auth/react';

/**
 * Returns the current authenticated user's ID.
 * Throws if no session exists (should only be used in protected routes).
 */
export function useCurrentUserId(): string {
  const { data: session } = useSession();
  if (!session?.user?.id) {
    throw new Error('useCurrentUserId: No authenticated session found');
  }
  return session.user.id;
}
