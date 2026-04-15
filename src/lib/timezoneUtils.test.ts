import { describe, it, expect } from 'vitest';
import { toLocalDateKey, localDayStartUTC } from './timezoneUtils';

describe('toLocalDateKey', () => {
  it('UTC 4/13 19:00 在台灣顯示為 4/14（UTC+8）', () => {
    expect(toLocalDateKey(new Date('2026-04-13T19:00:00Z'), 'Asia/Taipei')).toBe('2026-04-14');
  });

  it('UTC 4/14 15:59 在台灣顯示為 4/14（尚未過台灣午夜）', () => {
    expect(toLocalDateKey(new Date('2026-04-14T15:59:00Z'), 'Asia/Taipei')).toBe('2026-04-14');
  });

  it('UTC 4/14 16:00 在台灣顯示為 4/15（剛好過台灣午夜）', () => {
    expect(toLocalDateKey(new Date('2026-04-14T16:00:00Z'), 'Asia/Taipei')).toBe('2026-04-15');
  });

  it('UTC 4/14 03:00 在多倫多（EDT UTC-4）顯示為 4/13', () => {
    expect(toLocalDateKey(new Date('2026-04-14T03:00:00Z'), 'America/Toronto')).toBe('2026-04-13');
  });

  it('UTC 午夜在 UTC 時區顯示為同一天', () => {
    expect(toLocalDateKey(new Date('2026-04-14T00:00:00Z'), 'UTC')).toBe('2026-04-14');
  });
});

describe('localDayStartUTC', () => {
  it('台灣 4/14 午夜 = UTC 4/13 16:00（UTC+8）', () => {
    const result = localDayStartUTC('2026-04-14', 'Asia/Taipei');
    expect(result.toISOString()).toBe('2026-04-13T16:00:00.000Z');
  });

  it('多倫多 4/14 午夜 = UTC 4/14 04:00（EDT = UTC-4）', () => {
    const result = localDayStartUTC('2026-04-14', 'America/Toronto');
    expect(result.toISOString()).toBe('2026-04-14T04:00:00.000Z');
  });

  it('UTC 時區 4/14 午夜 = UTC 4/14 00:00', () => {
    const result = localDayStartUTC('2026-04-14', 'UTC');
    expect(result.toISOString()).toBe('2026-04-14T00:00:00.000Z');
  });
});
