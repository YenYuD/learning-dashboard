// src/components/board/EmptyBoard.tsx
'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { CreateListModal } from '~/components/dialogs/CreateListModal';

interface EmptyBoardProps {
  boardId: string;
}

export function EmptyBoard({ boardId }: EmptyBoardProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <div className="text-5xl">📋</div>
        <div>
          <p className="text-lg font-semibold">這個 Board 還沒有 List</p>
          <p className="text-sm text-muted-foreground mt-1">
            新增第一個 List 來開始管理你的任務
          </p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-2">
          <Plus size={16} />
          新增 List
        </Button>
      </div>
      <CreateListModal open={open} onOpenChange={setOpen} boardId={boardId} />
    </>
  );
}
