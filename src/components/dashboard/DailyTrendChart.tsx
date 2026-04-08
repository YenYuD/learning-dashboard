// src/components/dashboard/DailyTrendChart.tsx
'use client';

import { useMemo } from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Skeleton } from '~/components/ui/skeleton';
import { trpc } from '~/utils/trpc';
import type { TimeRange } from './DashboardContent';

const DAYS_MAP: Record<TimeRange, number> = { today: 1, week: 7, month: 30, year: 365 };
const TITLES: Record<TimeRange, string> = {
  today: '今日趨勢',
  week: '每日趨勢（近7天）',
  month: '每日趨勢（近30天）',
  year: '每日趨勢（近365天）',
};
const EMPTY_MESSAGES: Record<TimeRange, string> = {
  today: '今日尚無學習記錄',
  week: '近七天尚無學習記錄',
  month: '近三十天尚無學習記錄',
  year: '本年尚無學習記錄',
};

interface DailyTrendChartProps {
  timeRange: TimeRange;
}

export function DailyTrendChart({ timeRange }: DailyTrendChartProps) {
  const todayDate = useMemo(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  const { data, isLoading } = trpc.analytics.dailyTrend.useQuery({
    days: DAYS_MAP[timeRange],
    todayDate,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{TITLES[timeRange]}</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[220px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const chartData = data ?? [];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{TITLES[timeRange]}</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.every((d) => d.hours === 0) ? (
          <div className="flex items-center justify-center h-[220px] text-sm text-muted-foreground">
            {EMPTY_MESSAGES[timeRange]}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                  fontSize: 12,
                }}
                formatter={(value) => [`${String(value)}h`, '學習時數']}
              />
              <Area
                type="monotone"
                dataKey="hours"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#trendGradient)"
                dot={{ fill: 'hsl(var(--primary))', r: 3 }}
                activeDot={{ r: 5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
