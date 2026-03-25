# ✅ Supabase 整合完成

## 已完成的設置

### 1. 安裝套件
- ✅ `@supabase/supabase-js` - Supabase JavaScript 客戶端
- ✅ `@supabase/ssr` - Supabase Server-Side Rendering 工具

### 2. 創建 Supabase 客戶端工具

已創建以下檔案：

#### `src/utils/supabase/client.ts`
- 瀏覽器端的 Supabase 客戶端
- 用於 Client Components 和客戶端操作

#### `src/utils/supabase/server.ts`
- 伺服器端的 Supabase 客戶端
- 用於 Server Components 和 API Routes
- 處理 cookie 管理

#### `src/utils/supabase/middleware.ts`
- Next.js middleware 用的 Supabase 客戶端
- 自動刷新使用者 session
- 維持登入狀態

### 3. 設置 Middleware

已創建 `middleware.ts`：
- 自動在每個請求時更新 Supabase session
- 防止使用者被意外登出
- 處理 cookie 同步

### 4. 環境變數設置

已在 `.env` 和 `.env.example` 中設置：
```bash
NEXT_PUBLIC_SUPABASE_URL=https://disoycpfahptjvkttmza.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_zQzvxfFRBILfq7J1VHthyA_KOgzBIlp
```

### 5. 資料庫設置

#### Prisma Schema 已更新
- ✅ Board model (任務板)
- ✅ List model (任務列表)
- ✅ Task model (任務)
- ✅ TimeEntry model (時間記錄)
- ✅ BoardType enum (TASK_BASED / TIME_ONLY)

#### Migration 已執行
- ✅ 資料庫結構已創建
- ✅ 索引已建立
- ✅ 關聯設置完成

#### Seed 資料已填充
- ✅ 3 個範例 Board（英文學習、LeetCode、滑雪訓練）
- ✅ 範例 Lists 和 Tasks
- ✅ 2 筆時間記錄

### 6. Supabase Agent Skills
- ✅ 安裝 Postgres 最佳實踐技能
- ✅ 可用於 Claude Code 優化資料庫查詢和 schema 設計

## 如何使用

### 在 Client Component 中使用
```typescript
'use client';
import { createClient } from '@/utils/supabase/client';

export default function MyComponent() {
  const supabase = createClient();

  // 使用 Supabase 進行操作
  // 例如：認證、查詢等
}
```

### 在 Server Component 中使用
```typescript
import { createClient } from '@/utils/supabase/server';

export default async function MyPage() {
  const supabase = await createClient();

  // 伺服器端操作
  const { data: { user } } = await supabase.auth.getUser();
}
```

### 在 API Route 中使用
```typescript
import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();

  // API 操作
  return NextResponse.json({ data: [] });
}
```

## 目前專案狀態

### 資料庫連線
目前使用：**本地 PostgreSQL**
```
DATABASE_URL=postgresql://postgres:@localhost:5432/learning-dashboard
```

### Supabase 連線
已設置 Supabase 環境變數，可用於：
- 使用者認證（Auth）
- Realtime 訂閱
- Storage（檔案儲存）
- Edge Functions

### 資料庫內容
執行 `npm run prisma-studio` 可以查看：
- 3 個 Board
- 多個 List 和 Task
- 2 筆 TimeEntry

## 下一步建議

### Phase 1: 基礎功能（不需要認證）
1. 創建 Board CRUD 的 tRPC routers
2. 實作 List 和 Task 管理
3. 時間追蹤功能

### Phase 2: 加入認證（使用 Supabase Auth）
1. 設置 Supabase Auth UI
2. 實作登入/註冊流程
3. 為每個使用者隔離資料
4. 更新 Prisma schema 加入 User model

## 常用指令

```bash
# 查看資料庫（GUI）
npm run prisma-studio

# 執行 migration
npm run migrate-dev

# 重新填充範例資料
npm run db-seed

# 重置資料庫（清空所有資料並重新 migrate + seed）
npm run db-reset

# 啟動開發伺服器
npm run dev
```

## 重要檔案位置

```
learning-dashboard/
├── src/utils/supabase/
│   ├── client.ts          # 客戶端 Supabase 客戶端
│   ├── server.ts          # 伺服器端 Supabase 客戶端
│   └── middleware.ts      # Middleware 用客戶端
├── middleware.ts          # Next.js middleware
├── prisma/
│   ├── schema.prisma      # 資料庫 schema
│   ├── seed.ts            # 範例資料腳本
│   └── migrations/        # 資料庫遷移記錄
└── .env                   # 環境變數
```

## Seed File 說明

`prisma/seed.ts` 的作用：

1. **開發測試** - 提供測試資料，不用手動新增
2. **快速驗證** - 確認功能運作正常
3. **Demo 展示** - 面試或展示時有完整的範例資料

每次執行 `npm run db-seed` 會新增：
- 英文學習 Board（包含 3 個 Lists 和多個 Tasks）
- LeetCode Board（包含 To Do / In Progress / Done 三個 Lists）
- 滑雪訓練 Board（TIME_ONLY 類型，無 Tasks）
- 2 筆時間記錄範例

**注意：** 多次執行 seed 會重複新增資料。如要清空重來，使用 `npm run db-reset`。

## Troubleshooting

### 問題：Prisma Client 錯誤
**解決：** `npm run generate` 重新生成 Prisma Client

### 問題：資料庫連線失敗
**解決：** 檢查 `.env` 中的 `DATABASE_URL` 是否正確

### 問題：Middleware 錯誤
**解決：** 確認 Supabase 環境變數已設置，且格式正確

---

**設置完成時間：** 2026-03-24
**下一步：** 開始實作 tRPC routers 和 UI 元件
