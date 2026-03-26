// src/components/dashboard/StatsRow.tsx
import { StatsCard } from './StatsCard';
import type { TimeRange } from '~/lib/mock-data';
import { STATS_DATA } from '~/lib/mock-data';

interface StatsRowProps {
  timeRange: TimeRange;
}

export function StatsRow({ timeRange }: StatsRowProps) {
  const stats = STATS_DATA[timeRange];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatsCard
        title="今日學習"
        value={stats.today.value}
        unit={stats.today.unit}
        trend={stats.today.trend}
        trendUp={stats.today.trendUp}
      />
      <StatsCard
        title="本週學習"
        value={stats.week.value}
        unit={stats.week.unit}
        trend={stats.week.trend}
        trendUp={stats.week.trendUp}
      />
      <StatsCard
        title="本月學習"
        value={stats.month.value}
        unit={stats.month.unit}
        trend={stats.month.trend}
        trendUp={stats.month.trendUp}
      />
      <StatsCard
        title="活躍項目"
        value={stats.boards.value}
        unit={stats.boards.unit}
      />
    </div>
  );
}
