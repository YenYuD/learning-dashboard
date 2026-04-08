// src/app/(app)/dashboard/page.tsx
'use client';

import { Suspense, useState } from 'react';
import { StatsRow } from '~/components/dashboard/StatsRow';
import { TimeRangeFilter } from '~/components/dashboard/TimeRangeFilter';
import { WeeklyBarChart } from '~/components/dashboard/WeeklyBarChart';
import { BoardDonutChart } from '~/components/dashboard/BoardDonutChart';
import { DailyTrendChart } from '~/components/dashboard/DailyTrendChart';
import { MonthlyCalendar } from '~/components/dashboard/MonthlyCalendar';
import { MonthlyBoardBreakdown } from '~/components/dashboard/MonthlyBoardBreakdown';
import { ChartSkeleton } from '~/components/dashboard/ChartSkeleton';

export type TimeRange = 'today' | 'week' | 'month' | 'year';

export default function DashboardPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('week');

  return (
    <div className="py-10 px-12 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-[40px] font-medium leading-tight">Learning Dashboard</h1>
        <TimeRangeFilter value={timeRange} onChange={setTimeRange} />
      </div>
      <Suspense fallback={<ChartSkeleton className="h-24 w-full rounded-lg" />}>
        <StatsRow />
      </Suspense>
      <Suspense fallback={<ChartSkeleton />}>
        <WeeklyBarChart timeRange={timeRange} />
      </Suspense>
      <div className="grid gap-4 lg:grid-cols-2">
        <Suspense fallback={<ChartSkeleton />}>
          <BoardDonutChart timeRange={timeRange} />
        </Suspense>
        <Suspense fallback={<ChartSkeleton />}>
          <DailyTrendChart timeRange={timeRange} />
        </Suspense>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Suspense fallback={<ChartSkeleton className="h-48 w-full rounded-lg" />}>
          <MonthlyCalendar />
        </Suspense>
        <Suspense fallback={<ChartSkeleton className="h-48 w-full rounded-lg" />}>
          <MonthlyBoardBreakdown />
        </Suspense>
      </div>
    </div>
  );
}
