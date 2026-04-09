'use client';

import { useSession, signOut } from 'next-auth/react';
import { LogOut } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { getInitials } from '~/lib/utils';

export function UserMenu() {
  const { data: session } = useSession();

  if (!session?.user) return null;

  const user = session.user;
  const initials = getInitials(user.name, user.email);

  return (
    <div className="flex items-center gap-2 rounded-md px-2 py-1.5">
      {/* Avatar */}
      {user.image ? (
        <img
          src={user.image}
          alt={user.name ?? 'User'}
          className="h-7 w-7 rounded-full"
        />
      ) : (
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-sidebar-accent text-xs font-medium text-sidebar-accent-foreground">
          {initials}
        </div>
      )}

      {/* Name */}
      <span className="flex-1 truncate text-xs text-sidebar-foreground">
        {user.name ?? user.email}
      </span>

      {/* Sign out */}
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-sidebar-muted-foreground hover:text-sidebar-foreground"
        onClick={() => signOut({ callbackUrl: '/login' })}
        title="登出"
      >
        <LogOut size={14} />
      </Button>
    </div>
  );
}
