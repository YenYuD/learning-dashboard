// src/components/board/AddTaskButton.tsx
'use client';

import { Plus } from 'lucide-react';
import { Button } from '~/components/ui/button';

interface AddTaskButtonProps {
  onClick?: () => void;
}

export function AddTaskButton({ onClick }: AddTaskButtonProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
      onClick={onClick}
    >
      <Plus size={14} />
      Add task
    </Button>
  );
}
