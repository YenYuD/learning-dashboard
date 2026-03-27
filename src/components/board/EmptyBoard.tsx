// src/components/board/EmptyBoard.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { trpc } from '~/utils/trpc';

interface EmptyBoardProps {
  boardId: string;
}

export function EmptyBoard({ boardId }: EmptyBoardProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();

  const createList = trpc.list.create.useMutation({
    onSuccess: () => {
      utils.board.byId.invalidate({ id: boardId });
      setName('');
      setIsAdding(false);
    },
  });

  useEffect(() => {
    if (isAdding) inputRef.current?.focus();
  }, [isAdding]);

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
      setIsAdding(false);
      setName('');
    }
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
      <div className="text-5xl">📋</div>
      <div>
        <p className="text-lg font-semibold">這個 Board 還沒有 List</p>
        <p className="text-sm text-muted-foreground mt-1">
          新增第一個 List 來開始管理你的任務
        </p>
      </div>
      {isAdding ? (
        <div className="flex flex-col gap-2 w-64">
          <Input
            ref={inputRef}
            placeholder="輸入清單名稱..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={createList.isPending}
          />
          <div className="flex items-center gap-1 justify-center">
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
                setIsAdding(false);
                setName('');
              }}
            >
              <X size={16} />
            </Button>
          </div>
        </div>
      ) : (
        <Button onClick={() => setIsAdding(true)} className="gap-2">
          <Plus size={16} />
          新增 List
        </Button>
      )}
    </div>
  );
}
