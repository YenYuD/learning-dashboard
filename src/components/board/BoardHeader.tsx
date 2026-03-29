// src/components/board/BoardHeader.tsx
'use client';

import { Settings } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { BoardIcon } from '~/components/ui/board-icon';
import { cn } from '~/lib/utils';

interface BoardHeaderProps {
  boardId?: string;
  icon?: string;
  name: string;
  color?: string;
  onSettingsClick?: () => void;
}

export function BoardHeader({ icon, name, color, onSettingsClick }: BoardHeaderProps) {
  return (
    <div className="flex h-14 items-center justify-between border-b bg-card px-6 relative shrink-0 sticky top-0 z-10">
      {color && (
        <span
          className="absolute left-0 top-0 bottom-0 w-2"
          style={{ backgroundColor: color }}
        />
      )}
      <div className={cn('flex items-center gap-2', color && 'pl-3')}>
        {icon && <BoardIcon icon={icon} size={22} />}
        <h1 className="text-xl font-bold">{name}</h1>
      </div>
      <Button variant="ghost" size="icon" onClick={onSettingsClick}>
        <Settings size={18} />
        <span className="sr-only">Board settings</span>
      </Button>
    </div>
  );
}
