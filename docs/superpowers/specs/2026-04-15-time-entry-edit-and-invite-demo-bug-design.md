# Design: Time Entry Edit + Invite Demo Bug Fix

Date: 2026-04-15
Branch: refactor/timezone-fix

---

## Overview

Two independent improvements:

1. **Time Entry Edit** — Add edit functionality to time entries in `TimeOnlyBoard`. The backend `update` procedure already exists; this adds the missing UI.
2. **Invite Demo Bug** — When a friend receives an invite link and is redirected to login, the "Continue as Demo" button can accidentally sign them in as the shared demo account, polluting the inviter's friend list. Fix with frontend hide + backend guard.

---

## Feature 1: Time Entry Edit

### Scope

Only `src/components/board/TimeOnlyBoard.tsx`. No backend changes needed — `trpc.timeEntries.update` already accepts `duration`, `startTime`, `endTime`, and `note`.

### UI Changes

Each row in "最近記錄" gets a `Pencil` icon button placed to the left of the existing `Trash2` button.

- Both icon buttons use `h-7 w-7` (28px), `gap-1` between them (reduced from `gap-2` to stay compact on mobile)
- Mobile safety: left side ≈ 150px (shrink-0) + right side ≤ 172px = 322px, within 351px available on 375px screens

### State

Add one new state to the component:

```ts
const [editingEntry, setEditingEntry] = useState<typeof timeEntries[0] | null>(null);
```

When the pencil icon is clicked, set `editingEntry` to that entry. The edit dialog reads initial form values from `editingEntry`:

- `editHours = Math.floor(editingEntry.duration / 60)`
- `editMinutes = editingEntry.duration % 60`
- `editDate` = local date string from `editingEntry.startTime ?? editingEntry.createdAt` in browser timezone
- `editNote = editingEntry.note ?? ''`

### Edit Dialog

Reuses the same form structure as the existing manual entry dialog:
- Title: "編輯記錄"
- Fields: 時長（hours + minutes）、日期、備註
- Buttons: 取消 / 儲存

### Mutation

Calls `trpc.timeEntries.update` with:

```ts
{
  id: editingEntry.id,
  duration: editHours * 60 + editMinutes,
  startTime: localDayStartUTC(editDate, tz),
  endTime: localDayStartUTC(editDate, tz),
  note: editNote || undefined,
}
```

### Optimistic Update

Same pattern as `createEntry` and `deleteEntry`:

1. `onMutate`: cancel in-flight `board.byId` query, snapshot previous, apply optimistic update to cache
2. `onError`: rollback to snapshot, show `toast.error`
3. `onSettled`: invalidate `board.byId` and all analytics queries
4. `onSuccess`: show `toast.success('記錄已更新')`

---

## Feature 2: Invite Demo Bug Fix

### Problem

Flow that causes the bug:
1. Friend receives `/invite/[token]` link
2. They are unauthenticated → redirected to `/login?callbackUrl=/invite/[token]`
3. Login page shows a prominent "Continue as Demo" button
4. Friend accidentally (or intentionally) clicks it → signed in as shared demo account
5. Redirected back to `/invite/[token]` → accepts invite as demo user
6. Inviter now has "Demo User" as a friend; multiple people sharing demo create chaos

### Fix: Two-Layer Defense

#### Layer 1 — Frontend (`src/app/(auth)/login/page.tsx`)

In `LoginForm`, check `callbackUrl` before rendering the demo button:

```tsx
const isDemoHidden = callbackUrl.includes('/invite/');

// Conditionally render:
{!isDemoHidden && (
  <Button variant="outline" className="w-full border-dashed border-2" onClick={handleDemoLogin} disabled={loading}>
    🎯 Continue as Demo
  </Button>
)}
```

This removes the accidental-click path for the common case.

#### Layer 2 — Backend (`src/server/routers/friend.ts`, `invite.use` mutation)

At the start of the `use` mutation handler, before any DB writes:

```ts
const actor = await prisma.user.findUnique({
  where: { id: ctx.userId },
  select: { email: true },
});
if (actor?.email === 'demo@learning-dashboard.app') {
  throw new TRPCError({
    code: 'FORBIDDEN',
    message: 'Demo 帳號無法接受好友邀請',
  });
}
```

The error surfaces in `InvitePage` via the mutation's `onError` callback (already wired up via tRPC).

### What Is Not Changed

- Demo account can still use all other features: boards, timer, dashboard, ranking
- The invite page UI and flow are unchanged
- No middleware changes required

---

## Out of Scope

- Restricting demo account from other write operations (future decision)
- Redesigning the invite page to show an inline login prompt (nice to have, not needed for this fix)
- Adding `friend.invite.create` demo guard (demo account doesn't have an "invite friends" UI entry point)
