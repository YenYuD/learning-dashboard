/**
 * 時區工具函數（使用內建 Intl API，無需額外套件）
 */

/**
 * 將 UTC Date 轉換為指定時區的 "YYYY-MM-DD" 日期字串。
 * 例：UTC 2026-04-13T19:00Z 在 Asia/Taipei → "2026-04-14"
 */
export function toLocalDateKey(utcDate: Date, timezone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(utcDate);
  // en-CA locale 輸出格式即為 "YYYY-MM-DD"
}

/**
 * 將本地日期字串（"YYYY-MM-DD"）轉換為該時區午夜對應的 UTC Date。
 * 例：Asia/Taipei 的 "2026-04-14" 午夜 → 2026-04-13T16:00:00.000Z
 */
export function localDayStartUTC(localDateStr: string, timezone: string): Date {
  const [year, month, day] = localDateStr.split('-').map(Number);

  // 用當天 UTC 正午作為參考點，取得該時區的本地時間，算出時區偏移量
  const noonUTC = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));

  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(noonUTC);

  const get = (type: string): number => {
    const val = parts.find((p) => p.type === type)?.value ?? '0';
    // hour12: false 在某些環境回傳 '24' 代表午夜 0 點
    return parseInt(val === '24' ? '0' : val, 10);
  };

  const localHour = get('hour');
  const localMinute = get('minute');
  const localSecond = get('second');

  // 計算偏移量（秒）：本地時間 - UTC 正午 12:00:00
  const localSecondsFromMidnight = localHour * 3600 + localMinute * 60 + localSecond;
  const utcNoonSeconds = 12 * 3600;
  const offsetSeconds = localSecondsFromMidnight - utcNoonSeconds;

  // 本地午夜對應的 UTC = UTC 午夜 - 偏移量
  const utcMidnight = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
  return new Date(utcMidnight.getTime() - offsetSeconds * 1000);
}
