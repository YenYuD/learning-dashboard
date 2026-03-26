// src/components/board/BoardHeader.tsx
import { Settings } from 'lucide-react';
import { Button } from '~/components/ui/button';

interface BoardHeaderProps {
  icon?: string;
  name: string;
  color?: string;
}

export function BoardHeader({ icon, name, color }: BoardHeaderProps) {
  return (
    <div
      className="flex h-14 items-center justify-between border-b bg-card px-6"
      style={color ? { borderTopColor: color, borderTopWidth: 3 } : undefined}
    >
      <div className="flex items-center gap-2">
        {icon && <span className="text-xl">{icon}</span>}
        <h1 className="text-xl font-bold">{name}</h1>
      </div>
      <Button variant="ghost" size="icon">
        <Settings size={18} />
        <span className="sr-only">Board settings</span>
      </Button>
    </div>
  );
}
