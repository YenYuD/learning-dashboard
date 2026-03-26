// src/app/(app)/dashboard/page.tsx
'use client';

import { useState } from 'react';
import { StatsRow } from '~/components/dashboard/StatsRow';
import { TimeRangeFilter } from '~/components/dashboard/TimeRangeFilter';
import { WeeklyBarChart } from '~/components/dashboard/WeeklyBarChart';
import { BoardDonutChart } from '~/components/dashboard/BoardDonutChart';
import { DailyTrendChart } from '~/components/dashboard/DailyTrendChart';
import type { TimeRange } from '~/lib/mock-data';

export default function DashboardPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('week');

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Learning Dashboard</h1>
        <TimeRangeFilter value={timeRange} onChange={setTimeRange} />
      </div>

      {/* Stats row */}
      <StatsRow timeRange={timeRange} />

      {/* Charts */}
      <WeeklyBarChart />

      <div className="grid gap-4 lg:grid-cols-2">
        <BoardDonutChart />
        <DailyTrendChart />
      </div>
    </div>
  );
}
