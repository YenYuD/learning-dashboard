// src/components/board/AddListButton.tsx
'use client';

import { Plus } from 'lucide-react';
import { Button } from '~/components/ui/button';

interface AddListButtonProps {
  onClick?: () => void;
}

export function AddListButton({ onClick }: AddListButtonProps) {
  return (
    <div className="flex w-72 shrink-0 items-start pt-0.5">
      <Button
        variant="outline"
        className="w-full justify-start gap-2 bg-muted/40 hover:bg-muted border-dashed"
        onClick={onClick}
      >
        <Plus size={16} />
        新增 List
      </Button>
    </div>
  );
}
