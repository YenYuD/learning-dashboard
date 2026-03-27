# Frontend Layout & Components Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建立 Learning Dashboard 完整前端 UI，含 Layout（Sidebar）、Dashboard 首頁、Task Board 頁面，跟隨 pencil-new.pen 紅色主題設計稿。

**Architecture:** Next.js App Router route group `(app)` 分離帶 Sidebar 的頁面。shadcn/ui CSS 變數覆寫紅色主題，所有顏色用 CSS 自訂屬性管理。Dashboard 圖表使用 mock data props，API 串接留後續。Task Board Phase 1 為靜態 UI。

**Tech Stack:** Next.js 15 App Router, TypeScript, TailwindCSS, shadcn/ui (New York style), Recharts, lucide-react

---

## 檔案總覽

**新增：**
- `src/lib/utils.ts` — shadcn cn() 工具（init 自動建立）
- `src/lib/constants.ts` — MOCK_USER_ID、BOARD_COLORS 常數
- `src/lib/mock-data.ts` — Dashboard 圖表 mock 資料
- `src/components/ui/` — shadcn 元件（自動產生）
- `src/components/layout/AppShell.tsx` — Sidebar + main 容器
- `src/components/layout/Sidebar.tsx` — 左側導覽（desktop）
- `src/components/layout/MobileSidebar.tsx` — 手機版抽屜
- `src/components/dashboard/StatsCard.tsx` — 統計卡片
- `src/components/dashboard/StatsRow.tsx` — 4 個統計卡片容器
- `src/components/dashboard/TimeRangeFilter.tsx` — 時間範圍切換
- `src/components/dashboard/WeeklyBarChart.tsx` — 本週時間分佈（Recharts）
- `src/components/dashboard/BoardDonutChart.tsx` — Board 佔比（Recharts）
- `src/components/dashboard/DailyTrendChart.tsx` — 每日趨勢（Recharts）
- `src/components/board/BoardHeader.tsx` — Board 標題列
- `src/components/board/ListColumn.tsx` — List 欄位
- `src/components/board/TaskCard.tsx` — 任務卡片
- `src/components/board/AddTaskButton.tsx` — + Add task
- `src/components/board/AddListButton.tsx` — + 新增 List
- `src/components/board/EmptyBoard.tsx` — 空狀態
- `src/components/dialogs/CreateBoardModal.tsx` — 建立 Board Modal
- `src/app/(app)/layout.tsx` — App route group layout
- `src/app/(app)/dashboard/page.tsx` — Dashboard 頁面
- `src/app/(app)/board/[boardId]/page.tsx` — Board 頁面

**修改：**
- `src/app/globals.css` — shadcn CSS 變數 + 紅色主題覆寫
- `src/app/layout.tsx` — 加入 Inter 字體
- `src/app/page.tsx` — redirect 至 /dashboard
- `tailwind.config.ts` — CSS 變數色彩擴充 + sidebar 顏色

---

## Task 1: 安裝套件 + shadcn/ui 初始化

**Files:**
- Modify: `package.json` (pnpm 安裝)
- Create: `src/lib/utils.ts`, `components.json`（shadcn 自動產生）

- [ ] **Step 1: 安裝 recharts**

```bash
cd /Users/yenyu/Desktop/coding-learning/learning-dashboard/.worktrees/feature-ui-development
pnpm add recharts
```

Expected: recharts 加入 dependencies，無 error。

- [ ] **Step 2: 初始化 shadcn/ui**

```bash
pnpm dlx shadcn@latest init -d
```

若 init 問你選項，選擇：
- Style: New York
- Base color: Neutral（之後手動覆寫為紅色）
- CSS variables: Yes

Expected: 建立 `components.json`、`src/lib/utils.ts`，修改 `tailwind.config.ts`、`globals.css`。

- [ ] **Step 3: 安裝 shadcn 元件**

```bash
pnpm dlx shadcn@latest add button card dialog input select tabs skeleton sheet separator badge
```

Expected: `src/components/ui/` 下產生多個元件檔案。

- [ ] **Step 4: 確認安裝**

```bash
ls src/components/ui/
```

Expected: 看到 `button.tsx card.tsx dialog.tsx input.tsx select.tsx tabs.tsx skeleton.tsx sheet.tsx separator.tsx badge.tsx`。

- [ ] **Step 5: Typecheck**

```bash
pnpm typecheck
```

Expected: 無 TypeScript 錯誤。

---

