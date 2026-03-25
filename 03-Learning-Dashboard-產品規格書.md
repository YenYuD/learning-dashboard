# 📊 Learning & Growth Dashboard - 產品規格書

> **專案名稱**：Learning & Growth Dashboard
> **類型**：個人成長管理系統（學習 + 運動）
> **技術棧**：Next.js 14 + TypeScript + PostgreSQL + Prisma
> **開發時程**：2 週 MVP（Week 3-4）

---

## 🎯 產品定位

### 核心價值主張
一個整合「任務管理」和「時間追蹤」的個人成長系統，幫助多目標學習者（如同時學英文、日文、程式、運動）有效管理進度和時間分配。

### 目標使用者
- 多領域學習者（語言、技術、考試準備）
- 需要追蹤運動/技能練習時間的人
- 希望視覺化學習成效的自律型使用者

### 競品參考
- Athenify（學習時間追蹤）
- Trello（任務管理）
- Toggl（時間追蹤）

---

## 🏗️ 系統架構

### 前端
- **框架**：Next.js 14 (App Router)
- **元件庫**：shadcn/ui
- **語言**：TypeScript
- **樣式**：TailwindCSS
- **狀態管理**：Zustand（輕量）
- **拖拉功能**：@dnd-kit/core
- **圖表**：Recharts
- **表單**：React Hook Form + Zod
- **響應式設計**：最小螢幕尺寸 375px, 最大 1920px

### 後端
- **API**：tRPC v11（端到端型別安全）
- **資料庫**：PostgreSQL（建議使用 Supabase 免費版）
- **ORM**：Prisma
- **Schema 驗證**：Zod
- **認證**：暫不實作（Phase 2 再加 NextAuth.js）

### 部署
- **前端 + API**：Vercel
- **資料庫**：Supabase（或 Vercel Postgres）

---

## 📐 功能規格

## Phase 1: MVP（2 週完成）

### 1. Board 管理

#### 1.1 Board 類型
系統支援兩種 Board 類型：

**任務型 Board（Task-based）**
- 適用於：語言學習、程式學習、考試準備、健身訓練
- 包含：Lists（欄位）+ Tasks（任務卡片）
- 支援拖拉排序

**時間追蹤型 Board（Time-only）**
- 適用於：滑雪、溜冰、跳舞等技能型運動
- 只記錄時間，不需要任務卡片
- UI 更簡潔，專注在時間累積

#### 1.2 Board 建立流程

```
使用者點擊「新增 Board」
  ↓
顯示 Template 選擇介面
  ├─ 📚 語言學習（Task-based）
  ├─ 💻 程式學習（Task-based）
  ├─ ⛷️ 技能型運動（Time-only）
  ├─ 💪 健身訓練（Task-based）
  └─ ✨ 自訂 Board
  ↓
填寫 Board 資訊
  - Board 名稱（必填）
  - 選擇 icon emoji（可選）
  - 選擇顏色（可選）
  - 自動建立預設 Lists（依據模板）
  ↓
建立完成
```

#### 1.3 Board CRUD
- ✅ 新增 Board（含模板選擇）
- ✅ 編輯 Board（名稱、icon、顏色）
- ✅ 刪除 Board（需確認提示）
- ✅ Board 排序（拖拉）

---

### 2. 任務管理（僅 Task-based Board）

#### 2.1 List 管理
- 每個 Board 可有多個 Lists（例如：To Do, In Progress, Done）
- Lists 可拖拉排序
- Lists CRUD：新增、編輯、刪除

#### 2.2 Task 管理

**Task 資料欄位**：
- 標題（必填）
- 描述（可選，支援 markdown？）
- 建立時間
- 更新時間
- 所屬 List

**Task 操作**：
- ✅ 新增 Task
- ✅ 編輯 Task
- ✅ 刪除 Task
- ✅ 在同一 List 內拖拉排序
- ✅ 跨 List 拖拉（移動狀態）

#### 2.3 拖拉互動
使用 `@dnd-kit/core` 實作：
- List 之間拖拉排序
- Task 在 List 內排序
- Task 跨 List 移動
- 拖拉時的視覺回饋（placeholder, ghost）

---

### 3. 時間追蹤

#### 3.1 雙模式設計

