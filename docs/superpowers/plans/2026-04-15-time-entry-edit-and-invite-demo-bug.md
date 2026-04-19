# Time Entry Edit + Invite Demo Bug Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add edit functionality to time entries in TimeOnlyBoard, and prevent demo accounts from accepting friend invites via invite links.

**Architecture:** Two independent changes. Feature 1 is pure UI — the backend `timeEntries.update` procedure already exists. Feature 2 is a two-layer fix: hide the demo button in the login page when the callbackUrl is an invite link, plus a server-side FORBIDDEN guard in the `friend.invite.use` mutation.

**Tech Stack:** Next.js 14 App Router, tRPC v11, Prisma, React, Tailwind, Vitest, lucide-react, sonner (toast)

---

## File Map

| File | Change |
|------|--------|
| `src/components/board/TimeOnlyBoard.tsx` | Add edit state, `updateEntry` mutation, pencil button, edit dialog |
| `src/server/routers/friend.ts` | Add demo guard at top of `invite.use` mutation |
| `src/app/(auth)/login/page.tsx` | Conditionally hide demo button when `callbackUrl` contains `/invite/` |
| `src/server/routers/friend.test.ts` | New test file for the demo guard |

---

## Task 1: Time Entry Edit UI

**Files:**
- Modify: `src/components/board/TimeOnlyBoard.tsx`

### Step 1: Add `Pencil` to the lucide-react import and add edit state variables

- [ ] In `TimeOnlyBoard.tsx`, update the lucide-react import line and add state variables after the existing `manualNote` state.

Find this line:
```tsx
import { Play, Pause, Square, Plus, Trash2, Calendar } from 'lucide-react';
```

Replace with:
```tsx
import { Play, Pause, Square, Plus, Trash2, Calendar, Pencil } from 'lucide-react';
```

Then, after the `manualNote` state declaration (around line 71), add:

```tsx
// Edit entry state
const [editingEntry, setEditingEntry] = useState<typeof timeEntries[0] | null>(null);
const [editHours, setEditHours] = useState(0);
const [editMinutes, setEditMinutes] = useState(0);
const [editDate, setEditDate] = useState('');
const [editNote, setEditNote] = useState('');
```

### Step 2: Add `updateEntry` mutation

- [ ] After the `deleteEntry` mutation block (around line 154), add:

```tsx
const updateEntry = trpc.timeEntries.update.useMutation({
  onMutate: async (input) => {
    await utils.board.byId.cancel({ id: boardId });
    const previous = utils.board.byId.getData({ id: boardId });
    utils.board.byId.setData({ id: boardId }, (old) => {
      if (!old) return old;
      return {
        ...old,
        timeEntries: old.timeEntries.map((e) =>
          e.id === input.id
            ? {
                ...e,
                duration: input.duration ?? e.duration,
                startTime: input.startTime ?? e.startTime,
                endTime: input.endTime ?? e.endTime,
                note: input.note !== undefined ? input.note : e.note,
              }
            : e
        ),
      };
    });
    return { previous };
  },
  onError: (_err, _input, context) => {
    if (context?.previous) {
      utils.board.byId.setData({ id: boardId }, context.previous);
    }
    toast.error('更新失敗', { description: _err.message });
  },
  onSettled: () => {
    utils.board.byId.invalidate({ id: boardId });
    invalidateAnalytics();
  },
  onSuccess: () => {
    toast.success('記錄已更新');
    setEditingEntry(null);
  },
});
```

### Step 3: Add `handleEditOpen` and `handleEditSubmit` handlers

- [ ] After the `handleDelete` function (around line 253), add:

```tsx
const handleEditOpen = (entry: typeof timeEntries[0]) => {
  setEditingEntry(entry);
  setEditHours(Math.floor(entry.duration / 60));
  setEditMinutes(entry.duration % 60);
  const d = new Date(entry.startTime ?? entry.createdAt);
  setEditDate(
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  );
  setEditNote(entry.note ?? '');
};

const handleEditSubmit = () => {
  if (!editingEntry) return;
  if (editHours < 0 || editHours > 23) {
    toast.error('小時數須介於 0 ~ 23');
    return;
  }
  if (editMinutes < 0 || editMinutes > 59) {
    toast.error('分鐘數須介於 0 ~ 59');
    return;
  }
  const totalMinutes = editHours * 60 + editMinutes;
  if (totalMinutes <= 0) return;

  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const entryDate = localDayStartUTC(editDate, tz);

  updateEntry.mutate({
    id: editingEntry.id,
    duration: totalMinutes,
    startTime: entryDate,
    endTime: entryDate,
    note: editNote || undefined,
  });
};
```

### Step 4: Add pencil button to each row

- [ ] In the time entries list (around line 404), find the right-side div with the trash button:

