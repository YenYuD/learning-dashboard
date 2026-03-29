// src/components/dashboard/TimeRangeFilter.tsx
'use client';

import { Tabs, TabsList, TabsTrigger } from '~/components/ui/tabs';
import type { TimeRange } from '~/app/(app)/dashboard/page';

interface TimeRangeFilterProps {
  value: TimeRange;
  onChange: (value: TimeRange) => void;
}

const baseClasses = 'data-[active]:!bg-primary data-[active]:!text-primary-foreground py-2 px-3 rounded-none';

export function TimeRangeFilter({ value, onChange }: TimeRangeFilterProps) {
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as TimeRange)}>
      <TabsList className="bg-secondary p-1 gap-1">
        <TabsTrigger
          value="today"
          className={baseClasses}
        >
          今天
        </TabsTrigger>
        <TabsTrigger
          value="week"
          className={baseClasses}
        >
          本週
        </TabsTrigger>
        <TabsTrigger
          value="month"
          className={baseClasses}
        >
          本月
        </TabsTrigger>
        <TabsTrigger
          value="year"
          className={baseClasses}
        >
          本年
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
