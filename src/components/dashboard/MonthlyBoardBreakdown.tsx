// src/components/dashboard/MonthlyBoardBreakdown.tsx
'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Skeleton } from '~/components/ui/skeleton';
import { trpc } from '~/utils/trpc';

const MONTH_NAMES = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'];

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export function MonthlyBoardBreakdown() {
  const { year, month, timezone } = useMemo(() => {
    const d  = new Date();
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return { year: d.getFullYear(), month: d.getMonth() + 1, timezone: tz };
  }, []);

  const { data, isLoading } = trpc.analytics.monthlyBoardBreakdown.useQuery({ year, month, timezone });


  const totalMinutes = useMemo(
    () => (data ?? []).reduce((sum, b) => sum + b.minutes, 0),
    [data],
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{MONTH_NAMES[month - 1]}月各看板時數</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-2 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!data?.length) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{MONTH_NAMES[month - 1]}月各看板時數</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">本月尚無學習記錄</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{MONTH_NAMES[month - 1]}月各看板時數</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((board, idx) => {
            const pct = Math.round((board.minutes / totalMinutes) * 100);
            return (
              <div key={board.name}>
                <div className="flex items-center gap-2 mb-1.5">
                  {/* Rank badge */}
                  <span className="text-[11px] font-semibold text-muted-foreground/60 w-4 shrink-0 tabular-nums">
                    {idx + 1}
                  </span>
                  <span className="text-sm font-medium flex-1 truncate">{board.name}</span>
                  <span className="text-sm font-semibold tabular-nums text-foreground">
                    {formatDuration(board.minutes)}
                  </span>
                </div>
                {/* Progress bar */}
                <div
                  className="ml-6 h-2.5 rounded-full overflow-hidden"
                  style={{ background: board.color ? `${board.color}28` : 'hsl(var(--primary) / 0.1)' }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      background: board.color ?? 'hsl(var(--primary))',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Total */}
        <div className="mt-5 pt-4 border-t flex justify-between items-center">
          <span className="text-xs text-muted-foreground">本月總計</span>
          <span className="text-sm font-semibold tabular-nums">
            {formatDuration(totalMinutes)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
