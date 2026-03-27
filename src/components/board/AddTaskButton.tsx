// src/components/board/AddTaskButton.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { trpc } from '~/utils/trpc';

interface AddTaskButtonProps {
  listId: string;
  boardId: string;
}

export function AddTaskButton({ listId, boardId }: AddTaskButtonProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();

  const createTask = trpc.task.create.useMutation({
    onSuccess: () => {
      utils.board.byId.invalidate({ id: boardId });
      setTitle('');
      setTimeout(() => inputRef.current?.focus(), 0);
    },
  });

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
    }
  }, [isEditing]);

  const handleSubmit = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    createTask.mutate({ listId, title: trimmed });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape') {
      setIsEditing(false);
      setTitle('');
    }
  };

  if (!isEditing) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
        onClick={() => setIsEditing(true)}
      >
        <Plus size={14} />
        Add task
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Input
        ref={inputRef}
        placeholder="輸入任務名稱..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={createTask.isPending}
        className="text-sm"
      />
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={!title.trim() || createTask.isPending}
          className="h-7 text-xs"
        >
          新增
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => {
            setIsEditing(false);
            setTitle('');
          }}
        >
          <X size={14} />
        </Button>
      </div>
    </div>
  );
}
