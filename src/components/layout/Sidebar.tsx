// src/components/layout/Sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Plus, Clock } from 'lucide-react';
import { cn } from '~/lib/utils';
import { Button } from '~/components/ui/button';
import { Skeleton } from '~/components/ui/skeleton';
import { trpc } from '~/utils/trpc';
import { MOCK_USER_ID } from '~/lib/constants';
import { useState } from 'react';
import { CreateBoardModal } from '~/components/dialogs/CreateBoardModal';

export function Sidebar() {
  const pathname = usePathname();
  const [createOpen, setCreateOpen] = useState(false);

  const { data: boards, isLoading } = trpc.board.list.useQuery({
    userId: MOCK_USER_ID,
  });

  return (
    <>
      <aside className="flex h-full w-60 flex-col bg-sidebar text-sidebar-foreground">
        {/* Logo */}
        <div className="flex h-14 items-center gap-3 px-4 border-b border-sidebar-border">
          <div className="h-8 w-8 shrink-0 rounded bg-sidebar-accent" />
          <span className="text-lg font-semibold text-sidebar-foreground">Learning</span>
        </div>

        {/* Nav */}
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
          {/* Dashboard link */}
          <Link
            href="/dashboard"
            className={cn(
              'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors relative',
              pathname === '/dashboard'
                ? 'text-sidebar-accent before:absolute before:left-0 before:top-1 before:bottom-1 before:w-1 before:rounded-full before:bg-sidebar-accent'
                : 'text-sidebar-muted-foreground hover:bg-sidebar-muted hover:text-sidebar-foreground',
            )}
          >
            <LayoutDashboard size={16} />
            Dashboard
          </Link>

          {/* Board list */}
          <div className="mt-4">
            <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-sidebar-muted-foreground">
              Boards
            </p>

            {isLoading ? (
              <div className="flex flex-col gap-1 px-3">
                <Skeleton className="h-8 w-full bg-sidebar-muted" />
                <Skeleton className="h-8 w-full bg-sidebar-muted" />
                <Skeleton className="h-8 w-full bg-sidebar-muted" />
              </div>
            ) : boards && boards.length > 0 ? (
              boards.map((board) => (
                <Link
                  key={board.id}
                  href={`/board/${board.id}`}
                  className={cn(
                    'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors relative',
                    pathname === `/board/${board.id}`
                      ? 'text-sidebar-accent-foreground font-medium before:absolute before:left-0 before:top-1 before:bottom-1 before:w-1 before:rounded-full before:bg-sidebar-accent'
                      : 'text-sidebar-muted-foreground hover:bg-sidebar-muted hover:text-sidebar-foreground',
                  )}
                >
                  {board.type === 'TIME_ONLY' ? (
                    <Clock size={14} />
                  ) : (
                    <span className="text-sm leading-none">
                      {board.icon ?? '📋'}
                    </span>
                  )}
                  <span className="truncate">{board.name}</span>
                </Link>
              ))
            ) : (
              <p className="px-3 text-xs text-sidebar-muted-foreground">
                No boards yet
              </p>
            )}
          </div>
        </nav>

        {/* Footer: + 新增 Board */}
        <div className="border-t border-sidebar-border p-3">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-sidebar-muted-foreground hover:bg-sidebar-muted hover:text-sidebar-foreground"
            onClick={() => setCreateOpen(true)}
          >
            <Plus size={16} />
            新增 Board
          </Button>
        </div>
      </aside>

      <CreateBoardModal open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}
