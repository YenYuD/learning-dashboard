export { default } from 'next-auth/middleware';

export const config = {
  matcher: [
    /*
     * Protect all routes except:
     * - /login, /register (auth pages)
     * - /api/auth/* (NextAuth API routes)
     * - /api/trpc/* (tRPC handles its own auth via protectedProcedure)
     * - _next/static, _next/image, favicon, static assets
     */
    '/((?!login|register|api/auth|api/trpc|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
