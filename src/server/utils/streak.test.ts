import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock env and prisma before importing streak.ts (they are loaded at module evaluation time)
vi.mock('~/server/env', () => ({
  env: {
    DATABASE_URL: 'postgresql://localhost:5432/test',
    NEXTAUTH_SECRET: 'test-secret',
    NEXTAUTH_URL: 'http://localhost:3000',
    NODE_ENV: 'test',
  },
}));
vi.mock('~/server/prisma', () => ({ prisma: {} }));

import { calculateStreakFromDates } from './streak';

// 固定「今天」為 2026-04-14 UTC，讓測試不受執行時間影響
const FIXED_NOW = new Date('2026-04-14T10:00:00Z');

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(FIXED_NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('calculateStreakFromDates', () => {
  it('returns 0 for empty input', () => {
    expect(calculateStreakFromDates([])).toBe(0);
  });

  it('returns 1 when only today has an entry', () => {
    const today = new Date('2026-04-14T02:00:00Z'); // UTC 4/14
    expect(calculateStreakFromDates([today])).toBe(1);
  });

  it('returns 2 for today and yesterday', () => {
    const today     = new Date('2026-04-14T02:00:00Z');
    const yesterday = new Date('2026-04-13T02:00:00Z');
    expect(calculateStreakFromDates([today, yesterday])).toBe(2);
  });

  it('returns 1 when only yesterday has an entry (no entry today, start from yesterday)', () => {
    const yesterday = new Date('2026-04-13T02:00:00Z');
    expect(calculateStreakFromDates([yesterday])).toBe(1);
  });

  it('returns 0 when only a day before yesterday has an entry', () => {
    const dayBeforeYesterday = new Date('2026-04-12T02:00:00Z');
    expect(calculateStreakFromDates([dayBeforeYesterday])).toBe(0);
  });

  it('returns 5 for 5 consecutive days ending today', () => {
    const dates = [
      new Date('2026-04-10T02:00:00Z'),
      new Date('2026-04-11T02:00:00Z'),
      new Date('2026-04-12T02:00:00Z'),
      new Date('2026-04-13T02:00:00Z'),
      new Date('2026-04-14T02:00:00Z'),
    ];
    expect(calculateStreakFromDates(dates)).toBe(5);
  });

  it('returns 2 when there is a gap breaking the streak', () => {
    // 4/12 缺漏，streak 只能算 4/13 + 4/14 = 2
    const dates = [
      new Date('2026-04-10T02:00:00Z'),
      new Date('2026-04-11T02:00:00Z'),
      // 2026-04-12 missing
      new Date('2026-04-13T02:00:00Z'),
      new Date('2026-04-14T02:00:00Z'),
    ];
    expect(calculateStreakFromDates(dates)).toBe(2);
  });

  it('deduplicates multiple entries on the same day', () => {
    const dates = [
      new Date('2026-04-14T02:00:00Z'),
      new Date('2026-04-14T08:00:00Z'), // 同一天第二筆
      new Date('2026-04-13T02:00:00Z'),
    ];
    expect(calculateStreakFromDates(dates)).toBe(2);
  });
});
