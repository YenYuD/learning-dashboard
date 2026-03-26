// src/components/board/EmptyBoard.tsx
import { Plus } from 'lucide-react';
import { Button } from '~/components/ui/button';

interface EmptyBoardProps {
  onAddList?: () => void;
}

export function EmptyBoard({ onAddList }: EmptyBoardProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
      <div className="text-5xl">📋</div>
      <div>
        <p className="text-lg font-semibold">這個 Board 還沒有 List</p>
        <p className="text-sm text-muted-foreground mt-1">
          新增第一個 List 來開始管理你的任務
        </p>
      </div>
      <Button onClick={onAddList} className="gap-2">
        <Plus size={16} />
        新增 List
      </Button>
    </div>
  );
}
