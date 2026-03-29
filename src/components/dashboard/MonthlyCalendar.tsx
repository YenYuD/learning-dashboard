// src/components/dashboard/MonthlyCalendar.tsx
'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Skeleton } from '~/components/ui/skeleton';
import { trpc } from '~/utils/trpc';
import { MOCK_USER_ID } from '~/lib/constants';

const WEEKDAY_HEADERS = ['一', '二', '三', '四', '五', '六', '日'];
const MONTH_NAMES = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'];

function hasLearning(minutes: number): boolean {
  return minutes > 0;
}

function formatDuration(minutes: number): string {
  if (minutes <= 0) return '';
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export function MonthlyCalendar() {
  // Always use the client's local date so month boundaries are correct
  const { year, month, todayDay } = useMemo(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() + 1, todayDay: d.getDate() };
  }, []);

  const { data, isLoading } = trpc.analytics.monthlyCalendar.useQuery({
    userId: MOCK_USER_ID,
    year,
    month,
  });

  // Map day → minutes for O(1) lookup
  const minutesByDay = useMemo(() => {
    const map = new Map<number, number>();
    for (const entry of data ?? []) map.set(entry.day, entry.minutes);
    return map;
  }, [data]);

  // Build calendar grid: how many empty cells before day 1 (Mon = 0)
  const firstWeekday = useMemo(() => {
    return (new Date(year, month - 1, 1).getDay() + 6) % 7; // Mon=0 … Sun=6
  }, [year, month]);

  const daysInMonth = useMemo(() => new Date(year, month, 0).getDate(), [year, month]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{MONTH_NAMES[month - 1]}月學習記錄</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Total cells = leading empties + days
  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{MONTH_NAMES[month - 1]}月學習記錄</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-1">
          {WEEKDAY_HEADERS.map((d) => (
            <div
              key={d}
              className="text-center text-xs font-medium text-muted-foreground py-1"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} />;
            }

            const isFuture = day > todayDay;
            const isToday = day === todayDay;
            const minutes = minutesByDay.get(day) ?? 0;
            const learned = !isFuture && hasLearning(minutes);
            const duration = formatDuration(minutes);

            return (
              <div
                key={day}
                className={[
                  'relative flex flex-col items-center justify-center rounded aspect-square',
                  isFuture
                    ? 'opacity-0 pointer-events-none'
                    : learned
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted/40 text-muted-foreground',
                  isToday && !learned ? 'ring-2 ring-primary ring-offset-1' : '',
                  isToday && learned ? 'ring-2 ring-primary/60 ring-offset-1' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <span className="text-[10px] leading-none font-medium">
                  {day}
                </span>
                {duration && (
                  <span className="text-[9px] leading-none opacity-80 mt-0.5">
                    {duration}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
