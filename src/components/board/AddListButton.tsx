// src/components/board/AddListButton.tsx
'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { CreateListModal } from '~/components/dialogs/CreateListModal';

interface AddListButtonProps {
  boardId: string;
}

export function AddListButton({ boardId }: AddListButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="flex w-64 md:w-72 shrink-0 items-start pt-0.5">
        <Button
          variant="outline"
          className="w-full justify-start gap-2 bg-muted/40 hover:bg-muted border-dashed"
          onClick={() => setOpen(true)}
        >
          <Plus size={16} />
          新增清單
        </Button>
      </div>
      <CreateListModal open={open} onOpenChange={setOpen} boardId={boardId} />
    </>
  );
}
