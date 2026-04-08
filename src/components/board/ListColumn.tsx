// src/components/board/ListColumn.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Input } from '~/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import { TaskCard } from './TaskCard';
import { AddTaskButton } from './AddTaskButton';
import { TaskDetailModal } from '~/components/dialogs/TaskDetailModal';
import { trpc } from '~/utils/trpc';

interface Task {
  id: string;
  title: string;
  description?: string;
  listId: string;
  totalMinutes?: number;
}

interface ListOption {
  id: string;
  name: string;
}

interface ListColumnProps {
  listId: string;
  boardId: string;
  title: string;
  tasks: Task[];
  allLists: ListOption[];
}

export function ListColumn({ listId, boardId, title, tasks, allLists }: ListColumnProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(title);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const renameRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();

  const updateList = trpc.list.update.useMutation({
    onSuccess: () => {
      utils.board.byId.invalidate({ id: boardId });
      setIsRenaming(false);
    },
  });

  const deleteList = trpc.list.delete.useMutation({
    onSuccess: () => {
      utils.board.byId.invalidate({ id: boardId });
    },
  });

  useEffect(() => {
    if (isRenaming) {
      renameRef.current?.focus();
      renameRef.current?.select();
    }
  }, [isRenaming]);

  const handleRenameSubmit = () => {
    const trimmed = renameValue.trim();
    if (!trimmed || trimmed === title) {
      setIsRenaming(false);
      setRenameValue(title);
      return;
    }
    updateList.mutate({ id: listId, name: trimmed });
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleRenameSubmit();
    }
    if (e.key === 'Escape') {
      setIsRenaming(false);
      setRenameValue(title);
    }
  };

  return (
    <>
      <div className="flex w-64 md:w-72 shrink-0 flex-col rounded-lg bg-muted/60">
        {/* List header */}
        <div className="flex items-center justify-between px-3 py-2.5">
          {isRenaming ? (
            <Input
              ref={renameRef}
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={handleRenameKeyDown}
              onBlur={handleRenameSubmit}
              className="h-7 text-sm font-semibold"
              disabled={updateList.isPending}
            />
          ) : (
            <h3 className="text-sm font-semibold">{title}</h3>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger
              className="inline-flex items-center justify-center h-7 w-7 rounded-md hover:bg-accent hover:text-accent-foreground"
            >
              <MoreHorizontal size={14} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  setRenameValue(title);
                  setIsRenaming(true);
                }}
              >
                <Pencil size={14} className="mr-2" />
                重新命名
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => deleteList.mutate({ id: listId })}
              >
                <Trash2 size={14} className="mr-2" />
                刪除清單
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Task cards */}
        <div className="flex flex-col gap-2 px-2 pb-2 min-h-[60px]">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              taskId={task.id}
              boardId={boardId}
              title={task.title}
              description={task.description}
              totalMinutes={task.totalMinutes}
              onClick={() => setSelectedTask(task)}
            />
          ))}
        </div>

        {/* Add task */}
        <div className="px-2 pb-2">
          <AddTaskButton listId={listId} boardId={boardId} lists={allLists} />
        </div>
      </div>

      {selectedTask && (
        <TaskDetailModal
          open={!!selectedTask}
          onOpenChange={(open) => {
            if (!open) setSelectedTask(null);
          }}
          task={selectedTask}
          boardId={boardId}
        />
      )}
    </>
  );
}
