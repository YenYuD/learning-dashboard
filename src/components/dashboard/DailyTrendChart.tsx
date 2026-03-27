// src/components/dashboard/DailyTrendChart.tsx
'use client';

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
import { MOCK_USER_ID } from '~/lib/constants';

export function DailyTrendChart() {
  const { data, isLoading } = trpc.analytics.dailyTrend.useQuery({
    userId: MOCK_USER_ID,
    days: 7,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">每日趨勢</CardTitle>
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
        <CardTitle className="text-base">每日趨勢</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.every((d) => d.hours === 0) ? (
          <div className="flex items-center justify-center h-[220px] text-sm text-muted-foreground">
            近七天尚無學習記錄
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
                formatter={(value) => [`${value}h`, '學習時數']}
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
