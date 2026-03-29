// src/components/board/SortableListColumn.tsx
'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import { SortableTaskCard } from './SortableTaskCard';
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

interface SortableListColumnProps {
  listId: string;
  boardId: string;
  title: string;
  tasks: Task[];
  allLists: ListOption[];
}

export function SortableListColumn({ listId, boardId, title, tasks, allLists }: SortableListColumnProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(title);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const renameRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: listId, data: { type: 'list' } });

  // Make the list body a droppable area for tasks
  const { setNodeRef: setDropRef } = useDroppable({ id: `list-drop-${listId}`, data: { type: 'list', listId } });

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
    if (e.key === 'Enter') { e.preventDefault(); handleRenameSubmit(); }
    if (e.key === 'Escape') { setIsRenaming(false); setRenameValue(title); }
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const taskIds = tasks.map((t) => t.id);

  return (
    <>
      <div ref={setNodeRef} style={style} className="relative flex w-[320px] shrink-0 flex-col rounded-lg bg-white border border-[#E8E8E8] p-5 gap-4 max-h-[80vh]">
        {/* List header - draggable */}
        <div className="flex items-center justify-between cursor-grab" {...attributes} {...listeners}>
          {isRenaming ? (
            <Input
              ref={renameRef}
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={handleRenameKeyDown}
              onBlur={handleRenameSubmit}
              className="h-7 text-base font-semibold"
              disabled={updateList.isPending}
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            />
          ) : (
            <h3 className="text-base font-semibold text-[#0D0D0D]">{title}</h3>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger
              className="inline-flex items-center justify-center h-7 w-7 rounded-md hover:bg-accent hover:text-accent-foreground"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <MoreHorizontal size={16} className="text-[#9CA3AF]" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => { setRenameValue(title); setIsRenaming(true); }}>
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

        {/* Task cards - droppable area */}
        <div ref={setDropRef} className="flex flex-col gap-4 min-h-[10px] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
            {tasks.map((task) => (
              <SortableTaskCard
                key={task.id}
                id={task.id}
                boardId={boardId}
                title={task.title}
                description={task.description}
                totalMinutes={task.totalMinutes}
                onClick={() => setSelectedTask(task)}
              />
            ))}
          </SortableContext>
        </div>

        {/* Add task */}
        <AddTaskButton listId={listId} boardId={boardId} lists={allLists} />
      </div>

      {selectedTask && (
        <TaskDetailModal
          open={!!selectedTask}
          onOpenChange={(open) => { if (!open) setSelectedTask(null); }}
          task={selectedTask}
          boardId={boardId}
        />
      )}
    </>
  );
}
