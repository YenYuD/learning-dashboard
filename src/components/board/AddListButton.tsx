// src/components/board/AddListButton.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { trpc } from '~/utils/trpc';

interface AddListButtonProps {
  boardId: string;
}

export function AddListButton({ boardId }: AddListButtonProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();

  const createList = trpc.list.create.useMutation({
    onSuccess: () => {
      utils.board.byId.invalidate({ id: boardId });
      setName('');
      // Keep editing mode open for quick multi-add
      setTimeout(() => inputRef.current?.focus(), 0);
    },
  });

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
    }
  }, [isEditing]);

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    createList.mutate({ boardId, name: trimmed });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape') {
      setIsEditing(false);
      setName('');
    }
  };

  if (!isEditing) {
    return (
      <div className="flex w-72 shrink-0 items-start pt-0.5">
        <Button
          variant="outline"
          className="w-full justify-start gap-2 bg-muted/40 hover:bg-muted border-dashed"
          onClick={() => setIsEditing(true)}
        >
          <Plus size={16} />
          新增清單
        </Button>
      </div>
    );
  }

  return (
    <div className="flex w-72 shrink-0 flex-col gap-2 rounded-lg bg-muted/60 p-2">
      <Input
        ref={inputRef}
        placeholder="輸入清單名稱..."
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={createList.isPending}
      />
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={!name.trim() || createList.isPending}
        >
          {createList.isPending ? '新增中...' : '新增清單'}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => {
            setIsEditing(false);
            setName('');
          }}
        >
          <X size={16} />
        </Button>
      </div>
    </div>
  );
}
