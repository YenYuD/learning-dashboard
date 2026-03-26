# Frontend Layout & Component Design Spec

**日期**：2026-03-25
**專案**：Learning & Growth Dashboard
**範圍**：Phase 1 MVP — Layout、Dashboard、Task Board 前端 UI

---

## 設計決策

- **視覺風格**：跟隨 pencil-new.pen 設計稿（紅色主題）
- **色彩管理**：shadcn/ui CSS 變數系統（`globals.css` 覆寫），不 hardcode 在元件
- **UI 元件基礎**：shadcn/ui + TailwindCSS 客製化
- **開發優先序**：Layout → Dashboard → Task Board

---

## 色彩系統

覆寫 `globals.css` 中的 shadcn HSL 變數：

```css
/* Light mode */
--primary: 0 86% 57%;           /* 紅色 #EF4444 */
--primary-foreground: 0 0% 100%;
--background: 220 14% 96%;      /* 淺灰 #F3F4F6 */
--foreground: 222 47% 11%;      /* 深色文字 */
--card: 0 0% 100%;              /* 白色卡片 */
--card-foreground: 222 47% 11%;
--muted: 220 14% 91%;
--muted-foreground: 220 9% 46%;
--border: 220 13% 91%;
--sidebar-bg: 0 0% 11%;         /* 深色 sidebar #1C1C1C */
--sidebar-fg: 0 0% 96%;         /* sidebar 白色文字 */
--sidebar-accent: 0 86% 57%;    /* sidebar 選中項紅色 */
```

調色規則：未來換色只改 `globals.css`，元件本身使用 `bg-primary`、`text-primary` 等 Tailwind 語意類別。

---

## 路由結構

```
app/
├── layout.tsx                    ← Root layout（TRPCReactProvider + 字體）
├── page.tsx                      ← 導向 /dashboard
├── (app)/                        ← Route group，含 Sidebar 的所有頁面
│   ├── layout.tsx                ← AppShell（Sidebar + main）
│   ├── dashboard/
│   │   └── page.tsx              ← Dashboard 首頁
│   └── board/
│       └── [boardId]/
│           └── page.tsx          ← Task Board / Time-only Board
```

---

## 元件結構

### Layout 元件

```
src/components/layout/
├── AppShell.tsx      ← 最外層容器（sidebar + main 的 flex 容器）
├── Sidebar.tsx       ← 左側導覽列（固定 240px）
└── MobileSidebar.tsx ← 手機版抽屜（< 768px）
```

**Sidebar 內容**：
- Logo 區（「Learning」文字 logo）
- Dashboard 導覽連結
- Board 列表（`board.getAll` tRPC query，loading 時 skeleton）
- Board 選中樣式（紅色背景）
- `+ 新增 Board` 按鈕（底部）

### Dashboard 元件

```
src/components/dashboard/
├── StatsCard.tsx          ← 統計卡片（標題 + 數值 + 趨勢標籤）
├── StatsRow.tsx           ← 4 個 StatsCard 的 grid 容器
├── TimeRangeFilter.tsx    ← 今天/本週/本月 切換 tabs
├── WeeklyBarChart.tsx     ← 本週時間分佈（Recharts BarChart，堆疊）
├── BoardDonutChart.tsx    ← Board 佔比（Recharts PieChart/donut）
└── DailyTrendChart.tsx    ← 每日趨勢（Recharts LineChart）
```

**資料策略**：Phase 1 使用 mock 資料，每個 chart 元件接受 `data` prop，未來替換為 tRPC query 即可。

### Board 元件

```
src/components/board/
├── BoardHeader.tsx         ← Board 標題列（icon + 名稱 + settings 按鈕）
├── BoardContent.tsx        ← 橫向捲動容器（dnd-kit DndContext）
├── ListColumn.tsx          ← 單一 List 欄位
├── TaskCard.tsx            ← 任務卡片（標題 + 累計時間 + Start Timer 按鈕）
├── AddTaskButton.tsx       ← + Add task 按鈕（inline）
├── AddListButton.tsx       ← + 新增 List 按鈕（最右側）
└── EmptyBoard.tsx          ← 空狀態（無 List 時）
```

### 共用 Dialogs

```
src/components/dialogs/
├── CreateBoardModal.tsx    ← 模板選擇 + Board 資訊表單
├── CreateTaskDialog.tsx    ← 新增/編輯 Task
└── AddListDialog.tsx       ← 新增 List
```

---

## Phase 1 實作範圍（本次）

### 任務一：色彩系統 + shadcn 初始化
- 安裝 shadcn/ui（若尚未安裝）
- 覆寫 `globals.css` CSS 變數
- 更新 `tailwind.config.ts` 引用 CSS 變數

### 任務二：Layout（AppShell + Sidebar）
- `(app)/layout.tsx` — AppShell
- `Sidebar.tsx` — 靜態版（Board 列表 hardcode），之後接 API
- 手機版 RWD（hamburger menu，< 768px）
- 路由 redirect（`/` → `/dashboard`）

### 任務三：Dashboard 頁面
- `StatsCard` + `StatsRow`（mock 資料）
- `TimeRangeFilter`
- `WeeklyBarChart`（Recharts）
- `BoardDonutChart`（Recharts）
- `DailyTrendChart`（Recharts）

### 任務四：Task Board 頁面
- `BoardHeader`
- `ListColumn` + `TaskCard`（靜態 UI）
- `AddTaskButton` / `AddListButton`
- `EmptyBoard` 空狀態
- `CreateBoardModal`（模板選擇 + 表單，暫不接 API）

### 不在本次範圍
- dnd-kit 拖拉邏輯（獨立任務）
- Timer 功能（獨立任務）
- tRPC API 串接（Dashboard analytics、Board CRUD）
- Time-only Board 頁面（獨立任務）

---

## 響應式設計

| 斷點 | Sidebar | Board |
|------|---------|-------|
| ≥ 1024px | 固定 240px | 橫向捲動 |
| 768–1023px | 可收合（hamburger） | 橫向捲動 |
| < 768px | 抽屜（Drawer） | 直向捲動 |

---

## 套件需求

確認以下套件已安裝（或需安裝）：

- `shadcn/ui` — Button、Card、Dialog、Input、Select、Tabs、Skeleton
- `recharts` — 圖表
- `@dnd-kit/core` + `@dnd-kit/sortable` — 拖拉（Phase 1 靜態，不啟用）
- `lucide-react` — Icon（shadcn 預設）
