// src/components/dashboard/StatsRow.tsx
'use client';

import { useMemo } from 'react';
import { StatsCard } from './StatsCard';
import { Skeleton } from '~/components/ui/skeleton';
import { trpc } from '~/utils/trpc';
import { MOCK_USER_ID } from '~/lib/constants';

function formatHours(minutes: number): string {
  return (minutes / 60).toFixed(1);
}

function trendText(current: number, prev: number, label: string): { trend: string; trendUp: boolean } {
  const diff = (current - prev) / 60;
  if (prev === 0 && current === 0) return { trend: '', trendUp: true };
  const sign = diff >= 0 ? '+' : '';
  return {
    trend: `${sign}${diff.toFixed(1)}h vs ${label}`,
    trendUp: diff >= 0,
  };
}

export function StatsRow() {
  // Use the client's local date so server-side boundaries match the user's timezone
  const todayDate = useMemo(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  const { data, isLoading } = trpc.analytics.summary.useQuery({
    userId: MOCK_USER_ID,
    todayDate,
  });

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-28 rounded-lg" />
        ))}
      </div>
    );
  }

  const todayTrend = trendText(data.today.minutes, data.today.prevMinutes, '昨天');
  const weekTrend  = trendText(data.week.minutes,  data.week.prevMinutes,  '上週');
  const monthTrend = trendText(data.month.minutes, data.month.prevMinutes, '上月');

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
      <StatsCard
        title="今日學習"
        value={formatHours(data.today.minutes)}
        unit="小時"
        trend={todayTrend.trend}
        trendUp={todayTrend.trendUp}
      />
      <StatsCard
        title="本週學習"
        value={formatHours(data.week.minutes)}
        unit="小時"
        trend={weekTrend.trend}
        trendUp={weekTrend.trendUp}
      />
      <StatsCard
        title="本月學習"
        value={formatHours(data.month.minutes)}
        unit="小時"
        trend={monthTrend.trend}
        trendUp={monthTrend.trendUp}
      />
      <StatsCard
        title="本年學習"
        value={formatHours(data.year.minutes)}
        unit="小時"
      />
      <StatsCard
        title="連續學習"
        value={String(data.streak)}
        unit="天"
      />
    </div>
  );
}
