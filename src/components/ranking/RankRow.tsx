import Link from 'next/link';
import { cn } from '~/lib/utils';

interface RankRowProps {
  rank: number;
  userId: string;
  name: string | null;
  image: string | null;
  value: number;
  formatValue: (v: number) => string;
  isMe: boolean;
}

export function RankRow({ rank, userId, name, image, value, formatValue, isMe }: RankRowProps) {
  return (
    <Link
      href={isMe ? '/dashboard' : `/friends/${userId}`}
      className={cn(
        'flex items-center gap-4 px-6 py-4',
        isMe && 'bg-red-50',
      )}
    >
      <span className={cn(
        'w-10 text-base font-semibold',
        isMe ? 'text-primary' : 'text-foreground',
      )}>
        {rank}
      </span>
      {image ? (
        <img src={image} alt="" className="h-10 w-10 rounded-full object-cover" />
      ) : (
        <div className="h-10 w-10 rounded-full bg-muted" />
      )}
      <div className="flex-1">
        <p className={cn('text-sm font-medium', isMe && 'text-primary font-semibold')}>
          {isMe ? 'You' : name ?? 'Unknown'}
        </p>
        {isMe && <p className="text-xs text-primary/60">That&apos;s you!</p>}
      </div>
      <span className={cn(
        'text-base font-medium',
        isMe ? 'text-primary font-semibold' : 'text-foreground',
      )}>
        {formatValue(value)}
      </span>
    </Link>
  );
}
