import { NextResponse } from 'next/server';
import { prisma } from '~/server/prisma';
import { hashPassword } from '~/lib/password';
import { registerPayloadSchema } from '~/lib/validations/auth';
import { registerLimiter, getClientIp } from '~/lib/rate-limit';
import * as Sentry from '@sentry/nextjs';

export async function POST(request: Request) {
  // Rate limit：每 IP 每分鐘 5 次
  if (registerLimiter) {
    try {
      const ip = getClientIp(request);
      const { success, reset } = await registerLimiter.limit(ip);
      if (!success) {
        const retryAfter = Math.ceil((reset - Date.now()) / 1000);
        return NextResponse.json(
          { error: `請求過於頻繁，請在 ${retryAfter} 秒後再試` },
          {
            status: 429,
            headers: { 'Retry-After': String(retryAfter) },
          },
        );
      }
    } catch (err) {
      Sentry.captureException(err);
      // fail open
    }
  }

  try {
    const body = await request.json();
    const parsed = registerPayloadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 },
      );
    }

    const { name, email, password } = parsed.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: '此 Email 已被註冊' },
        { status: 409 },
      );
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    return NextResponse.json(
      { id: user.id, email: user.email, name: user.name },
      { status: 201 },
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
