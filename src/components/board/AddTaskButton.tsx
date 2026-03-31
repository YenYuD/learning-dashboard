// src/components/board/AddTaskButton.tsx
'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
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
      <button
        type="button"
        className="flex w-full items-center gap-2 rounded-md p-3 text-[13px] text-[#7A7A7A] hover:bg-muted/50 transition-colors"
        onClick={() => setOpen(true)}
      >
        <Plus size={14} />
        Add task
      </button>
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
