# 🚀 快速設置指南 (Quick Setup Guide)

## ✅ 已完成的安裝步驟

你的 Learning Dashboard 專案已經成功安裝了官方的 tRPC + Next.js + Prisma starter template！

### 已安裝的技術棧：
- ✅ Next.js 15.3.8 (Pages Router)
- ✅ React 19.1.0
- ✅ TypeScript 5.9.2
- ✅ tRPC v11 (最新版，完整的端到端型別安全)
- ✅ Prisma 6.7.0 + PostgreSQL
- ✅ TailwindCSS 3.4.6
- ✅ React Query (Tanstack Query 5.80.3)
- ✅ Zod 4.2.1 (schema 驗證)
- ✅ Playwright (E2E 測試)
- ✅ ESLint + Prettier

### 專案結構：
```
learning-dashboard/
├── src/
│   ├── pages/              # Next.js 頁面
│   ├── server/             # tRPC 後端
│   │   ├── routers/        # API 路由
│   │   ├── context.ts
│   │   ├── prisma.ts
│   │   └── trpc.ts
│   ├── components/         # React 元件
│   └── utils/              # 工具函數
├── prisma/
│   ├── schema.prisma       # 資料庫 schema
│   └── migrations/         # 資料庫遷移
├── .env                    # 環境變數
└── package.json
```

## 📋 接下來要做的事

### 1. 設置資料庫 (必須)

目前 `.env` 檔案中的資料庫連線設定為：
```
DATABASE_URL=postgresql://postgres:@localhost:5432/learning-dashboard
```

**選項 A：使用本機 PostgreSQL**
```bash
# 確認 PostgreSQL 正在運行
# macOS (使用 Homebrew):
brew services start postgresql@14

# 建立資料庫
createdb learning-dashboard

# 執行 migration
npm run migrate-dev
```

**選項 B：使用 Supabase (推薦，免費)**
1. 前往 https://supabase.com/ 註冊
2. 建立新專案
3. 複製 Connection String
4. 更新 `.env` 檔案：
```bash
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres
```
5. 執行 migration：
```bash
npm run migrate-dev
```

### 2. 啟動開發伺服器

```bash
# 完整開發環境 (推薦)
# 包含：Next.js dev server + Prisma Studio + 自動 migration
npm run dx

# 或者只啟動 Next.js
npm run dev
```

成功後會看到：
- **Next.js App**: http://localhost:3000
- **Prisma Studio**: http://localhost:5555

### 3. 測試安裝是否成功

開啟瀏覽器訪問 http://localhost:3000，你應該會看到：
- tRPC + Prisma starter 的範例頁面
- 可以新增和查看 Posts (這是範例資料)

### 4. 開始開發 Learning Dashboard

現在你需要：

1. **更新 Prisma Schema** (`prisma/schema.prisma`)
   - 刪除 `Post` model
   - 新增 `Board`, `List`, `Task`, `TimeEntry` models
   - 參考 `CLAUDE.md` 中的資料庫設計

2. **建立新的 tRPC Routers** (`src/server/routers/`)
   - `board.router.ts` - Board CRUD
   - `list.router.ts` - List 管理
   - `task.router.ts` - Task 操作
   - `timeEntry.router.ts` - 時間追蹤
   - `analytics.router.ts` - Dashboard 統計

3. **建立 UI 元件**
   - Dashboard 頁面
   - Board 列表頁面
   - Task 卡片元件
   - Timer 元件

## 🎯 開發流程建議

### Week 3 (3/24 - 3/30)
- Day 1-2: 建立資料庫 schema 和 migrations
- Day 3-4: 實作 Board 和 List 的 tRPC routers
- Day 5-6: 實作 Task 管理和拖拉功能
- Day 7: 實作 Time-only Board

### Week 4 (3/31 - 4/6)
- Day 1-2: 時間追蹤功能 (Timer + Manual Entry)
- Day 3: Dashboard 統計查詢 (Prisma aggregations)
- Day 4-5: 圖表視覺化 (需要安裝 Recharts)
- Day 6: UI/UX 優化和 RWD
- Day 7: 部署到 Vercel

## 📦 額外需要安裝的套件

根據產品規格書，你還需要：

```bash
# 拖拉功能
npm install @dnd-kit/core @dnd-kit/sortable

# 圖表
npm install recharts

# 狀態管理
npm install zustand

# 表單處理
npm install react-hook-form @hookform/resolvers

# UI 元件庫 (shadcn/ui)
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card dialog input select
```

## 🔧 常用指令

```bash
# 開發
npm run dev              # 啟動 Next.js dev server
npm run dx               # 完整開發環境 (推薦)

# 資料庫
npm run prisma-studio    # 開啟資料庫 GUI
npm run migrate-dev      # 建立新的 migration
npm run db-seed          # 填入範例資料
npm run generate         # 重新生成 Prisma Client

# 建置和部署
npm run build            # 建置生產版本
npm run start            # 啟動生產伺服器

# 測試和代碼品質
npm run lint             # 檢查代碼
npm run test-e2e         # 執行 E2E 測試
npm run typecheck        # TypeScript 型別檢查
```

## 🐛 常見問題

### 問題 1: Database connection error
**解決方法：** 檢查 `.env` 中的 `DATABASE_URL` 是否正確，確認資料庫正在運行。

### 問題 2: Prisma Client 錯誤
**解決方法：** 執行 `npm run generate` 重新生成 Prisma Client。

### 問題 3: Port 3000 already in use
**解決方法：** 關閉佔用 3000 port 的程序，或修改 `package.json` 中的 dev script：
```json
"dev": "next dev -p 3001"
```

### 問題 4: Node version 警告
**解決方法：** 專案建議使用 Node.js 20+，但 Node 18 也可以運行。如果遇到問題，請升級 Node.js：
```bash
# 使用 nvm
nvm install 20
nvm use 20
```

## 📚 參考資源

- **專案文檔：**
  - [產品規格書](./03-Learning-Dashboard-產品規格書.md)
  - [設計需求](./05-設計需求文件-Design-Brief.md)
  - [CLAUDE.md](./CLAUDE.md) - 技術架構指南

- **技術文件：**
  - [tRPC Docs](https://trpc.io/docs)
  - [Prisma Docs](https://www.prisma.io/docs)
  - [Next.js Docs](https://nextjs.org/docs)

## 🎉 你現在可以開始開發了！

執行以下指令開始：
```bash
npm run dx
```

然後在瀏覽器打開 http://localhost:3000

祝開發順利！🚀
