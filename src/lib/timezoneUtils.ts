import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';

/**
 * 將 UTC Date 轉換為指定時區的 "YYYY-MM-DD" 日期字串。
 * 例：UTC 2026-04-13T19:00Z 在 Asia/Taipei → "2026-04-14"
 */
export function toLocalDateKey(utcDate: Date, timezone: string): string {
  return formatInTimeZone(utcDate, timezone, 'yyyy-MM-dd');
}

/**
 * 將本地日期字串（"YYYY-MM-DD"）轉換為該時區午夜對應的 UTC Date。
 * 例：Asia/Taipei 的 "2026-04-14" 午夜 → 2026-04-13T16:00:00.000Z
 */
export function localDayStartUTC(localDateStr: string, timezone: string): Date {
  return fromZonedTime(`${localDateStr}T00:00:00`, timezone);
}

/**
 * 將 "YYYY-MM-DD" 字串往前推 n 個日曆日，回傳新的 "YYYY-MM-DD" 字串。
 * 純字串/UTC 運算，不受 DST 影響。
 * 例：subLocalDateDays("2026-04-14", 3) → "2026-04-11"
 */
export function subLocalDateDays(dateStr: string, n: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - n);
  return formatInTimeZone(d, 'UTC', 'yyyy-MM-dd');
}
