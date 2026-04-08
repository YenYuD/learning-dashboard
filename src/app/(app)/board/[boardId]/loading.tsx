import { Skeleton } from '~/components/ui/skeleton';

export default function BoardLoading() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex h-14 items-center justify-between border-b bg-card px-6">
        <div className="flex items-center gap-2">
          <Skeleton className="h-7 w-7 rounded" />
          <Skeleton className="h-6 w-32" />
        </div>
        <Skeleton className="h-8 w-8 rounded" />
      </div>
      <div className="flex gap-3 p-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="w-72 shrink-0 space-y-2">
            <Skeleton className="h-8 rounded" />
            <Skeleton className="h-20 rounded" />
            <Skeleton className="h-20 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
