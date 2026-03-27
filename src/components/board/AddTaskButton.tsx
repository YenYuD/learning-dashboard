// src/components/board/AddTaskButton.tsx
'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { CreateTaskModal } from '~/components/dialogs/CreateTaskModal';

interface ListOption {
  id: string;
  name: string;
}

interface AddTaskButtonProps {
  listId: string;
  boardId: string;
  lists: ListOption[];
}

export function AddTaskButton({ listId, boardId, lists }: AddTaskButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
        onClick={() => setOpen(true)}
      >
        <Plus size={14} />
        Add task
      </Button>
      <CreateTaskModal
        open={open}
        onOpenChange={setOpen}
        boardId={boardId}
        lists={lists}
        defaultListId={listId}
      />
    </>
  );
}
