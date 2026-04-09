'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { getInitials } from '~/lib/utils';
import { trpc } from '~/utils/trpc';
import { toast } from 'sonner';

export function ProfileSection() {
  const { data: user, isLoading } = trpc.user.me.useQuery();
  const { update: updateSession } = useSession();
  const [name, setName] = useState('');
  const [editing, setEditing] = useState(false);
  const utils = trpc.useUtils();

  const updateProfile = trpc.user.updateProfile.useMutation({
    onSuccess: async (data) => {
      utils.user.me.setData(undefined, data);
      await updateSession({ name: data.name });
      setEditing(false);
      toast.success('個人資料已更新');
    },
    onError: (error) => {
      toast.error('更新失敗', { description: error.message });
    },
  });

  const handleEdit = () => {
    setName(user?.name ?? '');
    setEditing(true);
  };

  const initials = getInitials(user?.name, user?.email);

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    updateProfile.mutate({ name: trimmed });
  };

  if (isLoading) return null;

  return (
    <div className="space-y-4">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Profile
      </p>
      <div className="flex items-center gap-4">
        {user?.image ? (
          <Image
            src={user.image}
            alt="你的頭像"
            width={48}
            height={48}
            className="h-12 w-12 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sidebar-accent text-lg font-medium text-sidebar-accent-foreground">
            {initials}
          </div>
        )}
        <div className="flex-1">
          {editing ? (
            <div className="flex items-center gap-2">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-9"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave();
                  if (e.key === 'Escape') setEditing(false);
                }}
              />
              <Button
                size="sm"
                onClick={handleSave}
                disabled={!name.trim() || updateProfile.isPending}
              >
                {updateProfile.isPending ? '儲存中...' : '儲存'}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
                取消
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div>
                <p className="text-sm font-medium">{user?.name ?? 'Unknown'}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <Button size="sm" variant="outline" onClick={handleEdit}>
                編輯
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
