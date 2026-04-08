import { Skeleton } from '~/components/ui/skeleton';

export function ChartSkeleton({ className }: { className?: string }) {
  return (
    <Skeleton className={className ?? 'h-64 w-full rounded-lg'} />
  );
}
