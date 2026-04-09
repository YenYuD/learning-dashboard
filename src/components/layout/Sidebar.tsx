// src/components/layout/Sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Plus, Users, Trophy, Settings } from 'lucide-react';
import { BoardIcon } from '~/components/ui/board-icon';
import { cn } from '~/lib/utils';
import { Button } from '~/components/ui/button';
import { Skeleton } from '~/components/ui/skeleton';
import { trpc } from '~/utils/trpc';
import { useState } from 'react';
import { CreateBoardModal } from '~/components/dialogs/CreateBoardModal';
import { UserMenu } from '~/components/auth/UserMenu';

export function Sidebar() {
  const pathname = usePathname();
  const [createOpen, setCreateOpen] = useState(false);
  const utils = trpc.useUtils();

  const { data: boards, isLoading } = trpc.board.list.useQuery();

  return (
    <>
      <aside className="flex h-full w-60 flex-col bg-sidebar text-sidebar-foreground">
        {/* Logo */}
        <div className="flex h-14 items-center border-b border-sidebar-border">
          <Link href="/dashboard" className="flex items-center gap-3 px-4 h-full">
            <div className="h-8 w-8 shrink-0 bg-sidebar-accent" />
            <span className="text-lg font-semibold text-sidebar-foreground">
              Learning
            </span>
          </Link>
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

          {/* Friends link */}
          <Link
            href="/friends"
            className={cn(
              'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors relative',
              pathname === '/friends' || pathname.startsWith('/friends/')
                ? 'text-sidebar-accent before:absolute before:left-0 before:top-1 before:bottom-1 before:w-1 before:rounded-full before:bg-sidebar-accent'
                : 'text-sidebar-muted-foreground hover:bg-sidebar-muted hover:text-sidebar-foreground',
            )}
          >
            <Users size={16} />
            Friends
          </Link>

          {/* Ranking link */}
          <Link
            href="/ranking"
            className={cn(
              'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors relative',
              pathname === '/ranking'
                ? 'text-sidebar-accent before:absolute before:left-0 before:top-1 before:bottom-1 before:w-1 before:rounded-full before:bg-sidebar-accent'
                : 'text-sidebar-muted-foreground hover:bg-sidebar-muted hover:text-sidebar-foreground',
            )}
          >
            <Trophy size={16} />
            Ranking
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
              boards.map((board) => {
                const isActive = pathname === `/board/${board.id}`;
                return (
                  <Link
                    key={board.id}
                    href={`/board/${board.id}`}
                    onMouseEnter={() =>
                      utils.board.byId.prefetch({ id: board.id })
                    }
                    className={cn(
                      'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors relative',
                      isActive
                        ? 'text-sidebar-foreground font-medium'
                        : 'text-sidebar-muted-foreground hover:bg-sidebar-muted hover:text-sidebar-foreground',
                    )}
                  >
                    {isActive && (
                      <span
                        className="absolute left-0 top-1 bottom-1 w-1 rounded-full"
                        style={{
                          backgroundColor:
                            board.color ?? 'hsl(var(--sidebar-accent))',
                        }}
                      />
                    )}
                    <BoardIcon icon={board.icon} size={16} />
                    <span className="truncate">{board.name}</span>
                  </Link>
                );
              })
            ) : (
              <p className="px-3 text-xs text-sidebar-muted-foreground">
                No boards yet
              </p>
            )}
          </div>
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-3 space-y-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-sidebar-muted-foreground hover:bg-sidebar-muted hover:text-sidebar-foreground"
            onClick={() => setCreateOpen(true)}
          >
            <Plus size={16} />
            新增 Board
          </Button>
          <Link
            href="/settings"
            className={cn(
              'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              pathname === '/settings'
                ? 'text-sidebar-accent'
                : 'text-sidebar-muted-foreground hover:bg-sidebar-muted hover:text-sidebar-foreground',
            )}
          >
            <Settings size={16} />
            Settings
          </Link>
          <UserMenu />
        </div>
      </aside>
      <CreateBoardModal open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}
