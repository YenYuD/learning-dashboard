import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { loginIpLimiter, getClientIp } from '~/lib/rate-limit';
import * as Sentry from '@sentry/nextjs';

// 自訂 middleware 處理 rate limit，再交給 withAuth
const authMiddleware = withAuth({
  callbacks: {
    authorized({ token }) {
      return !!token;
    },
  },
});

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 登入 rate limit（攔截 credentials callback）
  if (pathname === '/api/auth/callback/credentials') {
    if (loginIpLimiter) {
      try {
        const ip = (request as any).ip ?? getClientIp(request);
        const { success, reset } = await loginIpLimiter.limit(ip);
        if (!success) {
          const retryAfter = Math.ceil((reset - Date.now()) / 1000);
          return new NextResponse(
            JSON.stringify({ error: `請求過於頻繁，請在 ${retryAfter} 秒後再試` }),
            {
              status: 429,
              headers: {
                'Content-Type': 'application/json',
                'Retry-After': String(retryAfter),
              },
            },
          );
        }
      } catch (err) {
        // fail open：Redis 掛掉不擋用戶，但記錄錯誤
        Sentry.captureException(err);
      }
    }
  }

  // 繼續 withAuth 邏輯
  // @ts-expect-error withAuth returns a handler compatible with NextMiddleware
  return authMiddleware(request);
}

export const config = {
  matcher: [
    /*
     * Protect all routes except:
     * - /login, /register (auth pages)
     * - /api/auth/* (NextAuth API routes)
     * - /api/trpc/* (tRPC handles its own auth via protectedProcedure)
     * - _next/static, _next/image, favicon, static assets
     */
    '/((?!login|register|invite|api/auth|api/trpc|api/cron|_next/static|_next/image|favicon.ico|manifest.json|sw\\.js|icon-.*\\.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
