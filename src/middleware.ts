import { withAuth } from 'next-auth/middleware';

export default withAuth({
  callbacks: {
    authorized({ token }) {
      return !!token;
    },
  },
});

export const config = {
  matcher: [
    /*
     * Protect all routes except:
     * - /login, /register (auth pages)
     * - /api/auth/* (NextAuth API routes)
     * - /api/trpc/* (tRPC handles its own auth via protectedProcedure)
     * - _next/static, _next/image, favicon, static assets
     */
    '/((?!login|register|invite|api/auth|api/trpc|api/cron|_next/static|_next/image|favicon.ico|manifest.json|custom-sw.js|icon-.*\\.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
