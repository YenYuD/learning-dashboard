// src/components/dashboard/StatsCard.tsx
import { Card, CardContent } from '~/components/ui/card';
import { cn } from '~/lib/utils';

interface StatsCardProps {
  title: string;
  value: string;
  unit: string;
  trend?: string;
  trendUp?: boolean;
}

export function StatsCard({ title, value, unit, trend, trendUp }: StatsCardProps) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4 px-5">
        <p className="text-sm text-muted-foreground mb-1">{title}</p>
        <p className="text-3xl font-bold leading-none">{value}</p>
        <p className="text-sm text-muted-foreground mt-1">{unit}</p>
        {trend && (
          <p
            className={cn(
              'text-xs mt-2 font-medium',
              trendUp ? 'text-green-600' : 'text-red-500',
            )}
          >
            {trend}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
