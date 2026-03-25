/**
 * Creates context for tRPC requests
 * @see https://trpc.io/docs/v11/context
 */

// For App Router, we don't have access to req/res in the same way
// Context is created per request
export async function createContext() {
  return {};
}

export type Context = Awaited<ReturnType<typeof createContext>>;