```tsx
<Button
  variant="ghost"
  size="icon"
  className="h-7 w-7 text-primary hover:text-primary hover:bg-primary/10"
  onClick={() => handleDelete(entry.id)}
  disabled={deleteEntry.isPending}
>
  <Trash2 size={14} />
</Button>
```

Replace the wrapping `<div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink">` with `gap-1` between the two icon buttons, and add the pencil button before the trash button:

```tsx
<div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink">
  {entry.note && (
    <span className="text-muted-foreground truncate max-w-[100px] sm:max-w-[160px]">{entry.note}</span>
  )}
  <div className="flex items-center gap-1 shrink-0">
    <Button
      variant="ghost"
      size="icon"
      className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted"
      onClick={() => handleEditOpen(entry)}
      disabled={updateEntry.isPending}
    >
      <Pencil size={13} />
    </Button>
    <Button
      variant="ghost"
      size="icon"
      className="h-7 w-7 text-primary hover:text-primary hover:bg-primary/10"
      onClick={() => handleDelete(entry.id)}
      disabled={deleteEntry.isPending}
    >
      <Trash2 size={14} />
    </Button>
  </div>
</div>
```

### Step 5: Add edit dialog

- [ ] After the closing `</Dialog>` of the manual entry dialog, add:

```tsx
<Dialog open={!!editingEntry} onOpenChange={(open) => { if (!open) setEditingEntry(null); }}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>編輯記錄</DialogTitle>
    </DialogHeader>
    <div className="flex flex-col gap-4 py-4">
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium w-16">時長</label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={0}
            value={editHours}
            onChange={(e) => setEditHours(Number(e.target.value))}
            className="w-20"
          />
          <span className="text-sm text-muted-foreground">小時</span>
          <Input
            type="number"
            min={0}
            max={59}
            value={editMinutes}
            onChange={(e) => setEditMinutes(Number(e.target.value))}
            className="w-20"
          />
          <span className="text-sm text-muted-foreground">分鐘</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium w-16">日期</label>
        <Input
          type="date"
          value={editDate}
          onChange={(e) => setEditDate(e.target.value)}
        />
      </div>
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium w-16">備註</label>
        <Input
          type="text"
          placeholder="選填"
          value={editNote}
          onChange={(e) => setEditNote(e.target.value)}
        />
      </div>
    </div>
    <DialogFooter>
      <Button variant="outline" onClick={() => setEditingEntry(null)}>
        取消
      </Button>
      <Button
        onClick={handleEditSubmit}
        disabled={editHours * 60 + editMinutes <= 0 || updateEntry.isPending}
      >
        儲存
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Step 6: Manual smoke test

- [ ] Run the dev server: `npm run dev`
- [ ] Open a Time-Only board with at least one time entry
- [ ] Click the pencil icon — dialog should open pre-filled with the entry's data
- [ ] Change the duration and/or note, click 儲存 — the list should update immediately (optimistic), toast should say "記錄已更新"
- [ ] Verify mobile layout is not broken at 375px width in devtools

### Step 7: Commit

- [ ] Run `npm run build` to ensure no TypeScript errors

```bash
npm run build
```

Expected: no errors.

- [ ] Commit:

```bash
git add src/components/board/TimeOnlyBoard.tsx
git commit -m "feat(time-entry): add edit dialog with optimistic update"
```

---

## Task 2: Backend Demo Guard

**Files:**
- Modify: `src/server/routers/friend.ts`
- Create: `src/server/routers/friend.test.ts`

### Step 1: Write the failing test

- [ ] Create `src/server/routers/friend.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TRPCError } from '@trpc/server';

