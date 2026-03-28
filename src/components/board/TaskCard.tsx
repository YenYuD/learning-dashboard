// src/components/board/TaskCard.tsx
'use client';

import { Clock } from 'lucide-react';
import { Card, CardContent } from '~/components/ui/card';

interface TaskCardProps {
  title: string;
  description?: string;
  totalMinutes?: number;
  onClick?: () => void;
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
  onClick,
}: TaskCardProps) {
  return (
    <Card
      className="cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
      onClick={onClick}
    >
      <CardContent className="p-3">
        <p className="text-sm font-medium leading-snug">{title}</p>
        {description && (
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
            {description}
          </p>
        )}
        <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
          <Clock size={12} />
          <span>{formatMinutes(totalMinutes)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
