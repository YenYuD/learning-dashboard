// src/components/dashboard/TimeRangeFilter.tsx
'use client';

import { Tabs, TabsList, TabsTrigger } from '~/components/ui/tabs';
import type { TimeRange } from '~/lib/mock-data';

interface TimeRangeFilterProps {
  value: TimeRange;
  onChange: (value: TimeRange) => void;
}

export function TimeRangeFilter({ value, onChange }: TimeRangeFilterProps) {
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as TimeRange)}>
      <TabsList>
        <TabsTrigger value="today">今天</TabsTrigger>
        <TabsTrigger value="week">本週</TabsTrigger>
        <TabsTrigger value="month">本月</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
