// src/components/dashboard/WeeklyBarChart.tsx
'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Skeleton } from '~/components/ui/skeleton';
import { trpc } from '~/utils/trpc';
import type { TimeRange } from './DashboardContent';

// 8 色依色相環每 45° 取一色，飽和度壓在 35-50%（復古陶瓷風），任意組合皆和諧
const CHART_COLORS = ['#6A9CC8', '#5BAD8A', '#D4A84C', '#C87474', '#9884CC', '#4AB8B8', '#D08456', '#BC7CAC'];

const TITLES: Record<TimeRange, string> = {
  today: '今日時間分佈',
  week: '本週時間分佈',
  month: '本月時間分佈',
  year: '本年時間分佈',
};

const EMPTY_MESSAGES: Record<TimeRange, string> = {
  today: '今日尚無學習記錄',
  week: '本週尚無學習記錄',
  month: '本月尚無學習記錄',
  year: '本年尚無學習記錄',
};

interface WeeklyBarChartProps {
  timeRange: TimeRange;
}

export function WeeklyBarChart({ timeRange }: WeeklyBarChartProps) {
  const { data, isLoading } = trpc.analytics.weeklyByBoard.useQuery({ timeRange });

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

  const chartData = data?.data ?? [];
  const boardNames = data?.boardNames ?? [];
  const boardColors = data?.boardColors ?? {};

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{TITLES[timeRange]}</CardTitle>
      </CardHeader>
      <CardContent>
        {boardNames.length === 0 ? (
          <div className="flex items-center justify-center h-[220px] text-sm text-muted-foreground">
            {EMPTY_MESSAGES[timeRange]}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }} style={{ outline: 'none' }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="day"
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
                itemStyle={{ color: 'hsl(var(--muted-foreground))' }}
                labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
                formatter={(value) => `${Number(value ?? 0)} hr`}
              />
              <Legend
                wrapperStyle={{ fontSize: 12 }}
                formatter={(value) => (
                  <span style={{ color: 'hsl(var(--muted-foreground))' }}>{value}</span>
                )}
              />
              {boardNames.map((name, i) => (
                <Bar
                  key={name}
                  dataKey={name}
                  stackId="a"
                  fill={boardColors[name] ?? CHART_COLORS[i % CHART_COLORS.length]}
                  radius={i === boardNames.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
