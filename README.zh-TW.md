# Learning Dashboard

[English](./README.en.md)

![Learning Dashboard OG image](./public/og-image.png)

Learning Dashboard 是一個以「學習投入可視化」為核心的個人成長管理平台。  
你可以用看板管理學習項目、用計時器或手動記錄累積時間，並透過儀表板、好友排行與社交互動，把抽象的努力轉成可追蹤的成長軌跡。

## 專案現況

目前專案已包含以下主要能力：

- 學習看板：支援 `TASK_BASED` 與 `TIME_ONLY` 兩種 board 類型
- 任務管理：列表、卡片、拖曳排序、欄位重排
- 時間追蹤：計時器、手動補登、任務時間累積
- 數據儀表板：摘要統計、每日趨勢、月曆熱度、board 分布
- 社交功能：好友邀請、好友列表、待處理邀請
- 排行榜：依學習時數與連續天數比較好友表現
- 好友統計頁：查看好友本週學習、連續天數與 board 分布
- 推播通知：Web Push 訂閱與裝置狀態管理
- PWA 基礎能力：`manifest.json`、`sw.js`、app icons
- 多登入方式：Google、GitHub、Credentials

## Tech Stack

- Framework: Next.js 15 App Router + React 19 + TypeScript
- API: tRPC
- Database: PostgreSQL + Prisma ORM
- Auth: NextAuth.js
- UI: Tailwind CSS + Base UI + 自訂元件
- Drag and Drop: `@dnd-kit`
- Charts: Recharts
- Forms and Validation: React Hook Form + Zod
- Notifications: Web Push
- Testing: Vitest + Playwright
- Deployment: Docker + Google Cloud Build + Cloud Run

## 主要頁面

- `/dashboard`：個人學習儀表板
- `/board/[boardId]`：看板詳情，支援任務型與純時間型 board
- `/timer`：任務計時與手動登錄
- `/friends`：好友列表與邀請管理
- `/friends/[userId]`：好友學習統計
- `/ranking`：好友排行榜
- `/settings`：個人資料與通知設定
- `/invite/[token]`：好友邀請接受頁

## 快速開始

### 1. 安裝依賴

```bash
pnpm install
```

### 2. 設定環境變數

可先複製 `.env.example` 到 `.env`，再依需求填值：

```env
DATABASE_URL=postgresql://postgres:@localhost:5432/learning-dashboard

NEXTAUTH_SECRET=your-secret
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_EMAIL=
NEXT_PUBLIC_VAPID_PUBLIC_KEY=

CRON_SECRET=
```

說明：

- `NEXT_PUBLIC_SITE_URL` 用於 `metadataBase`、分享圖與其他需要絕對網址的 metadata
- `NEXTAUTH_URL` 為 NextAuth callback 基底網址
- Push 通知相關欄位可在需要啟用 Web Push 時再補齊

### 3. 初始化資料庫

```bash
pnpm migrate-dev
pnpm db-seed
```

### 4. 啟動開發環境

```bash
pnpm dev
```

如果你想連同 migration 與 seed 一起跑，也可以使用：

```bash
pnpm dx
```

開啟 [http://localhost:3000](http://localhost:3000)

## 常用指令

| Command | Description |
| --- | --- |
| `pnpm dev` | 啟動 Next.js 開發伺服器 |
| `pnpm dx` | migration + seed + dev 一起啟動 |
| `pnpm build` | 建立 production build |
| `pnpm start` | 啟動 production server |
| `pnpm lint` | 執行 ESLint |
| `pnpm typecheck` | 執行 TypeScript 檢查 |
| `pnpm test-unit` | 執行 Vitest |
| `pnpm test-e2e` | 執行 Playwright |
| `pnpm migrate-dev` | Prisma 開發 migration |
| `pnpm migrate` | 套用 production migrations |
| `pnpm db-seed` | 匯入 seed 資料 |
| `pnpm prisma-studio` | 開啟 Prisma Studio |

## 資料模型概要

核心資料表如下：

- `User`：使用者、登入資訊、時區、推播裝置
- `Board`：學習看板，分為任務型與純時間型
- `List`：看板欄位
- `Task`：任務卡片
- `TimeEntry`：學習時間紀錄
- `Friendship`：好友關係與待處理邀請
- `FriendInvite`：好友邀請 token
- `PushSubscription`：Web Push 訂閱資訊

Prisma schema 位於 [prisma/schema.prisma](/Users/yenyu/Desktop/coding-learning/learning-dashboard/prisma/schema.prisma)。

## 專案結構

```text
src/
  app/
    (app)/          已登入後的主要功能頁
    (auth)/         登入與註冊流程
    invite/         好友邀請接受頁
  components/
    board/          看板與拖曳元件
    dashboard/      統計與圖表
    friends/        好友與邀請 UI
    ranking/        排行榜 UI
    settings/       個人設定與通知
    ui/             基礎 UI 元件
  server/
    routers/        tRPC routers
    auth.ts         NextAuth 設定
  hooks/
  lib/
prisma/
public/
```

## 部署

專案目前以 Docker 打包，並透過 Google Cloud Build 部署到 Cloud Run。

相關檔案：

- [Dockerfile](/Users/yenyu/Desktop/coding-learning/learning-dashboard/Dockerfile)
- [cloudbuild.yaml](/Users/yenyu/Desktop/coding-learning/learning-dashboard/cloudbuild.yaml)

部署時請特別確認以下變數有帶入：

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- `NEXTAUTH_URL`
- `DATABASE_URL`
- `NEXTAUTH_SECRET`

其中 `NEXT_PUBLIC_SITE_URL` 需要在 build 階段就存在，因為它會被用在 Next.js metadata 中。

## 備註

- 目前根路由 `/` 會直接導向 `/dashboard`
- 專案使用 `output: 'standalone'`，適合容器化部署
- `src/server/env.ts` 會在非 build 階段驗證必要環境變數
