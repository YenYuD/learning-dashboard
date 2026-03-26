// src/components/board/ListColumn.tsx
'use client';

import { MoreHorizontal } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { TaskCard } from './TaskCard';
import { AddTaskButton } from './AddTaskButton';

interface Task {
  id: string;
  title: string;
  description?: string;
  totalMinutes?: number;
}

interface ListColumnProps {
  title: string;
  tasks: Task[];
  onAddTask?: () => void;
}

export function ListColumn({ title, tasks, onAddTask }: ListColumnProps) {
  return (
    <div className="flex w-72 shrink-0 flex-col rounded-lg bg-muted/60">
      {/* List header */}
      <div className="flex items-center justify-between px-3 py-2.5">
        <h3 className="text-sm font-semibold">{title}</h3>
        <Button variant="ghost" size="icon" className="h-7 w-7">
          <MoreHorizontal size={14} />
        </Button>
      </div>

      {/* Task cards */}
      <div className="flex flex-col gap-2 px-2 pb-2 min-h-[60px]">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            title={task.title}
            description={task.description}
            totalMinutes={task.totalMinutes}
          />
        ))}
      </div>

      {/* Add task */}
      <div className="px-2 pb-2">
        <AddTaskButton onClick={onAddTask} />
      </div>
    </div>
  );
}