## Task 2: 色彩系統 + 字體設定

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`
- Modify: `tailwind.config.ts`
- Create: `src/lib/constants.ts`

- [ ] **Step 1: 覆寫 globals.css（紅色主題 + sidebar 自訂變數）**

完整取代 `src/app/globals.css`：

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* === shadcn 核心變數（紅色主題） === */
    /* 色彩來源：pencil-new.pen 設計稿                          */
    /* #FAFAFA 頁面背景 / #0D0D0D 主文字 / #E42313 紅色主色    */
    /* #7A7A7A 次要文字 / #FFFFFF 卡片 / #E8E8E8 邊框          */
    --background: 0 0% 98%;          /* #FAFAFA — Board 畫布背景 */
    --foreground: 0 0% 5%;           /* #0D0D0D — 主要文字 */

    --card: 0 0% 100%;               /* #FFFFFF */
    --card-foreground: 0 0% 5%;      /* #0D0D0D */

    --popover: 0 0% 100%;
    --popover-foreground: 0 0% 5%;

    --primary: 4 84% 48%;            /* #E42313 — 品牌紅 */
    --primary-foreground: 0 0% 100%; /* #FFFFFF */

    --secondary: 0 0% 98%;           /* #FAFAFA */
    --secondary-foreground: 0 0% 5%;

    --muted: 0 0% 98%;               /* #FAFAFA */
    --muted-foreground: 0 0% 48%;    /* #7A7A7A */

    --accent: 0 0% 98%;
    --accent-foreground: 0 0% 5%;

    --destructive: 4 84% 48%;        /* #E42313 */
    --destructive-foreground: 0 0% 100%;

    --border: 0 0% 91%;              /* #E8E8E8 */
    --input: 0 0% 91%;               /* #E8E8E8 */
    --ring: 4 84% 48%;               /* #E42313 */

    --radius: 0.5rem;

    /* === Sidebar 自訂變數（白色主題，來自設計稿） === */
    /* 設計稿 Sidebar fill = #FFFFFF，非深色               */
    --sidebar-background: 0 0% 100%;          /* #FFFFFF */
    --sidebar-foreground: 0 0% 5%;            /* #0D0D0D */
    --sidebar-accent: 4 84% 48%;              /* #E42313 — 選中項紅色 */
    --sidebar-accent-foreground: 0 0% 100%;   /* #FFFFFF */
    --sidebar-muted: 0 0% 98%;                /* #FAFAFA — hover 背景 */
    --sidebar-muted-foreground: 0 0% 48%;     /* #7A7A7A — 未選中文字 */
    --sidebar-border: 0 0% 91%;               /* #E8E8E8 */
  }

  * {
    @apply border-border;
    box-sizing: border-box;
  }

  body {
    @apply bg-background text-foreground;
    font-feature-settings: "rlig" 1, "calt" 1;
  }
}
```

- [ ] **Step 2: 更新 tailwind.config.ts（CSS 變數色彩 + sidebar 顏色）**

```ts
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/utils/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          muted: 'hsl(var(--sidebar-muted))',
          'muted-foreground': 'hsl(var(--sidebar-muted-foreground))',
          border: 'hsl(var(--sidebar-border))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [],
};

export default config;
```

- [ ] **Step 3: 加入 Inter 字體到 layout.tsx**

```tsx
import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { TRPCReactProvider } from '~/utils/trpc-provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Learning & Growth Dashboard',
  description: 'Personal growth management system with task management and time tracking',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW">
      <body className={inter.className}>
        <TRPCReactProvider>{children}</TRPCReactProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 4: 建立 constants.ts**

```ts
// src/lib/constants.ts

/** MVP 階段無認證，使用固定 demo user ID */
export const MOCK_USER_ID = 'user-demo';

/** Board 可選顏色（設計稿定義的 8 種柔和色） */
export const BOARD_COLORS = [
  { value: '#EFF6FF', label: '淺藍' },
  { value: '#F0FDF4', label: '淺綠' },
  { value: '#FEF3C7', label: '淺黃' },
  { value: '#FCE7F3', label: '淺粉' },
  { value: '#F3E8FF', label: '淺紫' },
  { value: '#FEE2E2', label: '淺紅' },
  { value: '#E0F2FE', label: '淺青' },
  { value: '#FEF9C3', label: '淺檸檬' },
] as const;

