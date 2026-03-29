// src/components/dashboard/BoardDonutChart.tsx
'use client';

import {
  PieChart,
  Pie,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Skeleton } from '~/components/ui/skeleton';
import { trpc } from '~/utils/trpc';
import { MOCK_USER_ID } from '~/lib/constants';
import type { TimeRange } from '~/app/(app)/dashboard/page';

const TITLES: Record<TimeRange, string> = {
  today: '今日時間佔比',
  week: '本週時間佔比',
  month: '本月時間佔比',
  year: '本年時間佔比',
};

function getSince(timeRange: TimeRange): Date {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (timeRange === 'today') return today;
  if (timeRange === 'week') {
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
    return weekStart;
  }
  if (timeRange === 'month') return new Date(now.getFullYear(), now.getMonth(), 1);
  return new Date(now.getFullYear(), 0, 1);
}

interface BoardDonutChartProps {
  timeRange: TimeRange;
}

export function BoardDonutChart({ timeRange }: BoardDonutChartProps) {
  const { data, isLoading } = trpc.analytics.boardDistribution.useQuery({
    userId: MOCK_USER_ID,
    since: getSince(timeRange),
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
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-[220px] text-sm text-muted-foreground">
            {TITLES[timeRange].replace('佔比', '')}尚無學習記錄
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={chartData.map((d) => ({ ...d, fill: d.color }))}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                    fontSize: 12,
                  }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  formatter={(value, name) => {
                    return [`${Number(value ?? 0)}%`, name];
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 flex flex-col gap-1">
              {chartData.map((entry) => (
                <div key={entry.name} className="flex items-center gap-2 text-xs">
                  <div
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-muted-foreground">{entry.name}</span>
                  <span className="ml-auto font-medium">{entry.value}%</span>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
