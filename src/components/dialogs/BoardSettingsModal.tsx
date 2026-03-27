// src/components/dialogs/BoardSettingsModal.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '~/components/ui/dialog';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { cn } from '~/lib/utils';
import { BOARD_COLORS, MOCK_USER_ID } from '~/lib/constants';
import { trpc } from '~/utils/trpc';

interface BoardSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  board: {
    id: string;
    name: string;
    icon: string | null;
    color: string | null;
  };
}

export function BoardSettingsModal({
  open,
  onOpenChange,
  board,
}: BoardSettingsModalProps) {
  const [name, setName] = useState(board.name);
  const [icon, setIcon] = useState(board.icon ?? '');
  const [color, setColor] = useState(board.color ?? BOARD_COLORS[0].value);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const router = useRouter();
  const utils = trpc.useUtils();

  const updateBoard = trpc.board.update.useMutation({
    onSuccess: () => {
      utils.board.byId.invalidate({ id: board.id });
      utils.board.list.invalidate({ userId: MOCK_USER_ID });
      onOpenChange(false);
    },
  });

  const deleteBoard = trpc.board.delete.useMutation({
    onSuccess: () => {
      utils.board.list.invalidate({ userId: MOCK_USER_ID });
      onOpenChange(false);
      router.push('/dashboard');
    },
  });

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    updateBoard.mutate({
      id: board.id,
      name: trimmed,
      icon: icon || undefined,
      color,
    });
  };

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    deleteBoard.mutate({ id: board.id });
  };

  // Reset state when modal opens
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setName(board.name);
      setIcon(board.icon ?? '');
      setColor(board.color ?? BOARD_COLORS[0].value);
      setConfirmDelete(false);
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Board 設定</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Name */}
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">
              名稱
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Board 名稱"
            />
          </div>

          {/* Icon */}
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">
              Icon
            </label>
            <Input
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder="📚"
              className="text-center text-lg w-16"
              maxLength={2}
            />
          </div>

          {/* Color */}
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">
              顏色
            </label>
            <div className="flex gap-1.5 flex-wrap">
              {BOARD_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  title={c.label}
                  onClick={() => setColor(c.value)}
                  className={cn(
                    'h-7 w-7 rounded border-2 transition-transform hover:scale-110',
                    color === c.value
                      ? 'border-foreground scale-110'
                      : 'border-transparent',
                  )}
                  style={{ backgroundColor: c.value }}
                />
              ))}
            </div>
          </div>

          {/* Danger zone */}
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground mb-2">危險操作</p>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={deleteBoard.isPending}
              className="w-full"
            >
              {deleteBoard.isPending
                ? '刪除中...'
                : confirmDelete
                  ? '確認刪除？此操作無法復原'
                  : '刪除 Board'}
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            onClick={handleSave}
            disabled={!name.trim() || updateBoard.isPending}
          >
            {updateBoard.isPending ? '儲存中...' : '儲存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
