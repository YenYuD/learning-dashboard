# Timezone Refactor — PR Review 修正說明

本文件說明 PR #11 `refactor/timezone-fix` 在 code review 後發現的問題，以及各自的修正方式。

---

## 問題一：`getLocalDayOfWeekMonZero` 用 `Intl.DateTimeFormat` 效能低

**檔案：** `src/server/routers/analytics.ts`

**原本的實作：**
```ts
function getLocalDayOfWeekMonZero(utcDate: Date, tz: string): number {
  const weekday = new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'long' }).format(utcDate);
  const map: Record<string, number> = {
    Monday: 0, Tuesday: 1, ...
  };
  return map[weekday] ?? 0;
}
```

**問題：** 每次呼叫都建立一個新的 `Intl.DateTimeFormat` 物件，再把英文字串對映成數字，邏輯繁瑣。

**修正：** 專案已引入 `date-fns-tz`，直接用 `formatInTimeZone(utcDate, tz, 'i')` 取得 ISO 星期（1=Mon，7=Sun），減 1 即得 0–6：
```ts
function getLocalDayOfWeekMonZero(utcDate: Date, tz: string): number {
  return parseInt(formatInTimeZone(utcDate, tz, 'i')) - 1;
}
```

---

## 問題二：用固定毫秒數（`86400_000`）做日期邊界運算，在 DST 轉換日會出錯

**檔案：** `src/server/routers/analytics.ts`（影響三處）

**原本的實作：**
```ts
// summary — 計算本週一
const weekStart = new Date(todayStart.getTime() - dayOfWeek * 86400_000);
const lastWeekStart = new Date(weekStart.getTime() - 7 * 86400_000);

// weeklyByBoard — week range 起始日
startDate = new Date(todayStart.getTime() - dayOfWeek * 86400_000);

// dailyTrend — N 天前的起始日，以及迴圈中每天的日期
const startDate = new Date(todayStart.getTime() - (input.days - 1) * 86400_000);
const date = new Date(todayStart.getTime() - i * 86400_000);
```

**問題：** 在 DST（日光節約時間）轉換日，一天的長度是 23 或 25 小時，並非固定 24 小時（86400 秒）。從一個 UTC 時間戳直接減去固定毫秒數，可能會讓計算出的「本地午夜」偏移到 23:00 或 01:00，造成日期邊界錯誤。

> **注意：** code review 建議改用 `date-fns` 的 `subDays`，但 `subDays` 內部同樣是減去固定毫秒數，並不能解決 DST 問題。正確做法是在**日曆日字串層級**做減法，再透過 `localDayStartUTC` 轉成正確的 UTC 邊界。

**修正：** 在 `timezoneUtils.ts` 新增 `subLocalDateDays`，純粹操作 `"YYYY-MM-DD"` 字串，完全不涉及時區換算：
```ts
// timezoneUtils.ts
export function subLocalDateDays(dateStr: string, n: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`); // 視為 UTC 以做純日曆運算
  d.setUTCDate(d.getUTCDate() - n);
  return formatInTimeZone(d, 'UTC', 'yyyy-MM-dd');
}
```

然後把所有毫秒算術改為：
```ts
// summary
const mondayStr   = subLocalDateDays(todayDateStr, dayOfWeek);
const weekStart   = localDayStartUTC(mondayStr, tz);
const lastWeekStart = localDayStartUTC(subLocalDateDays(mondayStr, 7), tz);

// weeklyByBoard
startDate = localDayStartUTC(subLocalDateDays(todayDateStr, dayOfWeek), tz);

// dailyTrend
const startDate = localDayStartUTC(subLocalDateDays(todayDateStr, input.days - 1), tz);
// 迴圈中：
const localKey = subLocalDateDays(todayDateStr, i);
```

這樣無論在哪個時區，本地午夜的 UTC 邊界都由 `localDayStartUTC`（內部用 `date-fns-tz` 的 `fromZonedTime`）計算，DST 安全。

---

## 問題三：`timer/page.tsx` 手動拼接日期字串，冗長且不一致

**檔案：** `src/app/(app)/timer/page.tsx`

**原本的實作：**
```ts
date: (() => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
})(),
```

**問題：** IIFE 太冗長，且 `getFullYear/Month/Date` 雖然是瀏覽器本地時間（結果正確），但邏輯與其他地方使用 `toLocalDateKey` 的方式不一致。

**修正：** 改用已有的 utility：
```ts
date: toLocalDateKey(new Date(), Intl.DateTimeFormat().resolvedOptions().timeZone),
```

`Intl.DateTimeFormat().resolvedOptions().timeZone` 取得瀏覽器的 IANA 時區字串，傳入 `toLocalDateKey` 即可正確取得本地日期。

---

## 問題四：`streak.ts` 的 streak 計算未考慮用戶時區

**檔案：** `src/server/utils/streak.ts`

**原本的實作：**
```ts
function toDateKey(d: Date): string {
  // 使用 UTC 方法
  return `${d.getUTCFullYear()}-${...}-${...}`;
}

export function calculateStreakFromDates(dates: Date[]): number {
  const dateSet = new Set(dates.map((d) => toDateKey(new Date(d))));
  const cursor = new Date();
  cursor.setUTCHours(0, 0, 0, 0); // UTC 零時
  ...
}
```

**問題：** `calculateStreakFromDates` 把所有日期當成 UTC 處理，但 `analyticsRouter.summary` 的 streak 邏輯是時區感知的（用 `toLocalDateKey(d, tz)`）。若用戶在 UTC+8，一筆 UTC 時間 `2026-04-14T22:00Z` 的記錄在 `summary` 中屬於 `2026-04-15`，但在舊的 `calculateStreakFromDates` 中卻被歸為 `2026-04-14`，導致排行榜與個人儀表板的 streak 不一致。

**修正：** 加入 `timezone` 選用參數（預設 `'UTC'` 確保向後相容），並改用 `toLocalDateKey` 與 `subLocalDateDays` 做時區感知計算：
```ts
export function calculateStreakFromDates(dates: Date[], timezone = 'UTC'): number {
  const dateSet = new Set(dates.map((d) => toLocalDateKey(new Date(d), timezone)));

  let streak = 0;
  let cursorStr = toLocalDateKey(new Date(), timezone);

  if (!dateSet.has(cursorStr)) {
    cursorStr = subLocalDateDays(cursorStr, 1);
  }

  while (dateSet.has(cursorStr) && streak <= MAX_STREAK_LOOKBACK_DAYS) {
    streak++;
    cursorStr = subLocalDateDays(cursorStr, 1);
  }

  return streak;
}
```

`calculateStreak` 與 `calculateStreaksForUsers` 同步加上 `timezone = 'UTC'` 選用參數，讓排行榜（Phase 3）在取得用戶時區後可傳入，目前預設行為不變。

---

## 修改總覽

| 檔案 | 修改內容 |
|------|----------|
| `src/lib/timezoneUtils.ts` | 新增 `subLocalDateDays` helper |
| `src/server/routers/analytics.ts` | 簡化 `getLocalDayOfWeekMonZero`；修正所有 `86400_000` ms 算術 |
| `src/server/utils/streak.ts` | 移除私有 `toDateKey`；加入 `timezone` 參數；改用 `toLocalDateKey` + `subLocalDateDays` |
| `src/app/(app)/timer/page.tsx` | 用 `toLocalDateKey` 取代 IIFE 日期字串 |
