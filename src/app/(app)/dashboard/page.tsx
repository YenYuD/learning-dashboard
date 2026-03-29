// src/app/(app)/dashboard/page.tsx
'use client';

import { useState } from 'react';
import { StatsRow } from '~/components/dashboard/StatsRow';
import { TimeRangeFilter } from '~/components/dashboard/TimeRangeFilter';
import { WeeklyBarChart } from '~/components/dashboard/WeeklyBarChart';
import { BoardDonutChart } from '~/components/dashboard/BoardDonutChart';
import { DailyTrendChart } from '~/components/dashboard/DailyTrendChart';
import { MonthlyCalendar } from '~/components/dashboard/MonthlyCalendar';

export type TimeRange = 'today' | 'week' | 'month' | 'year';

export default function DashboardPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('week');

  return (
    <div className="py-10 px-12 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-[40px] font-medium leading-tight">Learning Dashboard</h1>
        <TimeRangeFilter value={timeRange} onChange={setTimeRange} />
      </div>
      <StatsRow />
      <WeeklyBarChart timeRange={timeRange} />
      <div className="grid gap-4 lg:grid-cols-2">
        <BoardDonutChart timeRange={timeRange} />
        <DailyTrendChart timeRange={timeRange} />
      </div>
      <div className='lg:w-1/2 w-full'>
        <MonthlyCalendar />
      </div>
    </div>
  );
}
