// src/components/board/BoardHeader.tsx
'use client';

import { Settings } from 'lucide-react';
import { Button } from '~/components/ui/button';

interface BoardHeaderProps {
  boardId?: string;
  icon?: string;
  name: string;
  color?: string;
  onSettingsClick?: () => void;
}

export function BoardHeader({ icon, name, onSettingsClick }: BoardHeaderProps) {
  return (
    <div className="flex h-14 items-center justify-between border-b bg-card px-6">
      <div className="flex items-center gap-2">
        {icon && <span className="text-xl">{icon}</span>}
        <h1 className="text-xl font-bold">{name}</h1>
      </div>
      <Button variant="ghost" size="icon" onClick={onSettingsClick}>
        <Settings size={18} />
        <span className="sr-only">Board settings</span>
      </Button>
    </div>
  );
}
