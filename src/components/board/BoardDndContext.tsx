// src/components/board/BoardDndContext.tsx
'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  pointerWithin,
  rectIntersection,
  getFirstCollision,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
  type CollisionDetection,
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
  const isDraggingRef = useRef(false);
  const isDirtyRef = useRef(false); // true while a mutation is in-flight
  const lastOverIdRef = useRef<string | null>(null);

  const utils = trpc.useUtils();

  const listReorder = trpc.list.reorder.useMutation({
    onSuccess: () => {
      isDirtyRef.current = false;
      utils.board.byId.invalidate({ id: boardId });
    },
    onError: () => {
      isDirtyRef.current = false;
      setLists(initialLists);
    },
  });

  const taskReorder = trpc.task.reorder.useMutation({
    onSuccess: () => {
      isDirtyRef.current = false;
      utils.board.byId.invalidate({ id: boardId });
    },
    onError: () => {
      isDirtyRef.current = false;
      setLists(initialLists);
    },
  });

  // Sync with server data only when not dragging AND no in-flight mutation
  // This prevents stale refetches from overwriting our optimistic updates
  useEffect(() => {
    if (!isDraggingRef.current && !isDirtyRef.current) {
      setLists(initialLists);
    }
  }, [initialLists]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const listIds = lists.map((l) => l.id);

  const findListByTaskId = useCallback((taskId: string) => {
    return lists.find((l) => l.tasks.some((t) => t.id === taskId));
  }, [lists]);

  // Custom collision detection: prioritise pointer-within for kanban cross-column detection
  const collisionDetection: CollisionDetection = useCallback((args) => {
    // For list dragging, use closestCenter
    if (activeType === 'list') {
      return closestCenter(args);
    }

    // For task dragging: first try pointer-within for accurate column detection
    const pointerIntersections = pointerWithin(args);
    const intersections = pointerIntersections.length > 0 ? pointerIntersections : rectIntersection(args);
    let overId = getFirstCollision(intersections, 'id');

    if (overId != null) {
      lastOverIdRef.current = overId as string;
      // If hovering over a list drop zone, find the closest task within it
      const overIdStr = overId as string;
      const targetListId = overIdStr.startsWith('list-drop-')
        ? overIdStr.replace('list-drop-', '')
        : listIds.includes(overIdStr) ? overIdStr : null;

      if (targetListId) {
        const targetList = lists.find((l) => l.id === targetListId);
        if (targetList && targetList.tasks.length > 0) {
          const taskContainers = args.droppableContainers.filter((c) =>
            targetList.tasks.some((t) => t.id === c.id),
          );
          if (taskContainers.length > 0) {
            const closest = closestCenter({ ...args, droppableContainers: taskContainers });
            if (closest.length > 0) return closest;
          }
        }
        return [{ id: overId }];
      }
    }

    return lastOverIdRef.current ? [{ id: lastOverIdRef.current }] : [];
  }, [activeType, lists, listIds]);

  // Get active item for overlay
  const activeTask = activeType === 'task'
    ? lists.flatMap((l) => l.tasks).find((t) => t.id === activeId)
    : null;

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const type = active.data.current?.type as 'list' | 'task';
    setActiveId(active.id as string);
    setActiveType(type);
    isDraggingRef.current = true;
    lastOverIdRef.current = null;
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || activeType !== 'task') return;

    const activeTaskId = active.id as string;
    const overId = over.id as string;
    if (activeTaskId === overId) return;

    const activeList = findListByTaskId(activeTaskId);
    if (!activeList) return;

    // Determine target list and over-task
    let overList: List | undefined;
    let overTaskId: string | null = null;

    if (overId.startsWith('list-drop-')) {
      overList = lists.find((l) => l.id === overId.replace('list-drop-', ''));
    } else if (listIds.includes(overId)) {
      overList = lists.find((l) => l.id === overId);
    } else {
      overList = findListByTaskId(overId);
      overTaskId = overId;
    }

    if (!overList) return;

    setLists((prev) => {
      const activeListInPrev = prev.find((l) => l.id === activeList.id)!;
      const overListInPrev = prev.find((l) => l.id === overList!.id)!;
      const task = activeListInPrev.tasks.find((t) => t.id === activeTaskId);
      if (!task) return prev;

      const activeIndex = activeListInPrev.tasks.findIndex((t) => t.id === activeTaskId);

      if (activeList.id === overList!.id) {
        // Same-list reorder — give immediate visual feedback
        if (!overTaskId) return prev;
        const overIndex = overListInPrev.tasks.findIndex((t) => t.id === overTaskId);
        if (overIndex === -1 || activeIndex === overIndex) return prev;
        return prev.map((l) =>
          l.id === activeList.id
            ? { ...l, tasks: arrayMove(l.tasks, activeIndex, overIndex) }
            : l,
        );
      } else {
        // Cross-list move
        const overIndex = overTaskId
          ? overListInPrev.tasks.findIndex((t) => t.id === overTaskId)
          : -1;
        const insertIndex = overIndex >= 0 ? overIndex : overListInPrev.tasks.length;

        return prev.map((l) => {
          if (l.id === activeList.id) {
            return { ...l, tasks: l.tasks.filter((t) => t.id !== activeTaskId) };
          }
          if (l.id === overList!.id) {
            const newTasks = [...l.tasks];
            newTasks.splice(insertIndex, 0, { ...task, listId: overList!.id });
            return { ...l, tasks: newTasks };
          }
          return l;
        });
      }
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    isDraggingRef.current = false;
    setActiveId(null);
    setActiveType(null);
    lastOverIdRef.current = null;

    if (!over) {
      // Cancelled — sync back to server state
      setLists(initialLists);
      return;
    }

    if (activeType === 'list') {
      const currentListIds = lists.map((l) => l.id);
      const oldIndex = currentListIds.indexOf(active.id as string);
      const newIndex = currentListIds.indexOf(over.id as string);
      if (oldIndex !== newIndex) {
        const newOrder = arrayMove(currentListIds, oldIndex, newIndex);
        setLists((prev) => arrayMove(prev, oldIndex, newIndex));
        isDirtyRef.current = true;
        listReorder.mutate({ boardId, listIds: newOrder });
      }
      return;
    }

    if (activeType === 'task') {
      // lists state already reflects the final position from handleDragOver — just persist it
      const taskUpdates: { id: string; listId: string; order: number }[] = [];
      for (const list of lists) {
        for (let i = 0; i < list.tasks.length; i++) {
          taskUpdates.push({ id: list.tasks[i].id, listId: list.id, order: i });
        }
      }
      if (taskUpdates.length > 0) {
        isDirtyRef.current = true;
        taskReorder.mutate({ tasks: taskUpdates });
      }
    }
  };

  return (
    <div className="flex-1 overflow-x-auto overflow-y-hidden">
      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
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

        <DragOverlay dropAnimation={{ duration: 200, easing: 'ease' }}>
          {activeTask ? (
            <div className="w-[280px] rotate-1 opacity-90 shadow-xl">
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