**模式 1：內建 Timer（推薦）**
```
使用流程：
1. 在 Task 卡片上點擊「開始計時」
2. Timer 開始跑（顯示即時時間）
3. 可暫停 / 繼續
4. 點擊「停止」儲存時間記錄
```

**模式 2：手動輸入**
```
使用流程：
1. 點擊「手動新增時間」
2. 填寫表單：
   - 選擇 Board / Task（如果是 Task-based）
   - 輸入日期時間
   - 輸入時長（小時 + 分鐘）
   - 備註（可選）
3. 儲存
```

#### 3.2 Time Entry 資料結構
```typescript
TimeEntry {
  id: string
  boardId: string          // 必填
  taskId?: string          // 可選（Time-only Board 沒有 task）
  duration: number         // 分鐘數
  startTime?: DateTime     // Timer 模式才有
  endTime?: DateTime       // Timer 模式才有
  type: 'timer' | 'manual'
  note?: string            // 備註
  createdAt: DateTime
}
```

#### 3.3 時間追蹤 UI

**Task-based Board**：
- 每個 Task 卡片上有 Timer 按鈕
- 顯示該 Task 的累計時間
- 可查看時間記錄清單

**Time-only Board**：
- Board 卡片上直接顯示大型 Timer
- 顯示本週 / 本月累計時間
- 快速手動新增時間入口

---

### 4. Dashboard（數據視覺化）

#### 4.1 首頁 Dashboard

**整體統計（頂部卡片）**
- 今日總學習時數
- 本週總學習時數
- 本月總學習時數
- 活躍 Boards 數量

#### 4.2 圖表區

**圖表 1：本週時間分佈（Bar Chart）**
- X 軸：週一～週日
- Y 軸：學習時數（小時）
- 可查看各 Board 的堆疊分佈

**圖表 2：各 Board 時間佔比（Donut Chart）**
- 顯示所選時間範圍內（本週/本月）各 Board 的時間比例
- 使用 Board 的顏色區分

**圖表 3：每日趨勢（Line Chart）**
- 最近 7 天 / 30 天的學習時數趨勢
- 可切換時間範圍

#### 4.3 時間篩選器
- 今天
- 本週
- 本月
- 自訂範圍

---

### 5. UI/UX 設計

#### 5.1 Layout 結構
```
┌─────────────────────────────────────┐
│  Sidebar                │  Main     │
│  - Dashboard            │           │
│  - Board 1              │  Content  │
│  - Board 2              │  Area     │
│  - ...                  │           │
│  - + 新增 Board         │           │
└─────────────────────────────────────┘
```

#### 5.2 顏色系統
- 每個 Board 可選顏色（用於圖表和 UI 區分）
- 預設色盤：8-10 種柔和色彩
- 支援深色模式（Phase 2）

#### 5.3 響應式設計（RWD）
- 桌面版：Sidebar + Main content
- 平板版：可收合 Sidebar
- 手機版：底部 Tab navigation

---
## 🚀 開發計畫

### Week 3（3/24 - 3/30）

**Day 1-2：專案基礎建設**
- [ ] Next.js 專案初始化
- [ ] TailwindCSS 設定
- [ ] tRPC v11 設定（App Router 版本）
- [ ] Prisma 設定 + 資料庫連線
- [ ] 執行 migration
- [ ] 基本 Layout（Sidebar + Main）

**Day 3-4：Board & List 管理**
- [ ] Board CRUD tRPC procedures
- [ ] Board 建立 UI（含模板選擇）
- [ ] List CRUD tRPC procedures
- [ ] Board/List 顯示 UI

**Day 5-6：Task 管理 + 拖拉功能**
- [ ] Task CRUD tRPC procedures
- [ ] Task 卡片 UI
- [ ] dnd-kit 整合
- [ ] 拖拉排序（List 和 Task）

**Day 7：Time-only Board**
- [ ] Time-only Board UI
- [ ] 簡易時間新增功能

### Week 4（3/31 - 4/6）

**Day 1-2：時間追蹤功能**
- [ ] Timer 元件（開始/暫停/停止）
- [ ] 手動新增時間表單
- [ ] TimeEntry tRPC procedures
- [ ] 整合到 Task 卡片

**Day 3：Dashboard 數據查詢**
- [ ] 時間統計 tRPC procedures（groupBy, aggregate）
- [ ] 各種時間範圍查詢（今日/本週/本月）

