// src/components/board/SortableTaskCard.tsx
'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TaskCard } from './TaskCard';

interface SortableTaskCardProps {
  id: string;
  title: string;
  description?: string;
  totalMinutes?: number;
  onClick?: () => void;
}

export function SortableTaskCard({ id, title, description, totalMinutes, onClick }: SortableTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, data: { type: 'task' } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard
        title={title}
        description={description}
        totalMinutes={totalMinutes}
        onClick={onClick}
      />
    </div>
  );
}
