// src/components/board/TaskCard.tsx
'use client';

import { Play, Clock } from 'lucide-react';
import { Card, CardContent } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { cn } from '~/lib/utils';

interface TaskCardProps {
  title: string;
  description?: string;
  totalMinutes?: number;
  isTimerRunning?: boolean;
}

function formatMinutes(minutes: number): string {
  if (minutes === 0) return '0m';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function TaskCard({
  title,
  description,
  totalMinutes = 0,
  isTimerRunning = false,
}: TaskCardProps) {
  return (
    <Card
      className={cn(
        'cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md group',
        isTimerRunning && 'ring-2 ring-primary',
      )}
    >
      <CardContent className="p-3">
        <p className="text-sm font-medium leading-snug">{title}</p>
        {description && (
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
            {description}
          </p>
        )}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock size={12} />
            <span>{formatMinutes(totalMinutes)}</span>
          </div>
          <Button
            size="sm"
            variant={isTimerRunning ? 'default' : 'outline'}
            className="h-7 gap-1 px-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Play size={10} />
            {isTimerRunning ? 'Running' : 'Start'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
