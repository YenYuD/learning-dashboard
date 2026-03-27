// src/components/dashboard/StatsRow.tsx
'use client';

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
  const { data, isLoading } = trpc.analytics.summary.useQuery({
    userId: MOCK_USER_ID,
  });

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-28 rounded-lg" />
        ))}
      </div>
    );
  }

  const todayTrend = trendText(data.today.minutes, data.today.prevMinutes, '昨天');
  const weekTrend = trendText(data.week.minutes, data.week.prevMinutes, '上週');
  const monthTrend = trendText(data.month.minutes, data.month.prevMinutes, '上月');

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
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
        title="活躍項目"
        value={String(data.boardCount)}
        unit="個 Boards"
      />
    </div>
  );
}