/** Board 模板定義 */
export const BOARD_TEMPLATES = [
  {
    id: 'language',
    label: '語言學習',
    icon: '📚',
    type: 'TASK_BASED' as const,
    defaultLists: ['Vocabulary', 'Grammar', 'Practice'],
  },
  {
    id: 'programming',
    label: '程式學習',
    icon: '💻',
    type: 'TASK_BASED' as const,
    defaultLists: ['To Learn', 'In Progress', 'Completed'],
  },
  {
    id: 'sport',
    label: '技能型運動',
    icon: '⛷️',
    type: 'TIME_ONLY' as const,
    defaultLists: [],
  },
  {
    id: 'fitness',
    label: '健身訓練',
    icon: '💪',
    type: 'TASK_BASED' as const,
    defaultLists: ['Plan', 'In Progress', 'Done'],
  },
  {
    id: 'custom',
    label: '自訂',
    icon: '✨',
    type: 'TASK_BASED' as const,
    defaultLists: [],
  },
] as const;
```

- [ ] **Step 5: Typecheck**

```bash
pnpm typecheck
```

Expected: 無錯誤。

---

## Task 3: Route 結構 + Redirect

**Files:**
- Create: `src/app/(app)/layout.tsx`
- Create: `src/app/(app)/dashboard/page.tsx`（placeholder）
- Create: `src/app/(app)/board/[boardId]/page.tsx`（placeholder）
- Modify: `src/app/page.tsx`

- [ ] **Step 1: 更新 src/app/page.tsx（redirect）**

```tsx
import { redirect } from 'next/navigation';

export default function RootPage() {
  redirect('/dashboard');
}
```

- [ ] **Step 2: 建立 (app) layout 骨架**

```tsx
// src/app/(app)/layout.tsx
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      <div className="flex flex-1 flex-col overflow-hidden">{children}</div>
    </div>
  );
}
```

（Sidebar 在 Task 4 加入）

- [ ] **Step 3: 建立 Dashboard page placeholder**

```tsx
// src/app/(app)/dashboard/page.tsx
export default function DashboardPage() {
  return (
    <main className="flex-1 overflow-y-auto p-6">
      <h1 className="text-2xl font-bold">Learning Dashboard</h1>
      <p className="text-muted-foreground mt-1">Coming soon...</p>
    </main>
  );
}
```

- [ ] **Step 4: 建立 Board page placeholder**

```tsx
// src/app/(app)/board/[boardId]/page.tsx
export default function BoardPage({
  params,
}: {
  params: Promise<{ boardId: string }>;
}) {
  return (
    <main className="flex-1 overflow-y-auto p-6">
      <p className="text-muted-foreground">Board loading...</p>
    </main>
  );
}
```

- [ ] **Step 5: 確認 dev server 正常啟動**

```bash
pnpm run dev
```

Expected: 啟動成功，瀏覽 http://localhost:3000 自動跳轉至 /dashboard，頁面顯示「Learning Dashboard - Coming soon...」。

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: setup route structure and color system"
```

---

## Task 4: AppShell + Sidebar

**Files:**
- Create: `src/components/layout/AppShell.tsx`
- Create: `src/components/layout/Sidebar.tsx`
- Create: `src/components/layout/MobileSidebar.tsx`
- Modify: `src/app/(app)/layout.tsx`

- [ ] **Step 1: 建立 Sidebar.tsx**

```tsx
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
```

- [ ] **Step 2: 建立 MobileSidebar.tsx**

```tsx
// src/components/layout/MobileSidebar.tsx
'use client';

import { Menu } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '~/components/ui/sheet';
import { Sidebar } from './Sidebar';

export function MobileSidebar() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu size={20} />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-60 p-0">
        <Sidebar />
      </SheetContent>
    </Sheet>
  );
}
```

- [ ] **Step 3: 建立 AppShell.tsx**

```tsx
// src/components/layout/AppShell.tsx
import { Sidebar } from './Sidebar';
import { MobileSidebar } from './MobileSidebar';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile topbar */}
        <header className="flex h-14 items-center border-b bg-card px-4 md:hidden">
          <MobileSidebar />
          <span className="ml-2 font-semibold">Learning</span>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: 建立 CreateBoardModal placeholder（避免 Sidebar import 報錯）**

```tsx
// src/components/dialogs/CreateBoardModal.tsx
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';

