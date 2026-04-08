'use client';

import Link from 'next/link';
import { MoreHorizontal } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { trpc } from '~/utils/trpc';

interface FriendCardProps {
  friendshipId: string;
  id: string;
  name: string | null;
  image: string | null;
  weeklyInfo?: string;
}

export function FriendCard({ friendshipId, id, name, image, weeklyInfo }: FriendCardProps) {
  const utils = trpc.useUtils();
  const removeMutation = trpc.friend.remove.useMutation({
    onSuccess: () => utils.friend.list.invalidate(),
  });

  return (
    <div className="flex items-center gap-3 md:gap-4 px-4 md:px-6 py-3 md:py-4">
      <Link href={`/friends/${id}`} className="flex flex-1 items-center gap-3 md:gap-4 min-w-0">
        {image ? (
          <img src={image} alt="" className="h-10 w-10 rounded-full object-cover" />
        ) : (
          <div className="h-10 w-10 rounded-full bg-muted" />
        )}
        <div className="flex-1">
          <p className="text-sm font-medium">{name ?? 'Unknown'}</p>
          {weeklyInfo && (
            <p className="text-xs text-muted-foreground">{weeklyInfo}</p>
          )}
        </div>
      </Link>
      <Button
        variant="ghost"
        size="sm"
        className="text-muted-foreground"
        onClick={() => {
          if (confirm('確定要移除此好友嗎？')) {
            removeMutation.mutate({ friendshipId });
          }
        }}
      >
        <MoreHorizontal size={16} />
      </Button>
    </div>
  );
}
