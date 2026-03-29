// src/app/(app)/board/[boardId]/page.tsx
'use client';

import { use } from 'react';
import { BoardHeader } from '~/components/board/BoardHeader';
import { BoardDndContext } from '~/components/board/BoardDndContext';
import { EmptyBoard } from '~/components/board/EmptyBoard';
import { TimeOnlyBoard } from '~/components/board/TimeOnlyBoard';
import { BoardSettingsModal } from '~/components/dialogs/BoardSettingsModal';
import { Skeleton } from '~/components/ui/skeleton';
import { trpc } from '~/utils/trpc';
import { useState } from 'react';

function BoardSkeleton() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex h-14 items-center justify-between border-b bg-card px-6">
        <div className="flex items-center gap-2">
          <Skeleton className="h-7 w-7 rounded" />
          <Skeleton className="h-6 w-32" />
        </div>
        <Skeleton className="h-8 w-8 rounded" />
      </div>
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex h-full gap-3 p-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex w-72 shrink-0 flex-col rounded-lg bg-muted/60 p-3 gap-3">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-20 w-full rounded" />
              <Skeleton className="h-20 w-full rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function BoardPage({
  params,
}: {
  params: Promise<{ boardId: string }>;
}) {
  const { boardId } = use(params);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const { data: board, isLoading, error } = trpc.board.byId.useQuery({ id: boardId });

  if (isLoading) return <BoardSkeleton />;

  if (error || !board) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <div className="text-5xl">😵</div>
        <div>
          <p className="text-lg font-semibold">Board 不存在</p>
          <p className="text-sm text-muted-foreground mt-1">
            找不到這個 Board，它可能已被刪除
          </p>
        </div>
      </div>
    );
  }

  if (board.type === 'TIME_ONLY') {
    return (
      <div className="flex flex-col h-full overflow-y-auto">
        <BoardHeader
          boardId={board.id}
          icon={board.icon ?? undefined}
          name={board.name}
          color={board.color ?? undefined}
          onSettingsClick={() => setSettingsOpen(true)}
        />
        <TimeOnlyBoard boardId={board.id} boardName={board.name} />
        <BoardSettingsModal
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          board={board}
        />
      </div>
    );
  }

  const lists = board.lists ?? [];
  const hasLists = lists.length > 0;

  return (
    <div className="flex flex-col h-full">
      <BoardHeader
        boardId={board.id}
        icon={board.icon ?? undefined}
        name={board.name}
        color={board.color ?? undefined}
        onSettingsClick={() => setSettingsOpen(true)}
      />

      {hasLists ? (
        <BoardDndContext
          boardId={boardId}
          lists={lists.map((list) => ({
            id: list.id,
            name: list.name,
            tasks: list.tasks.map((task) => ({
              id: task.id,
              title: task.title,
              description: task.description ?? undefined,
              listId: task.listId,
              totalMinutes: task.timeEntries.reduce(
                (sum, te) => sum + te.duration,
                0,
              ),
            })),
          }))}
        />
      ) : (
        <EmptyBoard boardId={boardId} />
      )}

      <BoardSettingsModal
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        board={board}
      />
    </div>
  );
}
