import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '~/auth';
import type { Session } from 'next-auth';

export async function createContext(_opts: FetchCreateContextFnOptions) {
  const session = await getServerSession(authOptions);
  return {
    session,
    userId: session?.user?.id ?? null,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
