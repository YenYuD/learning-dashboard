'use client';

import { Suspense, useState } from 'react';
import { StatsRow } from './StatsRow';
import { TimeRangeFilter } from './TimeRangeFilter';
import { WeeklyBarChart } from './WeeklyBarChart';
import { BoardDonutChart } from './BoardDonutChart';
import { DailyTrendChart } from './DailyTrendChart';
import { MonthlyCalendar } from './MonthlyCalendar';
import { MonthlyBoardBreakdown } from './MonthlyBoardBreakdown';
import { ChartSkeleton } from './ChartSkeleton';

export type TimeRange = 'today' | 'week' | 'month' | 'year';

export function DashboardContent() {
  const [timeRange, setTimeRange] = useState<TimeRange>('week');

  return (
    <>
      <div className="flex flex-col gap-2">
        <h1 className="text-[40px] font-medium leading-tight">LearnTrack</h1>
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
    </>
  );
}
