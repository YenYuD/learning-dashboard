// src/components/dialogs/CreateListModal.tsx
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '~/components/ui/dialog';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { trpc } from '~/utils/trpc';

interface CreateListModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boardId: string;
}

export function CreateListModal({ open, onOpenChange, boardId }: CreateListModalProps) {
  const [name, setName] = useState('');
  const utils = trpc.useUtils();

  const createList = trpc.list.create.useMutation({
    onSuccess: () => {
      utils.board.byId.invalidate({ id: boardId });
      setName('');
      onOpenChange(false);
    },
  });

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    createList.mutate({ boardId, name: trimmed });
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) setName('');
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[480px] p-0 gap-0" showCloseButton={false}>
        {/* Header */}
        <DialogHeader className="flex flex-row items-center justify-between px-6 h-16 space-y-0">
          <DialogTitle className="text-lg font-semibold">新增清單</DialogTitle>
          <DialogClose
            className="flex items-center justify-center h-8 w-8 rounded-lg bg-muted hover:bg-muted/80"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </DialogClose>
        </DialogHeader>

        <div className="h-px bg-border" />

        {/* Body */}
        <div className="p-6 space-y-5">
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-foreground">
              清單名稱
            </label>
            <Input
              placeholder="例如：To Do、In Progress..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={createList.isPending}
              autoFocus
            />
          </div>
          <div className="h-px bg-border" />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 pb-6">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            className="px-5"
          >
            取消
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!name.trim() || createList.isPending}
            className="px-5 bg-[#EF4444] hover:bg-[#DC2626] text-white"
          >
            {createList.isPending ? '建立中...' : '建立清單'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
