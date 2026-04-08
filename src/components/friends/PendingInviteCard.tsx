'use client';

import Image from 'next/image';
import { Check, X } from 'lucide-react';
import { Button } from '~/components/ui/button';

interface PendingInviteCardProps {
  requester: { id: string; name: string | null; image: string | null };
  onAccept: () => void;
  onDecline: () => void;
  isPending?: boolean;
}

export function PendingInviteCard({ requester, onAccept, onDecline, isPending }: PendingInviteCardProps) {
  return (
    <div className="flex items-center gap-4 px-6 py-4">
      {requester.image ? (
        <Image src={requester.image} alt="邀請者頭像" width={40} height={40} className="h-10 w-10 rounded-full object-cover" />
      ) : (
        <div className="h-10 w-10 rounded-full bg-muted" />
      )}
      <div className="flex-1">
        <p className="text-sm font-medium">{requester.name ?? 'Unknown'}</p>
        <p className="text-xs text-muted-foreground">想成為你的好友</p>
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" disabled={isPending} onClick={onDecline}>
          <X size={14} />
        </Button>
        <Button size="sm" disabled={isPending} onClick={onAccept}>
          <Check size={14} />
        </Button>
      </div>
    </div>
  );
}