**Day 4-5：Dashboard 視覺化**
- [ ] Recharts 整合
- [ ] 本週時間分佈（Bar Chart）
- [ ] Board 時間佔比（Donut Chart）
- [ ] 每日趨勢（Line Chart）
- [ ] 統計卡片

**Day 6：UI/UX 優化**
- [ ] RWD 調整
- [ ] Loading states
- [ ] Error handling
- [ ] 空狀態（Empty states）

**Day 7：部署 + 文件**
- [ ] Vercel 部署
- [ ] 環境變數設定
- [ ] GitHub README
- [ ] Demo 資料準備

---

## 📊 Phase 2 功能（選做）

如果 Week 4 提前完成，或面試準備時間充裕，可加入：

### 進階功能
- [ ] NextAuth.js 認證系統（Google OAuth）
- [ ] Streak 連續學習天數
- [ ] 每日/每週目標設定
- [ ] Pomodoro Timer 整合
- [ ] 標籤系統（Task 可加標籤）
- [ ] 匯出資料（CSV / JSON）
- [ ] 深色模式
- [ ] 通知提醒（每日學習提醒）

### 效能優化
- [ ] React.memo 優化
- [ ] 資料庫索引優化
- [ ] 圖片壓縮（如果有上傳功能）
- [ ] Code splitting

---

## 🎯 面試展示重點

### 技術亮點
1. **全端能力 + 型別安全**
   - Next.js App Router + tRPC v11
   - PostgreSQL + Prisma ORM
   - **端到端型別安全**（前後端共用型別）
   - Zod schema 驗證

2. **複雜前端互動**
   - dnd-kit 拖拉排序
   - 即時 Timer 功能
   - Optimistic UI updates
   - tRPC 自動錯誤處理

3. **資料視覺化**
   - Recharts 整合
   - 多種圖表類型
   - Prisma 複雜查詢（groupBy, aggregate）
   - 時間範圍篩選

4. **使用者體驗**
   - Template 設計（降低使用門檻）
   - 雙模式時間追蹤（彈性使用）
   - RWD 響應式設計
   - Loading states + Error boundaries

### Demo 腳本建議
```
1. 開場：介紹專案動機
   "我同時在學英文、日文、刷 LeetCode、練滑雪，
    很難管理進度，所以做了這個系統"

2. 功能展示：
   - 建立 Board（展示模板功能）
   - 新增 Task 並拖拉
   - 使用 Timer 追蹤時間
   - 手動新增運動時間
   - Dashboard 查看統計

3. 技術深度：
   - 講解資料庫設計（Board type 的彈性）
   - 說明拖拉排序的實作挑戰
   - 展示程式碼（關鍵部分）
```

---

## 🔗 相關資源

### 技術文件
- [Next.js 14 文件](https://nextjs.org/docs)
- [tRPC 文件](https://trpc.io/docs)
- [Prisma 文件](https://www.prisma.io/docs)
- [Zod 文件](https://zod.dev/)
- [dnd-kit 文件](https://docs.dndkit.com/)
- [Recharts 文件](https://recharts.org/)

### 設計靈感
- [Athenify](https://athenify.io/)
- [Trello](https://trello.com/)
- [Notion](https://www.notion.so/)

---

## 📝 Notes

### 技術決策記錄

**為什麼選 Zustand 而不是 Redux？**
- MVP 不需要複雜狀態管理
- Zustand 更輕量，學習曲線低
- 未來可輕鬆升級到 Redux Toolkit

**為什麼先不做認證？**
- 認證系統需要 2-3 天開發時間
- MVP 優先展示核心功能（任務管理 + 時間追蹤）
- Phase 2 可加入，展示「迭代開發」能力

**為什麼用 tRPC 而不是 REST API？**
- 端到端型別安全（TypeScript 自動檢查參數和回傳值）
- 不需要手寫 API 文件（型別就是文件）
- 前端自動補全、自動錯誤檢查
- 2024-2025 Next.js 社群主流做法
- 曾在公司專案使用過tRPC，有實戰經驗
- 面試可講「跟上最新技術趨勢」並展示實際應用

---

**文件建立時間**：2026-03-22
**預計開發時間**：Week 3-4（2026/3/24 - 2026/4/6）
**文件版本**：v1.0
