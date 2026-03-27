# Create Board Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 串接「新增 Board」功能，讓使用者填寫 Modal 後能實際建立 Board 並跳轉到 Board 頁面。

**Architecture:** 後端 `board.create` mutation 已就緒，只需修改前端 `CreateBoardModal` — 用 tRPC mutation 取代 mock 實作，成功後 invalidate board 列表並用 `useRouter` 跳轉。Lists 由使用者在 Board 頁面自訂，不在建立時預設。

**Tech Stack:** Next.js 15 App Router, tRPC v11, React Query, Zustand（不涉及）

---

## 檔案異動清單

| 動作 | 檔案 |
|------|------|
| 修改 | `src/components/dialogs/CreateBoardModal.tsx` |

後端 `src/server/routers/board.ts` **不需更動**，`board.create` mutation 已具備所有必要欄位。

---

### Task 1：串接 tRPC mutation 並實作跳轉

**Files:**
- Modify: `src/components/dialogs/CreateBoardModal.tsx`

- [ ] **Step 1：加入所需 import**

在檔案頂部，現有 import 後加入：

```typescript
import { useRouter } from 'next/navigation';
import { trpc } from '~/utils/trpc';
import { MOCK_USER_ID } from '~/lib/constants';
```

- [ ] **Step 2：在 component 內加入 hook**

在 `CreateBoardModal` function body 內，現有 `useState` 之後加入：

```typescript
const router = useRouter();
const utils = trpc.useUtils();

const createBoard = trpc.board.create.useMutation({
  onSuccess: (newBoard) => {
    utils.board.list.invalidate({ userId: MOCK_USER_ID });
    onOpenChange(false);
    setBoardName('');
    setSelectedTemplate('language');
    setSelectedColor(BOARD_COLORS[0].value);
    setBoardIcon('');
    router.push(`/board/${newBoard.id}`);
  },
});
```

- [ ] **Step 3：替換 handleCreate**

將現有的 `handleCreate` function 整個替換：

```typescript
const handleCreate = () => {
  if (!boardName.trim()) return;
  createBoard.mutate({
    name: boardName.trim(),
    type: selectedTemplateData?.type ?? 'TASK_BASED',
    userId: MOCK_USER_ID,
    icon: boardIcon || selectedTemplateData?.icon,
    color: selectedColor,
  });
};
```

- [ ] **Step 4：在 Footer 加上 loading 狀態**

將 `DialogFooter` 裡的「建立 Board」按鈕改為：

```tsx
<Button
  onClick={handleCreate}
  disabled={!boardName.trim() || createBoard.isPending}
>
  {createBoard.isPending ? '建立中...' : '建立 Board'}
</Button>
```

- [ ] **Step 5：手動測試**

1. 啟動 dev server：`npm run dev`
2. 開啟 http://localhost:3000
3. 點擊 Sidebar 底部「新增 Board」
4. 選模板、輸入名稱、選顏色，點「建立 Board」
5. 預期：按鈕變成「建立中...」→ 跳轉到 `/board/<新 boardId>` → Sidebar 出現新 Board

- [ ] **Step 6：Commit**

```bash
git add src/components/dialogs/CreateBoardModal.tsx
git commit -m "feat: wire up CreateBoardModal with tRPC and navigate to new board"
```