interface CreateBoardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateBoardModal({ open, onOpenChange }: CreateBoardModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>建立新 Board</DialogTitle>
        </DialogHeader>
        <p className="text-muted-foreground text-sm">Coming in Task 8...</p>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 5: 更新 (app)/layout.tsx 使用 AppShell**

```tsx
// src/app/(app)/layout.tsx
import { AppShell } from '~/components/layout/AppShell';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
```

- [ ] **Step 6: Typecheck + 視覺確認**

```bash
pnpm typecheck
```

瀏覽 http://localhost:3000/dashboard — 左側應顯示**白色 Sidebar**（#FFFFFF），含紅色 logo 圖示、深色「Learning」文字、Dashboard 連結（active 時文字與左側指示點為紅色 #E42313）、空的 Boards 區塊、底部「新增 Board」按鈕（文字 #7A7A7A）。右側主內容區背景 #FAFAFA。

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add AppShell and Sidebar layout"
```

---

## Task 5: Dashboard — StatsCard + TimeRangeFilter

**Files:**
- Create: `src/lib/mock-data.ts`
- Create: `src/components/dashboard/StatsCard.tsx`
- Create: `src/components/dashboard/StatsRow.tsx`
- Create: `src/components/dashboard/TimeRangeFilter.tsx`
- Modify: `src/app/(app)/dashboard/page.tsx`

- [ ] **Step 1: 建立 mock-data.ts**

```ts
// src/lib/mock-data.ts

export type TimeRange = 'today' | 'week' | 'month';

export const WEEKLY_BAR_DATA = [
  { day: '週一', '英文學習': 1.5, 'LeetCode': 2, '滑雪': 0 },
  { day: '週二', '英文學習': 1, 'LeetCode': 1.5, '滑雪': 0 },
  { day: '週三', '英文學習': 2, 'LeetCode': 0.5, '滑雪': 3 },
  { day: '週四', '英文學習': 1.5, 'LeetCode': 2.5, '滑雪': 0 },
  { day: '週五', '英文學習': 2.5, 'LeetCode': 1, '滑雪': 0 },
  { day: '週六', '英文學習': 1, 'LeetCode': 0, '滑雪': 4 },
  { day: '週日', '英文學習': 3, 'LeetCode': 1.5, '滑雪': 0 },
];

export const DONUT_DATA = [
  { name: '英文學習', value: 40, color: '#EF4444' },
  { name: 'LeetCode', value: 35, color: '#3B82F6' },
  { name: '滑雪', value: 25, color: '#10B981' },
];

export const DAILY_TREND_DATA = [
  { date: '3/19', hours: 3.5 },
  { date: '3/20', hours: 4 },
  { date: '3/21', hours: 2.5 },
  { date: '3/22', hours: 5 },
  { date: '3/23', hours: 3 },
  { date: '3/24', hours: 4.5 },
  { date: '3/25', hours: 2.5 },
];

export const STATS_DATA: Record<TimeRange, {
  today: { value: string; unit: string; trend: string; trendUp: boolean };
  week: { value: string; unit: string; trend: string; trendUp: boolean };
  month: { value: string; unit: string; trend: string; trendUp: boolean };
  boards: { value: string; unit: string; trend: string; trendUp: boolean };
}> = {
  today: {
    today: { value: '2.5', unit: '小時', trend: '+0.5 vs 昨天', trendUp: true },
    week: { value: '15', unit: '小時', trend: '+2 vs 上週', trendUp: true },
    month: { value: '45', unit: '小時', trend: '+5 vs 上月', trendUp: true },
    boards: { value: '8', unit: '個 Boards', trend: '', trendUp: true },
  },
  week: {
    today: { value: '2.5', unit: '小時', trend: '+0.5 vs 昨天', trendUp: true },
    week: { value: '15', unit: '小時', trend: '+2 vs 上週', trendUp: true },
    month: { value: '45', unit: '小時', trend: '+5 vs 上月', trendUp: true },
    boards: { value: '8', unit: '個 Boards', trend: '', trendUp: true },
  },
  month: {
    today: { value: '2.5', unit: '小時', trend: '+0.5 vs 昨天', trendUp: true },
    week: { value: '15', unit: '小時', trend: '+2 vs 上週', trendUp: true },
    month: { value: '45', unit: '小時', trend: '+5 vs 上月', trendUp: true },
    boards: { value: '8', unit: '個 Boards', trend: '', trendUp: true },
  },
};
```

- [ ] **Step 2: 建立 StatsCard.tsx**

```tsx
// src/components/dashboard/StatsCard.tsx
import { Card, CardContent } from '~/components/ui/card';
import { cn } from '~/lib/utils';

interface StatsCardProps {
  title: string;
  value: string;
  unit: string;
  trend?: string;
  trendUp?: boolean;
}

export function StatsCard({ title, value, unit, trend, trendUp }: StatsCardProps) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4 px-5">
        <p className="text-sm text-muted-foreground mb-1">{title}</p>
        <p className="text-3xl font-bold leading-none">{value}</p>
        <p className="text-sm text-muted-foreground mt-1">{unit}</p>
        {trend && (
          <p
            className={cn(
              'text-xs mt-2 font-medium',
              trendUp ? 'text-green-600' : 'text-red-500',
            )}
          >
            {trend}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 3: 建立 StatsRow.tsx**

```tsx
// src/components/dashboard/StatsRow.tsx
import { StatsCard } from './StatsCard';
import type { TimeRange } from '~/lib/mock-data';
import { STATS_DATA } from '~/lib/mock-data';

interface StatsRowProps {
  timeRange: TimeRange;
}

export function StatsRow({ timeRange }: StatsRowProps) {
  const stats = STATS_DATA[timeRange];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatsCard
        title="今日學習"
        value={stats.today.value}
        unit={stats.today.unit}
        trend={stats.today.trend}
        trendUp={stats.today.trendUp}
      />
      <StatsCard
        title="本週學習"
        value={stats.week.value}
        unit={stats.week.unit}
        trend={stats.week.trend}
        trendUp={stats.week.trendUp}
      />
      <StatsCard
        title="本月學習"
        value={stats.month.value}
        unit={stats.month.unit}
        trend={stats.month.trend}
        trendUp={stats.month.trendUp}
      />
      <StatsCard
        title="活躍項目"
        value={stats.boards.value}
        unit={stats.boards.unit}
      />
    </div>
  );
}
```

- [ ] **Step 4: 建立 TimeRangeFilter.tsx**

```tsx
// src/components/dashboard/TimeRangeFilter.tsx
'use client';

import { Tabs, TabsList, TabsTrigger } from '~/components/ui/tabs';
import type { TimeRange } from '~/lib/mock-data';

interface TimeRangeFilterProps {
  value: TimeRange;
  onChange: (value: TimeRange) => void;
}

export function TimeRangeFilter({ value, onChange }: TimeRangeFilterProps) {
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as TimeRange)}>
      <TabsList>
        <TabsTrigger value="today">今天</TabsTrigger>
        <TabsTrigger value="week">本週</TabsTrigger>
        <TabsTrigger value="month">本月</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
```

- [ ] **Step 5: 更新 Dashboard page（加入 StatsRow + TimeRangeFilter）**

```tsx
// src/app/(app)/dashboard/page.tsx
'use client';

import { useState } from 'react';
import { StatsRow } from '~/components/dashboard/StatsRow';
import { TimeRangeFilter } from '~/components/dashboard/TimeRangeFilter';
import type { TimeRange } from '~/lib/mock-data';

export default function DashboardPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('week');

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Learning Dashboard</h1>
        <TimeRangeFilter value={timeRange} onChange={setTimeRange} />
      </div>

      {/* Stats */}
      <StatsRow timeRange={timeRange} />

      {/* Charts placeholder */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-3 rounded-lg border bg-card p-4 h-64 flex items-center justify-center text-muted-foreground">
          Charts coming in Task 6...
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Typecheck + 視覺確認**

```bash
pnpm typecheck
```

瀏覽 /dashboard — 應看到 4 個統計卡片（2.5/15/45/8）和本週/今天/本月切換器。

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add Dashboard stats cards and time range filter"
```

---

## Task 6: Dashboard — Charts（Recharts）

**Files:**
- Create: `src/components/dashboard/WeeklyBarChart.tsx`
- Create: `src/components/dashboard/BoardDonutChart.tsx`
- Create: `src/components/dashboard/DailyTrendChart.tsx`
- Modify: `src/app/(app)/dashboard/page.tsx`

- [ ] **Step 1: 建立 WeeklyBarChart.tsx**

```tsx
// src/components/dashboard/WeeklyBarChart.tsx
'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { WEEKLY_BAR_DATA } from '~/lib/mock-data';

const BOARD_COLORS = ['#EF4444', '#3B82F6', '#10B981'];
const BOARD_KEYS = ['英文學習', 'LeetCode', '滑雪'];

export function WeeklyBarChart() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">本週時間分佈</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={WEEKLY_BAR_DATA} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
                fontSize: 12,
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: 12 }}
            />
            {BOARD_KEYS.map((key, i) => (
              <Bar key={key} dataKey={key} stackId="a" fill={BOARD_COLORS[i]} radius={i === BOARD_KEYS.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: 建立 BoardDonutChart.tsx**

```tsx
// src/components/dashboard/BoardDonutChart.tsx
'use client';

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { DONUT_DATA } from '~/lib/mock-data';

export function BoardDonutChart() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Board 時間佔比</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={DONUT_DATA}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={3}
              dataKey="value"
            >
              {DONUT_DATA.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
                fontSize: 12,
              }}
              formatter={(value: number) => [`${value}%`, '']}
            />
          </PieChart>
        </ResponsiveContainer>
        {/* Legend */}
        <div className="mt-2 flex flex-col gap-1">
          {DONUT_DATA.map((entry) => (
            <div key={entry.name} className="flex items-center gap-2 text-xs">
              <div
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground">{entry.name}</span>
              <span className="ml-auto font-medium">{entry.value}%</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 3: 建立 DailyTrendChart.tsx**

```tsx
// src/components/dashboard/DailyTrendChart.tsx
'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { DAILY_TREND_DATA } from '~/lib/mock-data';

export function DailyTrendChart() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">每日趨勢</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={DAILY_TREND_DATA} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
                fontSize: 12,
              }}
              formatter={(value: number) => [`${value}h`, '學習時數']}
            />
            <Area
              type="monotone"
              dataKey="hours"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fill="url(#trendGradient)"
              dot={{ fill: 'hsl(var(--primary))', r: 3 }}
              activeDot={{ r: 5 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 4: 更新 Dashboard page（完整版）**

```tsx
// src/app/(app)/dashboard/page.tsx
'use client';

import { useState } from 'react';
import { StatsRow } from '~/components/dashboard/StatsRow';
import { TimeRangeFilter } from '~/components/dashboard/TimeRangeFilter';
import { WeeklyBarChart } from '~/components/dashboard/WeeklyBarChart';
import { BoardDonutChart } from '~/components/dashboard/BoardDonutChart';
import { DailyTrendChart } from '~/components/dashboard/DailyTrendChart';
import type { TimeRange } from '~/lib/mock-data';

export default function DashboardPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('week');

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Learning Dashboard</h1>
        <TimeRangeFilter value={timeRange} onChange={setTimeRange} />
      </div>

      {/* Stats row */}
      <StatsRow timeRange={timeRange} />

      {/* Charts */}
      <WeeklyBarChart />

      <div className="grid gap-4 lg:grid-cols-2">
        <BoardDonutChart />
        <DailyTrendChart />
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Typecheck + 視覺確認**

```bash
pnpm typecheck
```

瀏覽 /dashboard — 應看到 Bar Chart（本週分佈）、Donut Chart（佔比）、Area Chart（趨勢）三張圖。

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add Dashboard charts (bar, donut, trend)"
```

---

## Task 7: Task Board 頁面（靜態 UI）

**Files:**
- Create: `src/components/board/BoardHeader.tsx`
- Create: `src/components/board/TaskCard.tsx`
- Create: `src/components/board/AddTaskButton.tsx`
- Create: `src/components/board/ListColumn.tsx`
- Create: `src/components/board/AddListButton.tsx`
- Create: `src/components/board/EmptyBoard.tsx`
- Modify: `src/app/(app)/board/[boardId]/page.tsx`

- [ ] **Step 1: 建立 BoardHeader.tsx**

```tsx
// src/components/board/BoardHeader.tsx
import { Settings } from 'lucide-react';
import { Button } from '~/components/ui/button';

interface BoardHeaderProps {
  icon?: string;
  name: string;
  color?: string;
}

export function BoardHeader({ icon, name, color }: BoardHeaderProps) {
  return (
    <div
      className="flex h-14 items-center justify-between border-b bg-card px-6"
      style={color ? { borderTopColor: color, borderTopWidth: 3 } : undefined}
    >
      <div className="flex items-center gap-2">
        {icon && <span className="text-xl">{icon}</span>}
        <h1 className="text-xl font-bold">{name}</h1>
      </div>
      <Button variant="ghost" size="icon">
        <Settings size={18} />
        <span className="sr-only">Board settings</span>
      </Button>
    </div>
  );
}
```

- [ ] **Step 2: 建立 TaskCard.tsx**

```tsx
// src/components/board/TaskCard.tsx
'use client';

import { Play, Clock } from 'lucide-react';
import { Card, CardContent } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { cn } from '~/lib/utils';

interface TaskCardProps {
  title: string;
  description?: string;
  totalMinutes?: number;
  isTimerRunning?: boolean;
}

function formatMinutes(minutes: number): string {
  if (minutes === 0) return '0m';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function TaskCard({
  title,
  description,
  totalMinutes = 0,
  isTimerRunning = false,
}: TaskCardProps) {
  return (
    <Card
      className={cn(
        'cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md group',
        isTimerRunning && 'ring-2 ring-primary',
      )}
    >
      <CardContent className="p-3">
        <p className="text-sm font-medium leading-snug">{title}</p>
        {description && (
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
            {description}
          </p>
        )}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock size={12} />
            <span>{formatMinutes(totalMinutes)}</span>
          </div>
          <Button
            size="sm"
            variant={isTimerRunning ? 'default' : 'outline'}
            className="h-7 gap-1 px-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Play size={10} />
            {isTimerRunning ? 'Running' : 'Start'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 3: 建立 AddTaskButton.tsx**

```tsx
// src/components/board/AddTaskButton.tsx
'use client';

import { Plus } from 'lucide-react';
import { Button } from '~/components/ui/button';

interface AddTaskButtonProps {
  onClick?: () => void;
}

export function AddTaskButton({ onClick }: AddTaskButtonProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
      onClick={onClick}
    >
      <Plus size={14} />
      Add task
    </Button>
  );
}
```

- [ ] **Step 4: 建立 ListColumn.tsx**

```tsx
// src/components/board/ListColumn.tsx
'use client';

import { MoreHorizontal } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { TaskCard } from './TaskCard';
import { AddTaskButton } from './AddTaskButton';

interface Task {
  id: string;
  title: string;
  description?: string;
  totalMinutes?: number;
}

interface ListColumnProps {
  title: string;
  tasks: Task[];
  onAddTask?: () => void;
}

export function ListColumn({ title, tasks, onAddTask }: ListColumnProps) {
  return (
    <div className="flex w-72 shrink-0 flex-col rounded-lg bg-muted/60">
      {/* List header */}
      <div className="flex items-center justify-between px-3 py-2.5">
        <h3 className="text-sm font-semibold">{title}</h3>
        <Button variant="ghost" size="icon" className="h-7 w-7">
          <MoreHorizontal size={14} />
        </Button>
      </div>

      {/* Task cards */}
      <div className="flex flex-col gap-2 px-2 pb-2 min-h-[60px]">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            title={task.title}
            description={task.description}
            totalMinutes={task.totalMinutes}
          />
        ))}
      </div>

      {/* Add task */}
      <div className="px-2 pb-2">
        <AddTaskButton onClick={onAddTask} />
      </div>
    </div>
  );
}
```

- [ ] **Step 5: 建立 AddListButton.tsx**

```tsx
// src/components/board/AddListButton.tsx
'use client';

import { Plus } from 'lucide-react';
import { Button } from '~/components/ui/button';

interface AddListButtonProps {
  onClick?: () => void;
}

export function AddListButton({ onClick }: AddListButtonProps) {
  return (
    <div className="flex w-72 shrink-0 items-start pt-0.5">
      <Button
        variant="outline"
        className="w-full justify-start gap-2 bg-muted/40 hover:bg-muted border-dashed"
        onClick={onClick}
      >
        <Plus size={16} />
        新增 List
      </Button>
    </div>
  );
}
```

- [ ] **Step 6: 建立 EmptyBoard.tsx**

```tsx
// src/components/board/EmptyBoard.tsx
import { Plus } from 'lucide-react';
import { Button } from '~/components/ui/button';

interface EmptyBoardProps {
  onAddList?: () => void;
}

export function EmptyBoard({ onAddList }: EmptyBoardProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
      <div className="text-5xl">📋</div>
      <div>
        <p className="text-lg font-semibold">這個 Board 還沒有 List</p>
        <p className="text-sm text-muted-foreground mt-1">
          新增第一個 List 來開始管理你的任務
        </p>
      </div>
      <Button onClick={onAddList} className="gap-2">
        <Plus size={16} />
        新增 List
      </Button>
    </div>
  );
}
```

- [ ] **Step 7: 更新 Board page（完整靜態版）**

```tsx
// src/app/(app)/board/[boardId]/page.tsx
import { BoardHeader } from '~/components/board/BoardHeader';
import { ListColumn } from '~/components/board/ListColumn';
import { AddListButton } from '~/components/board/AddListButton';
import { EmptyBoard } from '~/components/board/EmptyBoard';

// 靜態 mock 資料，待 API 串接時替換
const MOCK_BOARD = {
  id: 'mock-1',
  name: '英文學習',
  icon: '📚',
  color: '#EFF6FF',
  type: 'TASK_BASED' as const,
};

const MOCK_LISTS = [
  {
    id: 'list-1',
    title: 'Vocabulary',
    tasks: [
      { id: 't1', title: '背單字 50 個', description: '目標：TOEFL 高頻單字', totalMinutes: 90 },
      { id: 't2', title: '複習上週單字', totalMinutes: 30 },
    ],
  },
  {
    id: 'list-2',
    title: 'Grammar',
    tasks: [
      { id: 't3', title: '時態練習', description: '完成時態練習題 1-20', totalMinutes: 45 },
    ],
  },
  {
    id: 'list-3',
    title: 'Practice',
    tasks: [
      { id: 't4', title: '口說練習', totalMinutes: 60 },
    ],
  },
];

export default async function BoardPage({
  params,
}: {
  params: Promise<{ boardId: string }>;
}) {
  // boardId 留待後續 API 串接使用
  await params;

  const hasLists = MOCK_LISTS.length > 0;

  return (
    <div className="flex flex-col h-full">
      <BoardHeader
        icon={MOCK_BOARD.icon}
        name={MOCK_BOARD.name}
        color={MOCK_BOARD.color}
      />

      {hasLists ? (
        <div className="flex-1 overflow-x-auto overflow-y-hidden">
          <div className="flex h-full gap-3 p-4">
            {MOCK_LISTS.map((list) => (
              <ListColumn
                key={list.id}
                title={list.title}
                tasks={list.tasks}
              />
            ))}
            <AddListButton />
          </div>
        </div>
      ) : (
        <EmptyBoard />
      )}
    </div>
  );
}
```

- [ ] **Step 8: Typecheck + 視覺確認**

```bash
pnpm typecheck
```

從 Sidebar 點擊任一 Board 連結（或直接導向 /board/mock-1）— 應看到 BoardHeader、3 個 ListColumn、每個 List 有 TaskCard、最右側有「新增 List」按鈕。Hover TaskCard 應顯示 Start 按鈕。

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: add Task Board static UI (header, lists, task cards)"
```

---

## Task 8: CreateBoardModal（完整版）

**Files:**
- Modify: `src/components/dialogs/CreateBoardModal.tsx`

- [ ] **Step 1: 完整實作 CreateBoardModal.tsx**

```tsx
// src/components/dialogs/CreateBoardModal.tsx
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '~/components/ui/dialog';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { cn } from '~/lib/utils';
import { BOARD_COLORS, BOARD_TEMPLATES } from '~/lib/constants';

interface CreateBoardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type TemplateId = (typeof BOARD_TEMPLATES)[number]['id'];

export function CreateBoardModal({ open, onOpenChange }: CreateBoardModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>('language');
  const [boardName, setBoardName] = useState('');
  const [selectedColor, setSelectedColor] = useState(BOARD_COLORS[0].value);

  const selectedTemplateData = BOARD_TEMPLATES.find(
    (t) => t.id === selectedTemplate,
  );

  const handleCreate = () => {
    if (!boardName.trim()) return;
    // TODO: 串接 trpc.board.create
    console.log('Create board:', {
      name: boardName,
      template: selectedTemplate,
      color: selectedColor,
      type: selectedTemplateData?.type,
      defaultLists: selectedTemplateData?.defaultLists,
    });
    onOpenChange(false);
    setBoardName('');
    setSelectedTemplate('language');
    setSelectedColor(BOARD_COLORS[0].value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>建立新 Board</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Template selection */}
          <div>
            <p className="text-sm font-medium mb-3">選擇模板</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {BOARD_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => setSelectedTemplate(template.id)}
                  className={cn(
                    'flex flex-col items-center gap-2 rounded-lg border-2 p-4 text-center text-sm transition-colors',
                    selectedTemplate === template.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-muted-foreground/40',
                  )}
                >
                  <span className="text-2xl">{template.icon}</span>
                  <span className="font-medium text-xs">{template.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Board info */}
          <div className="space-y-4">
            <p className="text-sm font-medium">Board 資訊</p>

            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">
                名稱
              </label>
              <Input
                placeholder={`例：${selectedTemplateData?.label ?? '我的 Board'}`}
                value={boardName}
                onChange={(e) => setBoardName(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">
                顏色
              </label>
              <div className="flex gap-2 flex-wrap">
                {BOARD_COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    title={color.label}
                    onClick={() => setSelectedColor(color.value)}
                    className={cn(
                      'h-7 w-7 rounded-full border-2 transition-transform hover:scale-110',
                      selectedColor === color.value
                        ? 'border-foreground scale-110'
                        : 'border-transparent',
                    )}
                    style={{ backgroundColor: color.value }}
                  />
                ))}
              </div>
            </div>

            {/* Preview */}
            {boardName && (
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">
                  預覽
                </label>
                <div
                  className="rounded-lg border p-3 text-sm"
                  style={{ backgroundColor: selectedColor }}
                >
                  <p className="font-semibold">
                    {selectedTemplateData?.icon} {boardName}
                  </p>
                  {selectedTemplateData && selectedTemplateData.defaultLists.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      包含: {(selectedTemplateData.defaultLists as readonly string[]).join(' · ')}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleCreate} disabled={!boardName.trim()}>
            建立 Board
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Typecheck + 視覺確認**

```bash
pnpm typecheck
```

點擊 Sidebar 底部「新增 Board」按鈕 — 應看到 Modal 彈出，含 5 個模板選項、名稱輸入、8 色選色器、預覽區塊。

- [ ] **Step 3: Final typecheck**

```bash
pnpm typecheck
```

Expected: 0 errors.

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete Phase 1 frontend UI (layout, dashboard, board, modal)"
```

---

## Self-Review

**Spec coverage 確認：**
- ✅ CSS 變數紅色主題（Task 2）
- ✅ Sidebar + AppShell（Task 4）
- ✅ 手機版 RWD（Task 4, MobileSidebar）
- ✅ Dashboard StatsCard × 4（Task 5）
- ✅ TimeRangeFilter（Task 5）
- ✅ WeeklyBarChart（Task 6）
- ✅ BoardDonutChart（Task 6）
- ✅ DailyTrendChart（Task 6）
- ✅ Task Board 靜態 UI（Task 7）
- ✅ CreateBoardModal 完整版（Task 8）
- ✅ constants.ts 管理顏色/模板（Task 2）
- ❌ 不在本次範圍：dnd-kit 拖拉、Timer、API 串接、Time-only Board
