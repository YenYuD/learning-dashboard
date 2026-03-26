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
        <div className="flex h-14 items-center px-4 border-b border-sidebar-border">
          <span className="text-lg font-bold tracking-tight">Learning</span>
        </div>

        {/* Nav */}
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
          {/* Dashboard link */}
          <Link
            href="/dashboard"
            className={cn(
              'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              pathname === '/dashboard'
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
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
                    'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
                    pathname === `/board/${board.id}`
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
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
