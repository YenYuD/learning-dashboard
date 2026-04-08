'use client';

import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { trpc } from '~/utils/trpc';
import { FriendCard } from '~/components/friends/FriendCard';
import { PendingInviteCard } from '~/components/friends/PendingInviteCard';
import { InviteLinkDialog } from '~/components/friends/InviteLinkDialog';

export default function FriendsPage() {
  const [tab, setTab] = useState<'all' | 'pending'>('all');
  const friendsQuery = trpc.friend.list.useQuery();
  const pendingQuery = trpc.friend.pending.useQuery();
  const utils = trpc.useUtils();
  const respondMutation = trpc.friend.respond.useMutation({
    onSuccess: () => {
      void utils.friend.pending.invalidate();
      void utils.friend.list.invalidate();
    },
  });

  const pendingCount = pendingQuery.data?.length ?? 0;

  return (
    <div className="md:py-10 md:px-12 py-4 px-6 flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-medium tracking-tight">好友</h1>
        <InviteLinkDialog
          trigger={
            <Button>
              <UserPlus size={16} className="mr-2" />
              邀請好友
            </Button>
          }
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          className={`rounded px-3 py-1.5 text-sm font-medium ${tab === 'all' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
            }`}
          onClick={() => setTab('all')}
        >
          所有好友
        </button>
        <button
          className={`rounded px-3 py-1.5 text-sm font-medium ${tab === 'pending' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
            }`}
          onClick={() => setTab('pending')}
        >
          待處理 ({pendingCount})
        </button>
      </div>

      {/* Content */}
      {tab === 'all' ? (
        <div className="divide-y rounded-lg border">
          {friendsQuery.isLoading ? (
            <p className="p-6 text-center text-sm text-muted-foreground">載入中...</p>
          ) : friendsQuery.data?.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">
              還沒有好友，點擊上方按鈕邀請朋友吧！
            </p>
          ) : (
            friendsQuery.data?.map((friend) => (
              <FriendCard key={friend.friendshipId} {...friend} />
            ))
          )}
        </div>
      ) : (
        <div className="divide-y rounded-lg border">
          {pendingQuery.isLoading ? (
            <p className="p-6 text-center text-sm text-muted-foreground">載入中...</p>
          ) : pendingCount === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">
              沒有待處理的好友邀請
            </p>
          ) : (
            pendingQuery.data?.map((pending) => (
              <PendingInviteCard
                key={pending.id}
                requester={pending.requester}
                isPending={respondMutation.isPending}
                onAccept={() => respondMutation.mutate({ friendshipId: pending.id, action: 'accept' })}
                onDecline={() => respondMutation.mutate({ friendshipId: pending.id, action: 'decline' })}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
