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
import { WEEKLY_BAR_DATA } from '~/lib/mock-data';

const BOARD_COLORS = ['#EF4444', '#3B82F6', '#10B981'];
const BOARD_KEYS = ['英文學習', 'LeetCode', '滑雪'];

export function WeeklyBarChart() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">本週時間分佈</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={WEEKLY_BAR_DATA} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
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
            />
            <Legend
              wrapperStyle={{ fontSize: 12 }}
            />
            {BOARD_KEYS.map((key, i) => (
              <Bar key={key} dataKey={key} stackId="a" fill={BOARD_COLORS[i]} radius={i === BOARD_KEYS.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
