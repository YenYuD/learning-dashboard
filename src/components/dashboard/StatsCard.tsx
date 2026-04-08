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
      <CardContent className="pt-4 pb-3 px-4 md:pt-5 md:pb-4 md:px-5">
        <p className="text-xs md:text-sm text-muted-foreground mb-1">{title}</p>
        <p className="text-2xl md:text-3xl font-bold leading-none">{value}</p>
        <p className="text-xs md:text-sm text-muted-foreground mt-1">{unit}</p>
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