// Mock prisma before importing the router
vi.mock('~/server/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    friendInvite: {
      findUnique: vi.fn(),
    },
    friendship: {
      findFirst: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

describe('friend.invite.use — demo guard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws FORBIDDEN when the actor is the demo account', async () => {
    const { prisma } = await import('~/server/prisma');
    const { friendRouter } = await import('./friend');
    const { createCallerFactory } = await import('../trpc');

    // Mock: actor lookup returns demo email
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      email: 'demo@learning-dashboard.app',
    } as never);

    const createCaller = createCallerFactory(friendRouter);
    const caller = createCaller({
      session: { user: { id: 'demo-user-id', email: 'demo@learning-dashboard.app', name: 'Demo' }, expires: '' },
      userId: 'demo-user-id',
    });

    await expect(
      caller.invite.use({ token: 'some-token', action: 'accept' })
    ).rejects.toMatchObject({
      code: 'FORBIDDEN',
      message: 'Demo 帳號無法接受好友邀請',
    });
  });

  it('does NOT throw FORBIDDEN for a normal user', async () => {
    const { prisma } = await import('~/server/prisma');
    const { friendRouter } = await import('./friend');
    const { createCallerFactory } = await import('../trpc');

    // Mock: actor lookup returns a normal email
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      email: 'user@example.com',
    } as never);

    // Mock: invite not found (so it fails early with NOT_FOUND, not FORBIDDEN)
    vi.mocked(prisma.friendInvite.findUnique).mockResolvedValueOnce(null);

    const createCaller = createCallerFactory(friendRouter);
    const caller = createCaller({
      session: { user: { id: 'real-user-id', email: 'user@example.com', name: 'User' }, expires: '' },
      userId: 'real-user-id',
    });

    await expect(
      caller.invite.use({ token: 'some-token', action: 'accept' })
    ).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });
});
```

### Step 2: Run the test to confirm it fails

- [ ] Run:

```bash
npx vitest run src/server/routers/friend.test.ts
```

Expected: FAIL — `FORBIDDEN` is not thrown yet (the guard doesn't exist).

### Step 3: Add the demo guard to `friend.ts`

- [ ] In `src/server/routers/friend.ts`, inside the `use` mutation handler, add the guard as the **first** thing after the opening `async ({ ctx, input }) => {`:

Find:
```ts
.mutation(async ({ ctx, input }) => {
  const invite = await prisma.friendInvite.findUnique({
    where: { token: input.token },
  });
```

Replace with:
```ts
.mutation(async ({ ctx, input }) => {
  const actor = await prisma.user.findUnique({
    where: { id: ctx.userId },
    select: { email: true },
  });
  if (actor?.email === 'demo@learning-dashboard.app') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Demo 帳號無法接受好友邀請' });
  }

  const invite = await prisma.friendInvite.findUnique({
    where: { token: input.token },
  });
```

### Step 4: Run the test to confirm it passes

- [ ] Run:

```bash
npx vitest run src/server/routers/friend.test.ts
```

Expected: PASS — both tests green.

### Step 5: Commit

```bash
git add src/server/routers/friend.ts src/server/routers/friend.test.ts
git commit -m "feat(invite): block demo account from accepting friend invites"
```

---

## Task 3: Frontend Demo Button Hide

**Files:**
- Modify: `src/app/(auth)/login/page.tsx`

### Step 1: Add `isDemoHidden` flag and conditionally render

- [ ] In `LoginForm` (in `src/app/(auth)/login/page.tsx`), `callbackUrl` is already available from `useSearchParams`. Add the flag right after `callbackUrl` is declared:

Find:
```tsx
const callbackUrl = searchParams.get('callbackUrl') ?? '/dashboard';
```

Replace with:
```tsx
const callbackUrl = searchParams.get('callbackUrl') ?? '/dashboard';
const isDemoHidden = callbackUrl.includes('/invite/');
```

- [ ] Then wrap the demo button AND its following divider in a conditional. Find the demo button block:

```tsx
{/* Demo button */}
<Button
  variant="outline"
  className="w-full border-dashed border-2"
  onClick={handleDemoLogin}
  disabled={loading}
>
  🎯 Continue as Demo
</Button>

<div className="relative">
  <div className="absolute inset-0 flex items-center">
    <span className="w-full border-t" />
  </div>
  <div className="relative flex justify-center text-xs uppercase">
    <span className="bg-background px-2 text-muted-foreground">or</span>
  </div>
</div>
```

Replace with:
```tsx
{/* Demo button — hidden when arriving from an invite link */}
{!isDemoHidden && (
  <>
    <Button
      variant="outline"
      className="w-full border-dashed border-2"
      onClick={handleDemoLogin}
      disabled={loading}
    >
      🎯 Continue as Demo
    </Button>

    <div className="relative">
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t" />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-background px-2 text-muted-foreground">or</span>
      </div>
    </div>
  </>
)}
```

### Step 2: Manual smoke test

- [ ] Run `npm run dev`
- [ ] Navigate to `/login?callbackUrl=/invite/some-token` — demo button should NOT appear
- [ ] Navigate to `/login` (no callbackUrl) — demo button SHOULD appear
- [ ] Navigate to `/login?callbackUrl=/dashboard` — demo button SHOULD appear

### Step 3: Commit

```bash
git add src/app/(auth)/login/page.tsx
git commit -m "fix(invite): hide demo login button when redirected from invite link"
```

---

## Task 4: Final Verification

- [ ] Run full typecheck:

```bash
npm run build
```

Expected: no TypeScript errors.

- [ ] Run all tests:

```bash
npx vitest run
```

Expected: all tests pass.

- [ ] Manual end-to-end invite flow test:
  1. Log in as a normal user, go to Friends, copy the invite link
  2. Open the link in an incognito window
  3. Confirm you are redirected to `/login?callbackUrl=/invite/...`
  4. Confirm the "Continue as Demo" button is **not visible**
  5. Log in with a different real account (or register)
  6. Confirm the invite accept/decline UI appears and works correctly

- [ ] Manual demo guard test:
  1. Log in as demo (`demo@learning-dashboard.app` / `demo1234`)
  2. Navigate directly to `/invite/[any-valid-token]`
  3. Click "Accept" — should show an error toast from the FORBIDDEN response
