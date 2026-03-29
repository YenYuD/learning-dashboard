# Dashboard Stats & Monthly Calendar — Design Spec

**Date:** 2026-03-29
**Status:** Approved

---

## Overview

Add three new features to the Learning Dashboard:

1. **本年學習** stat card — annual hours total in the StatsRow
2. **連續學習天數** stat card — consecutive days streak (any entry counts)
3. **MonthlyCalendar** — current-month calendar heatmap showing daily learning hours

---

## Feature 1 & 2: StatsRow (5 cards)

### Change

Remove the existing「活躍項目」card. Replace with「本年學習」and「連續學習」. StatsRow grows from 4 to 5 cards.

### Final card order

| 今日學習 | 本週學習 | 本月學習 | 本年學習 | 連續學習 |
|---------|---------|---------|---------|---------|
| hours + trend vs yesterday | hours + trend vs last week | hours + trend vs last month | hours (no trend) | N 天 (no trend) |

### Grid layout

- Mobile: `grid-cols-2` (wraps to 3 rows)
- Desktop: `lg:grid-cols-5`

### Streak definition

- A day counts if there is **at least one TimeEntry** with `createdAt` on that calendar day.
- Streak is counted backwards from **today**. If today has no entry yet, streak is 0 (no grace period).
- No emoji — display as plain number + unit「天」.

---

## Feature 3: MonthlyCalendar component

### Placement

Full-width section at the bottom of the dashboard page, below the existing DonutChart / DailyTrend grid.

### Layout

```
三月學習記錄          ← section title: "{month}月學習記錄"

一  二  三  四  五  六  日   ← weekday headers
                  1   2
 3   4   5   6   7   8   9
10  11  12  13  14  15  16
17  18  19  20  21  22  23
24  25  26  27  28  29  30
31
```

Each cell shows:
- Day number (small, top-left)
- Hours label (e.g. `2h`, `30m`) when there is a record — centred
- No label for zero-minute days

Future dates (after today): rendered as empty cells with no colour.

### Colour tiers (green heatmap)

| Minutes | Tailwind / hex | Text colour |
|---------|---------------|-------------|
| 0 (past day, no entry) | `bg-muted/40` | `text-muted-foreground` |
| 1 – 30 min | `#D1FAE5` | `text-foreground` |
| 31 – 60 min | `#6EE7B7` | `text-foreground` |
| 61 – 120 min | `#34D399` | `text-foreground` |
| 121 – 180 min | `#059669` | `text-white` |
| 181+ min | `#065F46` | `text-white` |

### Duration label format

- `< 60 min` → `"Xm"` (e.g. `45m`)
- `≥ 60 min, round hour` → `"Xh"` (e.g. `2h`)
- `≥ 60 min, with remainder` → `"Xh Ym"` (e.g. `1h 30m`)

---

## Backend Changes

### `analytics.summary` — add `year` and `streak`

**New fields returned:**

```ts
{
  today: { minutes, prevMinutes },
  week:  { minutes, prevMinutes },
  month: { minutes, prevMinutes },
  year:  { minutes },           // NEW — Jan 1 to now
  streak: number,               // NEW — consecutive days from today
  boardCount,                   // kept for potential future use but no longer shown
}
```

**Streak query logic:**

1. Fetch all distinct calendar dates for the user that have at least one TimeEntry.
2. Starting from today, walk backwards day by day.
3. Stop at the first day with no entry.
4. Return the count.

Using a single `findMany` (select `createdAt` only) and a `Set<string>` lookup in application code — avoids N+1 queries.

### New procedure: `analytics.monthlyCalendar`

**Input:**

```ts
z.object({ userId: z.string() })
```

**Logic:**

- Derives `monthStart` and `monthEnd` from server's current date.
- Queries TimeEntries in range, groups by calendar day in application code.
- Returns only days that have data (frontend fills gaps with 0).

**Output:**

```ts
Array<{ day: number; minutes: number }>
// day = 1..31, minutes = total for that calendar day
```

---

## Files to Create / Modify

| File | Action |
|------|--------|
| `src/server/routers/analytics.ts` | Update `summary` (add year + streak); add `monthlyCalendar` |
| `src/components/dashboard/StatsRow.tsx` | Show 5 cards; add 本年 + 連續學習; remove 活躍項目 |
| `src/components/dashboard/MonthlyCalendar.tsx` | New component |
| `src/app/(app)/dashboard/page.tsx` | Add `<MonthlyCalendar />` below existing charts |

---

## Out of Scope

- Month navigation (previous/next) — always shows current month only.
- Minimum-duration threshold for streak — any entry counts.
- Year-over-year trend for the annual stat card.
