# Phase 3 社交功能 — 技術實現流程文件

> 日期：2026-04-07  
> 分支：`feat/phase3-social-features-impl`  
> 狀態：約 85–90% 完成

---

## 目錄

1. [功能總覽](#1-功能總覽)
2. [系統架構](#2-系統架構)
3. [資料庫設計](#3-資料庫設計)
4. [後端 API（tRPC Routers）](#4-後端-apitrpc-routers)
5. [前端頁面與元件](#5-前端頁面與元件)
6. [PWA 與推播通知](#6-pwa-與推播通知)
7. [定時任務（Cron）](#7-定時任務cron)
8. [資料流圖解](#8-資料流圖解)
9. [環境變數](#9-環境變數)
10. [新增依賴](#10-新增依賴)
11. [實作進度與待辦事項](#11-實作進度與待辦事項)
12. [已知問題與設計權衡](#12-已知問題與設計權衡)

---

## 1. 功能總覽

Phase 3 為 Learning Dashboard 加入四大社交功能模組：

| 模組 | 說明 | 核心價值 |
|------|------|----------|
| **好友系統** | 一次性邀請連結、雙向確認、好友管理 | 建立社交連結 |
| **排行榜** | 學習時數 / 連續天數 / 完成任務排名 | 良性競爭動機 |
| **好友統計頁** | 查看好友的聚合學習數據（不含任務細節） | 相互激勵、隱私保護 |
| **推播通知** | 里程碑通知、排名變動、每日提醒 | 持續參與度 |

### 前置條件

- Phase 2 身份驗證已完成（NextAuth.js + Google OAuth）
- 現有 User、Board、TimeEntry、Task、List 模型
- 部署於 Google Cloud Run

---

## 2. 系統架構

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js App Router)         │
│                                                         │
│  /friends          /ranking          /friends/[userId]   │
│  /invite/[token]   /settings                            │
│                                                         │
│  ┌──────────────────────────────────────────────┐       │
│  │  usePushSubscription hook                     │       │
│  │  → Notification.requestPermission()           │       │
│  │  → PushManager.subscribe()                    │       │
│  └──────────────────────────────────────────────┘       │
└──────────────┬──────────────────────────────────────────┘
               │ tRPC (React Query)
               ▼
┌─────────────────────────────────────────────────────────┐
│                 Backend (tRPC Routers)                   │
│                                                         │
│  friendRouter        rankingRouter                      │
│  friendStatsRouter   notificationRouter                 │
│                                                         │
│  ┌──────────────────────────────────────────────┐       │
│  │  notification.service.ts                      │       │
│  │  → sendPushToUser() / sendPushToUsers()       │       │
│  │  → checkMilestoneAndNotify()                  │       │
│  │  → checkRankingChangeAndNotify()              │       │
│  └──────────────────────────────────────────────┘       │
└──────────────┬──────────────────────────────────────────┘
               │ Prisma ORM
               ▼
┌─────────────────────────────────────────────────────────┐
│                 PostgreSQL Database                      │
│                                                         │
│  新增：Friendship / FriendInvite / PushSubscription     │
│  擴充：User（新增 relation fields）                      │
└─────────────────────────────────────────────────────────┘

外部服務：
  • Browser Push Service（Google FCM / Mozilla Push）
  • Google Cloud Scheduler → POST /api/cron/daily-reminder
```

---

## 3. 資料庫設計

### 3.1 新增 Enum

```prisma
enum FriendshipStatus {
  PENDING
  ACCEPTED
  DECLINED
}
```

### 3.2 新增 Models

#### Friendship（好友關係）

```prisma
model Friendship {
  id          String           @id @default(uuid())
  requesterId String
  requester   User             @relation("SentRequests", fields: [requesterId], references: [id], onDelete: Cascade)
  addresseeId String
  addressee   User             @relation("ReceivedRequests", fields: [addresseeId], references: [id], onDelete: Cascade)
  status      FriendshipStatus @default(PENDING)
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt

  @@unique([requesterId, addresseeId])  // 防止重複建立
  @@index([addresseeId])                // 加速「收到的邀請」查詢
}
```

**設計要點：**
- 雙向查詢：查好友時用 `OR [requesterId = me, addresseeId = me]`
- `@@unique` 確保 A→B 只能存在一筆，但 B→A 也可能存在（程式層面用 `findExistingFriendship()` 做雙向檢查）
- `onDelete: Cascade`：用戶刪除帳號時自動清理

#### FriendInvite（邀請連結）

```prisma
model FriendInvite {
  id        String    @id @default(uuid())
  token     String    @unique @default(uuid())  // 連結中的唯一識別碼
  inviterId String
  inviter   User      @relation(fields: [inviterId], references: [id], onDelete: Cascade)
  usedById  String?   // 使用者 ID（null = 未使用）
  usedAt    DateTime? // 使用時間
  expiresAt DateTime  // 7 天後過期
  createdAt DateTime  @default(now())

  @@index([token])    // 加速 token 查詢
}
```

**設計要點：**
- 一次性使用：`usedById` 非 null 即代表已被使用
- Token 使用 UUID，由 Prisma `@default(uuid())` 自動產生
- 7 天效期：`expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000`

#### PushSubscription（推播訂閱）

```prisma
model PushSubscription {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  endpoint  String   @db.Text   // Push Service endpoint URL（可能很長）
  p256dh    String              // 瀏覽器公鑰
  auth      String              // 認證金鑰
  enabled   Boolean  @default(true)
  createdAt DateTime @default(now())

  @@unique([userId, endpoint])  // 同裝置不重複訂閱
}
```

**設計要點：**
- 一個用戶可有多個訂閱（不同裝置 / 瀏覽器）
- `enabled` 控制是否接收通知，toggle 時不刪除記錄（方便重新啟用）
- `endpoint` 用 `@db.Text` 因為 URL 可能超過 VARCHAR 預設長度

### 3.3 User Model 擴充

```prisma
model User {
  // ... 現有 fields ...
  sentRequests      Friendship[]       @relation("SentRequests")
  receivedRequests  Friendship[]       @relation("ReceivedRequests")
  friendInvites     FriendInvite[]
  pushSubscriptions PushSubscription[]
}
```

### 3.4 Migration

Migration 檔案：`prisma/migrations/20260407054225_add_social_features/migration.sql`

```bash
# 已執行並 commit
npx prisma migrate dev --name add_social_features
```

---

## 4. 後端 API（tRPC Routers）

### 4.1 friendRouter（`src/server/routers/friend.ts`）

負責好友系統的所有操作。

| 程序 | 類型 | 說明 | 輸入 |
|------|------|------|------|
| `invite.create` | mutation | 產生邀請連結 | — |
| `invite.validate` | query | 驗證連結是否有效 | `{ token }` |
| `invite.use` | mutation | 使用連結（接受/拒絕） | `{ token, action: 'accept'│'decline' }` |
| `list` | query | 取得已接受好友列表 | — |
| `pending` | query | 取得待處理邀請 | — |
| `remove` | mutation | 移除好友 | `{ friendshipId }` |

**核心輔助函式：**

```typescript
// 雙向查找現有 friendship
async function findExistingFriendship(userA: string, userB: string)

// 取得所有已接受好友的 ID 列表（供 ranking 等其他 router 使用）
export async function getAcceptedFriendIds(userId: string): Promise<string[]>
```

**invite.validate 回傳的錯誤碼：**

| reason | 含義 |
|--------|------|
| `not_found` | Token 不存在 |
| `expired` | 連結已過期（超過 7 天） |
| `used` | 連結已被使用 |
| `self` | 不能加自己為好友 |
| `already_friends` | 已經是好友或有待處理邀請 |

**invite.use 的交易流程：**

```
prisma.$transaction([
  1. 建立或更新 Friendship（ACCEPTED 或 DECLINED）
  2. 標記 FriendInvite 為已使用（設定 usedById + usedAt）
])
```

### 4.2 rankingRouter（`src/server/routers/ranking.ts`）

負責排行榜計算。不使用快取表，即時查詢計算。

| 程序 | 類型 | 說明 | 輸入 |
|------|------|------|------|
| `leaderboard` | query | 取得排行榜 | `{ dimension, timeRange }` |
| `myStats` | query | 取得自己的各維度統計 | — |

**三個排名維度的計算方式：**

**學習時數（hours）：**
```
1. getAcceptedFriendIds(userId) → 取得好友 ID
2. timeEntry.groupBy({ by: ['boardId'] }) → 按看板聚合時間
3. 透過 board.user_id 對應回用戶 → 加總每位用戶的總分鐘數
4. 降序排列 + dense ranking
```

**連續天數（streak）：**
```
1. 取出用戶所有 timeEntry 的 createdAt
2. 轉為日期集合 Set（YYYY-M-D 格式）
3. 從今天往前逐日檢查：有記錄 → streak++，無記錄 → 停止
```

**完成任務數（tasks）：**
```
1. 計算 list.name 為 Done/Complete/Completed 的任務數量
2. 過濾 updatedAt >= 時間範圍起始
```

**排名算法（Dense Ranking）：**
```
排序後，若當前值 < 前一個值 → rank = index + 1，否則沿用前一個 rank
例：[100, 80, 80, 50] → rank [1, 2, 2, 4]
```

### 4.3 friendStatsRouter（`src/server/routers/friendStats.ts`）

負責好友的學習統計數據展示，所有查詢都會先驗證好友關係。

| 程序 | 類型 | 說明 | 輸入 |
|------|------|------|------|
| `getSummary` | query | 週時數 / streak / 任務數 | `{ friendId }` |
| `getWeeklyChart` | query | 一週七天的每日學習分鐘數 | `{ friendId }` |
| `getBoardBreakdown` | query | 各看板的時間分布 | `{ friendId }` |

**存取控制：**
```typescript
async function assertIsFriend(viewerId: string, friendId: string) {
  // 檢查 Friendship 是否為 ACCEPTED（雙向）
  // 不是好友 → throw TRPCError({ code: 'FORBIDDEN' })
}
```

**隱私設計：只回傳聚合數據**
- 看得到：週學習時數、連續天數、完成任務數、看板名稱 + 時間
- 看不到：具體任務內容、List 名稱、任務描述

### 4.4 notificationRouter（`src/server/routers/notification.ts`）

負責推播訂閱管理。

| 程序 | 類型 | 說明 | 輸入 |
|------|------|------|------|
| `subscribe` | mutation | 儲存瀏覽器推播訂閱 | `{ endpoint, p256dh, auth }` |
| `unsubscribe` | mutation | 移除特定裝置訂閱 | `{ endpoint }` |
| `toggle` | mutation | 啟用/停用所有裝置通知 | `{ enabled }` |
| `status` | query | 查詢通知狀態 | — |

### 4.5 notification.service.ts（推播服務層）

獨立的服務檔案，處理推播的實際發送邏輯。

**核心函式：**

```typescript
// 向單一用戶的所有啟用裝置發送推播
sendPushToUser(userId, { title, body, url? })

// 向多個用戶發送推播
sendPushToUsers(userIds[], payload)

// 里程碑檢查：用戶本週累計時數是否跨越 5hr/10hr/20hr/50hr
checkMilestoneAndNotify(userId, userName)

// 排名變動檢查：本週時數排名是否超越某位好友
checkRankingChangeAndNotify(userId, userName)
```

**里程碑門檻判斷邏輯：**
```
totalMinutes >= threshold && totalMinutes < threshold + 60
```
意即：跨越門檻後的 60 分鐘內才觸發通知（避免每次新增時間都重複通知）。

**無效訂閱自動清理：**
當 Push Service 回傳 404 或 410 時，自動從資料庫刪除該筆 PushSubscription。

### 4.6 Router 註冊

`src/server/routers/_app.ts` 中註冊所有新 router：

```typescript
export const appRouter = router({
  friend: friendRouter,
  ranking: rankingRouter,
  friendStats: friendStatsRouter,
  notification: notificationRouter,
  // ... 其他既有 routers
});
```

---

## 5. 前端頁面與元件

### 5.1 頁面一覽

| 路由 | 檔案 | 認證 | 說明 |
|------|------|------|------|
| `/invite/[token]` | `src/app/invite/[token]/page.tsx` | 公開（未登入會導向登入） | 邀請落地頁 |
| `/friends` | `src/app/(app)/friends/page.tsx` | 需登入 | 好友列表 + 待處理邀請 |
| `/friends/[userId]` | `src/app/(app)/friends/[userId]/page.tsx` | 需登入 + 好友關係 | 好友學習統計 |
| `/ranking` | `src/app/(app)/ranking/page.tsx` | 需登入 | 排行榜 |

### 5.2 邀請落地頁（`/invite/[token]`）

**流程：**
```
用戶開啟連結
  → 未登入？→ 導向 /api/auth/signin?callbackUrl=/invite/{token}
  → 已登入？→ 呼叫 friend.invite.validate
    → valid: true  → 顯示邀請者頭像 + 名字 + 接受/拒絕按鈕
    → valid: false → 顯示對應錯誤訊息（過期、已使用、自己邀自己等）
  → 點擊接受 → friend.invite.use({ action: 'accept' }) → 導向 /friends
  → 點擊拒絕 → friend.invite.use({ action: 'decline' }) → 導向 /dashboard
```

### 5.3 好友列表頁（`/friends`）

**結構：**
- Header：標題 + 「Invite Friend」按鈕（觸發 InviteLinkDialog）
- Tabs：`All Friends` / `Pending (n)`
- All Friends tab：用 `FriendCard` 渲染每位好友
- Pending tab：用 `PendingInviteCard` 渲染每筆待處理邀請

### 5.4 好友統計頁（`/friends/[userId]`）

**展示內容：**
- 好友頭像 + 名字
- 三張統計卡片：本週學習分鐘數、連續天數（🔥）、完成任務數
- 長條圖：一週七天每日學習時間（使用 Recharts `BarChart`）
- 圓餅圖：看板時間分布（使用 Recharts `PieChart`）

### 5.5 排行榜頁（`/ranking`）

**功能：**
- 維度切換：Study Hours / Streak / Tasks Done
- 時間範圍切換：This Week / This Month（streak 維度不顯示）
- 排名表格：每列顯示排名 #、頭像、名字、數值
- 自己的列高亮（紅色背景）
- 點擊列：導向 `/friends/{userId}` 或 `/dashboard`（自己）

### 5.6 元件列表

| 元件 | 檔案路徑 | 說明 |
|------|----------|------|
| `FriendCard` | `src/components/friends/FriendCard.tsx` | 好友列表中的單一好友卡片 |
| `PendingInviteCard` | `src/components/friends/PendingInviteCard.tsx` | 待處理邀請卡片 |
| `InviteLinkDialog` | `src/components/friends/InviteLinkDialog.tsx` | 產生 + 複製邀請連結的彈窗 |
| `RankRow` | `src/components/ranking/RankRow.tsx` | 排行榜中的單一列 |
| `NotificationToggle` | `src/components/settings/NotificationToggle.tsx` | 設定頁的推播開關 |

### 5.7 導航整合

Sidebar（`src/components/layout/Sidebar.tsx`）新增兩個導航項目：
- `/friends`（好友）
- `/ranking`（排行榜）

---

## 6. PWA 與推播通知

### 6.1 整體架構

```
Browser (Frontend)
  │
  ├─ usePushSubscription hook
  │   → Notification.requestPermission()
  │   → PushManager.subscribe({ applicationServerKey: VAPID_PUBLIC_KEY })
  │   → 取得 PushSubscription { endpoint, keys: { p256dh, auth } }
  │   → 呼叫 notification.subscribe mutation 存到 DB
  │
  ├─ Service Worker (custom-sw.js)
  │   → 監聽 'push' event → self.registration.showNotification()
  │   → 監聽 'notificationclick' → clients.openWindow() / focus()
  │
  └─ manifest.json
      → name, icons, display: standalone, theme_color
```

### 6.2 PWA 設定

**manifest.json（`public/manifest.json`）：**
```json
{
  "name": "Learning Dashboard",
  "short_name": "LearnDash",
  "display": "standalone",
  "start_url": "/dashboard",
  "theme_color": "#E42313",
  "background_color": "#FAFAFA",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192" },
    { "src": "/icon-512.png", "sizes": "512x512" }
  ]
}
```

**next.config.ts 整合 next-pwa：**
```typescript
import withPWAInit from 'next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
});

export default withPWA(nextConfig);
```

### 6.3 Service Worker（`public/custom-sw.js`）

處理兩個事件：
1. **push**：解析 payload JSON，顯示系統通知
2. **notificationclick**：點擊通知後，聚焦已開啟的視窗或開新視窗

### 6.4 前端 Hook：usePushSubscription

`src/hooks/usePushSubscription.ts` 封裝所有推播訂閱邏輯：

```typescript
export function usePushSubscription() {
  return {
    permission,    // NotificationPermission ('default'|'granted'|'denied')
    isEnabled,     // 是否已啟用
    deviceCount,   // 已訂閱裝置數
    isLoading,
    subscribe(),   // 請求權限 + 註冊訂閱
    unsubscribe(), // 取消訂閱
    toggle(enabled), // 啟用/停用
  };
}
```

### 6.5 三種通知類型

| 類型 | 觸發時機 | 頻率限制 | Payload 範例 |
|------|----------|----------|-------------|
| 好友里程碑 | 即時（timeEntry 建立後） | 跨越門檻（5/10/20/50hr）時才觸發 | `"Alice just hit 10 hours this week!"` |
| 排名變動 | 即時（timeEntry 建立後） | 排名實際超越時才觸發 | `"Alice passed you! You're now ranked #3"` |
| 每日提醒 | Cloud Scheduler（每日 20:00 台灣時間） | 每天最多一次 | `"You haven't started studying today!"` |

### 6.6 VAPID 金鑰

```bash
# 產生金鑰對
npx web-push generate-vapid-keys
```

前端使用 `NEXT_PUBLIC_VAPID_PUBLIC_KEY`，後端使用 `VAPID_PRIVATE_KEY` + `VAPID_EMAIL`。

---

## 7. 定時任務（Cron）

### API Endpoint：`/api/cron/daily-reminder`

`src/app/api/cron/daily-reminder/route.ts`

**流程：**
```
Cloud Scheduler (0 12 * * * UTC = 20:00 台灣時間)
  → POST /api/cron/daily-reminder
  → 驗證 Authorization: Bearer {CRON_SECRET}
  → 查詢所有有啟用 PushSubscription 的用戶
  → 過濾出今天沒有任何 timeEntry 的用戶
  → 向這些用戶發送推播：「今天還沒有開始學習喔！」
  → 回傳 { sent: n }
```

**安全機制：**
- 使用 `CRON_SECRET` 環境變數做 Bearer token 驗證
- 防止外部未授權呼叫

---

## 8. 資料流圖解

### 8.1 好友邀請流程

```
User A                        Backend                       User B
  │                              │                              │
  ├─ invite.create ─────────────►│                              │
  │◄─── { token } ──────────────┤                              │
  │                              │                              │
  ├─ 複製連結給 B ──────────────────────────────────────────────►│
  │                              │                              │
  │                              │◄──── invite.validate({ token }) ──┤
  │                              ├──── { valid, inviterName } ──────►│
  │                              │                              │
  │                              │◄──── invite.use({ token,    ──┤
  │                              │        action: 'accept' })    │
  │                              ├─ $transaction:                │
  │                              │   1. Friendship.create(ACCEPTED)
  │                              │   2. FriendInvite.update(usedBy)
  │                              ├──── { status: 'ACCEPTED' } ──────►│
```

### 8.2 排行榜查詢流程

```
Frontend                        rankingRouter
  │                              │
  ├─ leaderboard({ dimension:   │
  │    'hours', timeRange:       │
  │    'week' }) ───────────────►│
  │                              ├─ getAcceptedFriendIds(userId)
  │                              │   → [friendA, friendB, ...]
  │                              │
  │                              ├─ timeEntry.groupBy({ by: ['boardId'] })
  │                              │   where: user_id IN allUserIds
  │                              │         AND createdAt >= weekStart
  │                              │
  │                              ├─ board → user_id 對應
  │                              ├─ 加總每位用戶的分鐘數
  │                              ├─ 降序排列 + dense ranking
  │                              │
  │◄──── [{ rank, userId, name, │
  │         image, value }] ─────┤
```

### 8.3 推播通知觸發流程

```
User A 建立 TimeEntry
  │
  ├─ timeEntry.create mutation（現有 router）
  │
  ├─ [待接線] checkMilestoneAndNotify(userId, userName)
  │   │
  │   ├─ 本週累計分鐘數 >= 門檻 && < 門檻 + 60？
  │   │   └─ YES → getAcceptedFriendIds → sendPushToUsers
  │   │            → 各好友收到「Alice just hit 10 hours!」
  │   └─ NO → 不做任何事
  │
  ├─ [待接線] checkRankingChangeAndNotify(userId, userName)
  │   │
  │   ├─ 重新計算本週時數排名
  │   ├─ 是否超越了某位好友？（差距 < 60 分鐘 && 本用戶分數較高）
  │   │   └─ YES → sendPushToUser(被超越者)
  │   │            → 被超越者收到「Alice passed you!」
  │   └─ NO → 不做任何事
```

---

## 9. 環境變數

| 變數名 | 用途 | 範圍 |
|--------|------|------|
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | 前端 PushManager.subscribe 用的 VAPID 公鑰 | 前端 + 後端 |
| `VAPID_PRIVATE_KEY` | web-push 簽章用的 VAPID 私鑰 | 後端 |
| `VAPID_EMAIL` | VAPID 識別用的 mailto URI | 後端 |
| `CRON_SECRET` | 保護 cron endpoint 的 Bearer token | 後端 |

---

## 10. 新增依賴

| 套件 | 版本 | 用途 |
|------|------|------|
| `web-push` | ^3.6.7 | 伺服端 Web Push 協定實作 |
| `@types/web-push` | ^3.6.4 | TypeScript 型別定義 |
| `next-pwa` | ^5.6.0 | Next.js PWA 支援 + Service Worker 生成 |

---

## 11. 實作進度與待辦事項

### 已完成 ✅

- [x] 資料庫 schema（Friendship、FriendInvite、PushSubscription）
- [x] Migration 已建立並 commit
- [x] friendRouter（invite CRUD、list、pending、remove）
- [x] rankingRouter（leaderboard 三維度、myStats）
- [x] friendStatsRouter（summary、weeklyChart、boardBreakdown）
- [x] notificationRouter（subscribe、unsubscribe、toggle、status）
- [x] notification.service.ts（sendPush、checkMilestone、checkRanking）
- [x] 邀請落地頁（`/invite/[token]`）
- [x] 好友列表頁（`/friends`）
- [x] 好友統計頁（`/friends/[userId]`）
- [x] 排行榜頁（`/ranking`）
- [x] 所有元件（FriendCard、PendingInviteCard、InviteLinkDialog、RankRow、NotificationToggle）
- [x] usePushSubscription hook
- [x] Service Worker + manifest.json
- [x] next-pwa 設定
- [x] Sidebar 導航連結
- [x] Cron endpoint（daily-reminder）
- [x] tRPC router 註冊

### 待完成 🔧

#### 關鍵（CRITICAL）

1. **Pending invite 接受/拒絕未接線**
   - 檔案：`src/app/(app)/friends/page.tsx` 第 81-82 行
   - 問題：`onAccept={() => {}}` 和 `onDecline={() => {}}` 是空的
   - 修復：需要加入 mutation 呼叫 `friend.invite.use` 或直接用 friendship ID 做接受/拒絕
   - 預估：2-3 小時

2. **推播通知觸發未掛接到 timeEntry 建立**
   - 檔案：`src/server/routers/timeEntries.ts`（需修改）
   - 問題：`checkMilestoneAndNotify()` 和 `checkRankingChangeAndNotify()` 存在但從未被呼叫
   - 修復：在 timeEntry.create mutation 的成功回調中加入這兩個函式呼叫
   - 預估：2-3 小時

3. **VAPID 金鑰未在啟動時驗證**
   - 檔案：`src/server/env.ts`（需新增或修改）
   - 問題：VAPID 金鑰只在實際發送推播時才檢查，啟動時不會報錯
   - 修復：在 env 驗證中加入 VAPID 相關變數
   - 預估：30 分鐘

#### 中等（MEDIUM）

4. **路由存取控制 middleware**
   - 檔案：`src/middleware.ts`（需修改）
   - 需確保 `/invite/*` 為公開路由、`/api/cron/*` 只接受有效 CRON_SECRET
   - 預估：1-2 小時

5. **單元測試**
   - 規格文件中規劃了完整的測試案例（friend、ranking、friendStats、notification）
   - 尚未建立任何測試檔案
   - 預估：8-10 小時

---

## 12. 已知問題與設計權衡

### 設計權衡

| 決策 | 理由 |
|------|------|
| **排行榜即時計算，不用快取表** | 好友數量少（通常 < 50），groupBy 查詢足夠快 |
| **Streak 從今天往前計算** | 簡單直覺，但需注意時區（內部使用 UTC） |
| **邀請 token 用 UUID** | 簡單安全，依賴 DB unique constraint 保證唯一性 |
| **任務完成判斷用 list name** | 檢查多種名稱變體（Done/Complete/Completed），彈性但不精確 |
| **好友統計只看聚合數據** | 隱私優先：不暴露具體任務/清單內容 |
| **推播 VAPID 金鑰缺失時靜默跳過** | 避免在不需要推播的開發環境中產生錯誤 |

### 潛在問題

1. **Streak 日期格式**：`ranking.ts` 第 26-28 行使用 `getUTCMonth()` 直接轉字串（例如 `2026-3-7`），月份和日期沒有 padStart，不影響功能但不夠規範
2. **里程碑 60 分鐘視窗**：如果用戶一次加入超過 60 分鐘，可能跳過某個門檻的通知
3. **排名變動通知條件**：只在差距 < 60 分鐘時通知，意味著大幅超越不會觸發通知
