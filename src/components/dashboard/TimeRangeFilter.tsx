// src/components/dashboard/TimeRangeFilter.tsx
'use client';

import { Tabs, TabsList, TabsTrigger } from '~/components/ui/tabs';
import type { TimeRange } from '~/app/(app)/dashboard/page';

interface TimeRangeFilterProps {
  value: TimeRange;
  onChange: (value: TimeRange) => void;
}

export function TimeRangeFilter({ value, onChange }: TimeRangeFilterProps) {
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as TimeRange)}>
      <TabsList className="bg-secondary p-1 gap-1">
        <TabsTrigger
          value="today"
          className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none data-[state=inactive]:text-muted-foreground"
        >
          今天
        </TabsTrigger>
        <TabsTrigger
          value="week"
          className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none data-[state=inactive]:text-muted-foreground"
        >
          本週
        </TabsTrigger>
        <TabsTrigger
          value="month"
          className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none data-[state=inactive]:text-muted-foreground"
        >
          本月
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
