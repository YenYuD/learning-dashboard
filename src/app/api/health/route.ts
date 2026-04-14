import { NextResponse } from 'next/server';
import { prisma } from '~/server/prisma';

export async function GET() {
  try {
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), 3000),
    );
    await Promise.race([prisma.$queryRaw`SELECT 1`, timeout]);

    return NextResponse.json({ status: 'ok', db: 'ok' }, { status: 200 });
  } catch (err) {
    const error = err as Error;
    if (error.message === 'timeout') {
      return NextResponse.json(
        { status: 'error', db: 'timeout' },
        { status: 503 },
      );
    }
    return NextResponse.json(
      { status: 'error', db: 'error', message: error.message },
      { status: 503 },
    );
  }
}
