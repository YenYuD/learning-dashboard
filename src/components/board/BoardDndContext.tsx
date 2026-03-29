// src/components/board/BoardDndContext.tsx
'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { SortableListColumn } from './SortableListColumn';
import { AddListButton } from './AddListButton';
import { TaskCard } from './TaskCard';
import { trpc } from '~/utils/trpc';

interface Task {
  id: string;
  title: string;
  description?: string;
  listId: string;
  totalMinutes: number;
}

interface List {
  id: string;
  name: string;
  tasks: Task[];
}

interface BoardDndContextProps {
  boardId: string;
  lists: List[];
}

export function BoardDndContext({ boardId, lists: initialLists }: BoardDndContextProps) {
  const [lists, setLists] = useState(initialLists);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<'list' | 'task' | null>(null);

  const utils = trpc.useUtils();

  const listReorder = trpc.list.reorder.useMutation({
    onSuccess: () => utils.board.byId.invalidate({ id: boardId }),
  });

  const taskReorder = trpc.task.reorder.useMutation({
    onSuccess: () => utils.board.byId.invalidate({ id: boardId }),
  });

  // Sync with server data when it changes
  // We use initialLists as key - when server data changes, reset local state
  useMemo(() => {
    setLists(initialLists);
  }, [initialLists]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const listIds = lists.map((l) => l.id);

  // Find which list a task belongs to
  const findListByTaskId = useCallback((taskId: string) => {
    return lists.find((l) => l.tasks.some((t) => t.id === taskId));
  }, [lists]);

  // Get active item for overlay
  const activeTask = activeType === 'task'
    ? lists.flatMap((l) => l.tasks).find((t) => t.id === activeId)
    : null;

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const type = active.data.current?.type as 'list' | 'task';
    setActiveId(active.id as string);
    setActiveType(type);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || activeType !== 'task') return;

    const activeTaskId = active.id as string;
    const overId = over.id as string;

    const activeList = findListByTaskId(activeTaskId);
    if (!activeList) return;

    // Determine target list
    let overList: typeof activeList | undefined;
    if (overId.startsWith('list-drop-')) {
      const listId = overId.replace('list-drop-', '');
      overList = lists.find((l) => l.id === listId);
    } else {
      overList = findListByTaskId(overId) ?? lists.find((l) => l.id === overId);
    }

    if (!overList || activeList.id === overList.id) return;

    // Move task between lists
    setLists((prev) => {
      const sourceList = prev.find((l) => l.id === activeList.id)!;
      const destList = prev.find((l) => l.id === overList.id)!;
      const task = sourceList.tasks.find((t) => t.id === activeTaskId)!;

      const overIndex = destList.tasks.findIndex((t) => t.id === overId);
      const insertIndex = overIndex >= 0 ? overIndex : destList.tasks.length;

      return prev.map((l) => {
        if (l.id === sourceList.id) {
          return { ...l, tasks: l.tasks.filter((t) => t.id !== activeTaskId) };
        }
        if (l.id === destList.id) {
          const newTasks = [...l.tasks];
          newTasks.splice(insertIndex, 0, { ...task, listId: destList.id });
          return { ...l, tasks: newTasks };
        }
        return l;
      });
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveType(null);

    if (!over) return;

    if (activeType === 'list') {
      const oldIndex = listIds.indexOf(active.id as string);
      const newIndex = listIds.indexOf(over.id as string);
      if (oldIndex !== newIndex) {
        const newOrder = arrayMove(listIds, oldIndex, newIndex);
        setLists((prev) => arrayMove(prev, oldIndex, newIndex));
        listReorder.mutate({ boardId, listIds: newOrder });
      }
      return;
    }

    if (activeType === 'task') {
      // Build task reorder payload from current local state
      const taskUpdates: { id: string; listId: string; order: number }[] = [];
      for (const list of lists) {
        for (let i = 0; i < list.tasks.length; i++) {
          const task = list.tasks[i];
          taskUpdates.push({ id: task.id, listId: list.id, order: i });
        }
      }

      // Also handle same-list reorder
      const activeTaskId = active.id as string;
      const overTaskId = over.id as string;
      const currentList = lists.find((l) => l.tasks.some((t) => t.id === activeTaskId));
      if (currentList && activeTaskId !== overTaskId) {
        const oldIdx = currentList.tasks.findIndex((t) => t.id === activeTaskId);
        const newIdx = currentList.tasks.findIndex((t) => t.id === overTaskId);
        if (oldIdx !== -1 && newIdx !== -1 && oldIdx !== newIdx) {
          const newTasks = arrayMove(currentList.tasks, oldIdx, newIdx);
          setLists((prev) =>
            prev.map((l) =>
              l.id === currentList.id ? { ...l, tasks: newTasks } : l,
            ),
          );
          // Rebuild updates with new order
          taskUpdates.length = 0;
          for (const list of lists) {
            const tasks = list.id === currentList.id ? newTasks : list.tasks;
            for (let i = 0; i < tasks.length; i++) {
              taskUpdates.push({ id: tasks[i].id, listId: list.id, order: i });
            }
          }
        }
      }

      if (taskUpdates.length > 0) {
        taskReorder.mutate({ tasks: taskUpdates });
      }
    }
  };

  return (
    <div className="flex-1 overflow-x-auto overflow-y-hidden">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex items-start gap-3 p-4">
          <SortableContext items={listIds} strategy={horizontalListSortingStrategy}>
            {lists.map((list) => (
              <SortableListColumn
                key={list.id}
                listId={list.id}
                boardId={boardId}
                title={list.name}
                tasks={list.tasks}
                allLists={lists.map((l) => ({ id: l.id, name: l.name }))}
              />
            ))}
          </SortableContext>
          <AddListButton boardId={boardId} />
        </div>

        <DragOverlay>
          {activeTask ? (
            <div className="w-72 opacity-80">
              <TaskCard
                taskId={activeTask.id}
                boardId={boardId}
                title={activeTask.title}
                description={activeTask.description}
                totalMinutes={activeTask.totalMinutes}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
