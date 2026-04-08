# Phase 3：社交功能與推播通知 — 詳細實作計畫

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**目標：** 為 Learning Dashboard 新增好友系統（邀請連結）、排行榜（多維度排名）、好友學習統計頁、以及 PWA 推播通知，建立社交學習激勵機制。

**架構：** 在現有 tRPC + Prisma 技術棧上擴展 4 個新 router（friend、ranking、friendStats、notification），新增 5 個前端頁面和 1 個 cron API endpoint。推播通知採用 `web-push` 套件搭配 Service Worker，每日提醒由 Google Cloud Scheduler 透過 HTTP POST 觸發。

**技術棧：** Next.js 15 (App Router), tRPC v11, Prisma 6.7, Zod 4, `web-push`, `next-pwa`, Google Cloud Scheduler

---

## 架構總覽

```
┌─────────────────────────────────────────────────────┐
│  Frontend (Next.js App Router)                       │
│  ┌─────────┐ ┌──────────┐ ┌─────────┐ ┌──────────┐ │
│  │ /friends │ │ /ranking │ │/friends/ │ │/settings │ │
│  │         │ │          │ │[userId] │ │          │ │
│  └────┬────┘ └────┬─────┘ └────┬────┘ └────┬─────┘ │
│       │           │            │            │        │
│  ┌────▼───────────▼────────────▼────────────▼─────┐ │
│  │  tRPC React Client (trpc.useQuery / useMutation)│ │
│  └────┬───────────────────────────────────────────┘ │
│       │    ┌──────────────────────┐                  │
│       │    │ Service Worker (PWA) │◄── Push Service  │
│       │    └──────────────────────┘                  │
└───────┼──────────────────────────────────────────────┘
        │ HTTP (SuperJSON)
┌───────▼──────────────────────────────────────────────┐
│  Backend (tRPC Routers)                              │
│  ┌──────────┐ ┌──────────┐ ┌────────────┐           │
│  │ friend   │ │ ranking  │ │friendStats │           │
│  │ router   │ │ router   │ │  router    │           │
│  └──────────┘ └──────────┘ └────────────┘           │
│  ┌──────────────┐ ┌─────────────────────────┐       │
│  │ notification │ │ notification.service.ts  │       │
│  │   router     │ │ (web-push 發送邏輯)      │       │
│  └──────────────┘ └─────────────────────────┘       │
│  ┌───────────────────────────────┐                   │
│  │ /api/cron/daily-reminder      │◄── Cloud Scheduler│
│  └───────────────────────────────┘                   │
│                                                      │
│  ┌─ Prisma ──────────────────────┐                   │
│  │ Friendship │ FriendInvite     │                   │
│  │ PushSubscription │ User(擴充)  │                   │
│  └───────────────────────────────┘                   │
└──────────────────────────────────────────────────────┘
```

---

## 檔案結構

### 新增檔案

```
prisma/
  migrations/XXXXXXXX_add_social_features/migration.sql  (Prisma 自動產生)

src/server/routers/
  friend.ts              — 好友系統：邀請、接受、列表、移除
  ranking.ts             — 排行榜：多維度排名查詢
  friendStats.ts         — 好友統計：摘要、週間圖表、Board 分佈
  notification.ts        — 推播訂閱：subscribe、unsubscribe、toggle
  notification.service.ts — 共用推播發送邏輯（router + cron 共用）

src/app/(app)/
  friends/page.tsx            — 好友列表 + 待處理邀請 + 邀請按鈕
  friends/[userId]/page.tsx   — 好友學習統計頁
  ranking/page.tsx            — 排行榜頁面

src/app/invite/[token]/page.tsx  — 公開邀請頁面（在 (app) layout 外）

src/app/api/cron/daily-reminder/route.ts  — Cloud Scheduler cron endpoint

src/components/friends/
  FriendCard.tsx          — 好友列表中的單行
  PendingInviteCard.tsx   — 待處理邀請（含接受/拒絕按鈕）
  InviteLinkDialog.tsx    — 產生＋複製邀請連結的 Dialog

src/components/ranking/
  LeaderboardTable.tsx    — 排名表格（含維度 tabs）
  RankRow.tsx             — 單行排名

src/components/settings/
  NotificationToggle.tsx  — 推播通知開關

src/hooks/
  usePushSubscription.ts  — Push API 訂閱管理 hook

public/
  manifest.json           — PWA manifest
  custom-sw.js            — Service Worker（push handler）

tests/server/
  friend.test.ts          — Friend router 單元測試
  ranking.test.ts         — Ranking router 單元測試
  friendStats.test.ts     — FriendStats router 單元測試
  notification.test.ts    — Notification router 單元測試
```

### 修改檔案

```
prisma/schema.prisma                    — 新增 Friendship, FriendInvite, PushSubscription models
src/server/routers/_app.ts              — 註冊 4 個新 router
src/server/env.ts                       — 新增 VAPID 環境變數驗證
src/server/routers/timeEntries.ts       — 加入通知觸發 hook
src/components/layout/Sidebar.tsx       — 新增 Friends + Ranking 導航
src/components/layout/MobileSidebar.tsx — 新增 Friends + Ranking 導航
src/middleware.ts                        — 放行 /invite/* 和 /api/cron/*
src/app/layout.tsx                       — 加入 manifest link
next.config.ts                           — 加入 next-pwa 設定
package.json                             — 新增 web-push, next-pwa
```

---

## Task 1：Database Schema — 新增社交模型

**檔案：**
- 修改：`prisma/schema.prisma`

- [ ] **Step 1：新增 enum 和 3 個 model 到 schema.prisma**

在現有 `TimeEntry` model 之後加入：

```prisma
enum FriendshipStatus {
  PENDING
  ACCEPTED
  DECLINED
}

model Friendship {
  id          String           @id @default(uuid())
  requesterId String
  requester   User             @relation("SentRequests", fields: [requesterId], references: [id], onDelete: Cascade)
  addresseeId String
  addressee   User             @relation("ReceivedRequests", fields: [addresseeId], references: [id], onDelete: Cascade)
  status      FriendshipStatus @default(PENDING)
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt

  @@unique([requesterId, addresseeId])
  @@index([addresseeId])
}

model FriendInvite {
  id        String    @id @default(uuid())
  token     String    @unique @default(uuid())
  inviterId String
  inviter   User      @relation(fields: [inviterId], references: [id], onDelete: Cascade)
  usedById  String?
  usedAt    DateTime?
  expiresAt DateTime
  createdAt DateTime  @default(now())

  @@index([token])
}

model PushSubscription {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  endpoint  String   @db.Text
  p256dh    String
  auth      String
  enabled   Boolean  @default(true)
  createdAt DateTime @default(now())

  @@unique([userId, endpoint])
}
```

在 User model 中新增 relations：

```prisma
model User {
  // ... 現有欄位保留
  sentRequests      Friendship[]       @relation("SentRequests")
  receivedRequests  Friendship[]       @relation("ReceivedRequests")
  friendInvites     FriendInvite[]
  pushSubscriptions PushSubscription[]
}
```

- [ ] **Step 2：執行 migration**

```bash
pnpm migrate-dev --name add_social_features
```

預期結果：Migration 建立成功，`Friendship`、`FriendInvite`、`PushSubscription` 三張表已建立。

- [ ] **Step 3：驗證 schema**

```bash
npx prisma studio
```

預期結果：Prisma Studio 中可看到三張新表。

- [ ] **Step 4：Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add Friendship, FriendInvite, PushSubscription schema models"
```

---

## Task 2：Friend Router — 邀請、接受、列表、移除

**檔案：**
- 新增：`src/server/routers/friend.ts`
- 修改：`src/server/routers/_app.ts`
- 新增：`tests/server/friend.test.ts`

### 設計決策與 Edge Cases

| 情境 | 處理方式 |
|------|----------|
| 連結過期（7天） | `validate` 回傳 `reason: 'expired'` |
| 連結已使用 | `validate` 回傳 `reason: 'used'` |
| 自己邀請自己 | `validate` 回傳 `reason: 'self'` |
| 已經是好友 | `validate` 回傳 `reason: 'already_friends'`（查雙向） |
| A 邀請 B，B 也邀請 A | 第二個邀請的 `validate` 偵測到已有 PENDING friendship 回傳 `already_friends` |
| Friendship 查詢需雙向 | `list` 查 `requesterId = userId OR addresseeId = userId` 且 `status = ACCEPTED` |
| 移除好友 | 直接刪除 Friendship record（不分方向），前端 invalidate query |
| 同一用戶多次產生邀請連結 | 允許（每個連結獨立，各自有 7 天效期） |

- [ ] **Step 1：寫 friend router 測試**

建立 `tests/server/friend.test.ts`：

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { router, createCallerFactory } from '~/server/trpc';
import { friendRouter } from '~/server/routers/friend';
import { prisma } from '~/server/prisma';

const appRouter = router({ friend: friendRouter });
const createCaller = createCallerFactory(appRouter);

function callerAs(userId: string) {
  return createCaller({
    session: { user: { id: userId, email: `${userId}@test.com`, name: userId }, expires: '' },
    userId,
  });
}

describe('friend router', () => {
  beforeEach(async () => {
    await prisma.friendInvite.deleteMany();
    await prisma.friendship.deleteMany();
    // 確保測試用戶存在
    for (const id of ['user-a', 'user-b', 'user-c']) {
      await prisma.user.upsert({
        where: { id },
        update: {},
        create: { id, name: id, email: `${id}@test.com` },
      });
    }
  });

  describe('invite.create', () => {
    it('應產生帶有 token 和 7 天效期的邀請', async () => {
      const caller = callerAs('user-a');
      const result = await caller.friend.invite.create();
      expect(result.token).toBeDefined();
      expect(typeof result.token).toBe('string');

      const invite = await prisma.friendInvite.findUnique({ where: { token: result.token } });
      expect(invite).not.toBeNull();
      expect(invite!.inviterId).toBe('user-a');
      expect(invite!.usedById).toBeNull();
      // 效期在 6~8 天之間（容忍時差）
      const diffDays = (invite!.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      expect(diffDays).toBeGreaterThan(6);
      expect(diffDays).toBeLessThan(8);
    });
  });

  describe('invite.validate', () => {
    it('有效連結應回傳 valid: true 和邀請人資訊', async () => {
      const callerA = callerAs('user-a');
      const { token } = await callerA.friend.invite.create();
      const callerB = callerAs('user-b');
      const result = await callerB.friend.invite.validate({ token });
      expect(result.valid).toBe(true);
      expect(result.inviterName).toBe('user-a');
    });

    it('過期連結應回傳 reason: expired', async () => {
      // 手動建立已過期的邀請
      const invite = await prisma.friendInvite.create({
        data: {
          inviterId: 'user-a',
          expiresAt: new Date(Date.now() - 1000), // 已過期
        },
      });
      const callerB = callerAs('user-b');
      const result = await callerB.friend.invite.validate({ token: invite.token });
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('expired');
    });

    it('已使用連結應回傳 reason: used', async () => {
      const invite = await prisma.friendInvite.create({
        data: {
          inviterId: 'user-a',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          usedById: 'user-c',
          usedAt: new Date(),
        },
      });
      const callerB = callerAs('user-b');
      const result = await callerB.friend.invite.validate({ token: invite.token });
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('used');
    });

    it('自己邀請自己應回傳 reason: self', async () => {
      const callerA = callerAs('user-a');
      const { token } = await callerA.friend.invite.create();
      const result = await callerA.friend.invite.validate({ token });
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('self');
    });

    it('已是好友應回傳 reason: already_friends', async () => {
      await prisma.friendship.create({
        data: { requesterId: 'user-a', addresseeId: 'user-b', status: 'ACCEPTED' },
      });
      const callerA = callerAs('user-a');
      const { token } = await callerA.friend.invite.create();
      const callerB = callerAs('user-b');
      const result = await callerB.friend.invite.validate({ token });
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('already_friends');
    });
  });

  describe('invite.use', () => {
    it('accept 應建立 ACCEPTED friendship 並標記連結已使用', async () => {
      const callerA = callerAs('user-a');
      const { token } = await callerA.friend.invite.create();
      const callerB = callerAs('user-b');
      const result = await callerB.friend.invite.use({ token, action: 'accept' });
      expect(result.status).toBe('ACCEPTED');

      const friendship = await prisma.friendship.findFirst({
        where: { requesterId: 'user-a', addresseeId: 'user-b' },
      });
      expect(friendship).not.toBeNull();
      expect(friendship!.status).toBe('ACCEPTED');

      const invite = await prisma.friendInvite.findUnique({ where: { token } });
      expect(invite!.usedById).toBe('user-b');
      expect(invite!.usedAt).not.toBeNull();
    });
  });

  describe('list', () => {
    it('應回傳雙向的已接受好友', async () => {
      await prisma.friendship.create({
        data: { requesterId: 'user-a', addresseeId: 'user-b', status: 'ACCEPTED' },
      });
      await prisma.friendship.create({
        data: { requesterId: 'user-c', addresseeId: 'user-a', status: 'ACCEPTED' },
      });

      const callerA = callerAs('user-a');
      const friends = await callerA.friend.list();
      expect(friends).toHaveLength(2);
      const ids = friends.map((f) => f.id);
      expect(ids).toContain('user-b');
      expect(ids).toContain('user-c');
    });
  });

  describe('remove', () => {
    it('應刪除 friendship record', async () => {
      const fs = await prisma.friendship.create({
        data: { requesterId: 'user-a', addresseeId: 'user-b', status: 'ACCEPTED' },
      });
      const callerA = callerAs('user-a');
      await callerA.friend.remove({ friendshipId: fs.id });
      const found = await prisma.friendship.findUnique({ where: { id: fs.id } });
      expect(found).toBeNull();
    });
  });
});
```

- [ ] **Step 2：執行測試確認失敗**

```bash
pnpm test-unit tests/server/friend.test.ts
```

預期：FAIL（`friendRouter` 尚未定義）

- [ ] **Step 3：實作 friend router**

建立 `src/server/routers/friend.ts`：

```typescript
import { router, protectedProcedure } from '../trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { prisma } from '~/server/prisma';

/**
 * 查詢兩個用戶之間是否已存在 friendship（雙向）
 */
async function findExistingFriendship(userA: string, userB: string) {
  return prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId: userA, addresseeId: userB },
        { requesterId: userB, addresseeId: userA },
      ],
    },
  });
}

/**
 * 取得用戶的所有已接受好友 ID 列表
 */
export async function getAcceptedFriendIds(userId: string): Promise<string[]> {
  const friendships = await prisma.friendship.findMany({
    where: {
      status: 'ACCEPTED',
      OR: [{ requesterId: userId }, { addresseeId: userId }],
    },
    select: { requesterId: true, addresseeId: true },
  });
  return friendships.map((f) =>
    f.requesterId === userId ? f.addresseeId : f.requesterId,
  );
}

export const friendRouter = router({
  invite: router({
    /** 產生邀請連結（一次性，7 天效期） */
    create: protectedProcedure.mutation(async ({ ctx }) => {
      const invite = await prisma.friendInvite.create({
        data: {
          inviterId: ctx.userId,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });
      return { token: invite.token };
    }),

    /** 驗證邀請連結是否有效 */
    validate: protectedProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ ctx, input }) => {
        const invite = await prisma.friendInvite.findUnique({
          where: { token: input.token },
          include: { inviter: { select: { name: true, image: true } } },
        });

        if (!invite) {
          return { valid: false as const, reason: 'not_found' as const };
        }
        if (invite.usedById) {
          return { valid: false as const, reason: 'used' as const };
        }
        if (invite.expiresAt < new Date()) {
          return { valid: false as const, reason: 'expired' as const };
        }
        if (invite.inviterId === ctx.userId) {
          return { valid: false as const, reason: 'self' as const };
        }

        const existing = await findExistingFriendship(invite.inviterId, ctx.userId);
        if (existing && (existing.status === 'ACCEPTED' || existing.status === 'PENDING')) {
          return { valid: false as const, reason: 'already_friends' as const };
        }

        return {
          valid: true as const,
          inviterName: invite.inviter.name,
          inviterImage: invite.inviter.image,
        };
      }),

    /** 使用邀請連結（接受或拒絕） */
    use: protectedProcedure
      .input(z.object({
        token: z.string(),
        action: z.enum(['accept', 'decline']),
      }))
      .mutation(async ({ ctx, input }) => {
        const invite = await prisma.friendInvite.findUnique({
          where: { token: input.token },
        });

        if (!invite) throw new TRPCError({ code: 'NOT_FOUND', message: '邀請連結不存在' });
        if (invite.usedById) throw new TRPCError({ code: 'BAD_REQUEST', message: '此連結已被使用' });
        if (invite.expiresAt < new Date()) throw new TRPCError({ code: 'BAD_REQUEST', message: '此連結已過期' });
        if (invite.inviterId === ctx.userId) throw new TRPCError({ code: 'BAD_REQUEST', message: '不能加自己為好友' });

        const existing = await findExistingFriendship(invite.inviterId, ctx.userId);
        if (existing?.status === 'ACCEPTED') {
          throw new TRPCError({ code: 'BAD_REQUEST', message: '你們已經是好友了' });
        }

        const status = input.action === 'accept' ? 'ACCEPTED' : 'DECLINED';

        await prisma.$transaction([
          // 建立或更新 friendship
          existing
            ? prisma.friendship.update({
                where: { id: existing.id },
                data: { status },
              })
            : prisma.friendship.create({
                data: {
                  requesterId: invite.inviterId,
                  addresseeId: ctx.userId,
                  status,
                },
              }),
          // 標記邀請已使用
          prisma.friendInvite.update({
            where: { id: invite.id },
            data: { usedById: ctx.userId, usedAt: new Date() },
          }),
        ]);

        return { status };
      }),
  }),

  /** 取得所有已接受的好友列表 */
  list: protectedProcedure.query(async ({ ctx }) => {
    const friendships = await prisma.friendship.findMany({
      where: {
        status: 'ACCEPTED',
        OR: [{ requesterId: ctx.userId }, { addresseeId: ctx.userId }],
      },
      include: {
        requester: { select: { id: true, name: true, image: true } },
        addressee: { select: { id: true, name: true, image: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return friendships.map((f) => {
      const friend = f.requesterId === ctx.userId ? f.addressee : f.requester;
      return {
        friendshipId: f.id,
        id: friend.id,
        name: friend.name,
        image: friend.image,
        since: f.createdAt,
      };
    });
  }),

  /** 取得收到的待處理好友邀請 */
  pending: protectedProcedure.query(async ({ ctx }) => {
    const friendships = await prisma.friendship.findMany({
      where: {
        addresseeId: ctx.userId,
        status: 'PENDING',
      },
      include: {
        requester: { select: { id: true, name: true, image: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return friendships.map((f) => ({
      id: f.id,
      requester: f.requester,
      createdAt: f.createdAt,
    }));
  }),

  /** 移除好友 */
  remove: protectedProcedure
    .input(z.object({ friendshipId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // 確保只能刪除自己參與的 friendship
      const friendship = await prisma.friendship.findFirst({
        where: {
          id: input.friendshipId,
          OR: [{ requesterId: ctx.userId }, { addresseeId: ctx.userId }],
        },
      });
      if (!friendship) throw new TRPCError({ code: 'NOT_FOUND' });

      await prisma.friendship.delete({ where: { id: input.friendshipId } });
      return { success: true };
    }),
});
```

- [ ] **Step 4：在 `_app.ts` 註冊 friend router**

修改 `src/server/routers/_app.ts`，新增：

```typescript
import { friendRouter } from './friend';

export const appRouter = router({
  // ... 現有 routers
  friend: friendRouter,
});
```

- [ ] **Step 5：執行測試確認通過**

```bash
pnpm test-unit tests/server/friend.test.ts
```

預期：全部 PASS

- [ ] **Step 6：Commit**

```bash
git add src/server/routers/friend.ts src/server/routers/_app.ts tests/server/friend.test.ts
git commit -m "feat: add friend router with invite, accept, list, remove"
```

---

## Task 3：Ranking Router — 多維度排行榜

**檔案：**
- 新增：`src/server/routers/ranking.ts`
- 修改：`src/server/routers/_app.ts`
- 新增：`tests/server/ranking.test.ts`

### 設計決策與 Edge Cases

| 情境 | 處理方式 |
|------|----------|
| 沒有好友 | 排行榜只顯示自己（rank = 1） |
| Streak 維度沒有 timeRange | Streak 是累積值，忽略 timeRange 參數 |
| 「完成的任務」如何判定 | 統計所在 List 名稱包含 'Done'、'Complete'、'Completed'（不區分大小寫）的 Task 數量 |
| 分數相同 | 同分同名次（dense ranking），按名稱字母序排列 |
| 週起始日 | 使用 Monday（與 analytics.ts 一致） |
| 大量好友效能 | 目前設計為即時計算（好友數量預估 < 50，效能可接受）；未來可加 UserStats 快取表 |

- [ ] **Step 1：寫 ranking router 測試**

建立 `tests/server/ranking.test.ts`：

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { router, createCallerFactory } from '~/server/trpc';
import { rankingRouter } from '~/server/routers/ranking';
import { prisma } from '~/server/prisma';

const appRouter = router({ ranking: rankingRouter });
const createCaller = createCallerFactory(appRouter);

function callerAs(userId: string) {
  return createCaller({
    session: { user: { id: userId, email: `${userId}@test.com`, name: userId }, expires: '' },
    userId,
  });
}

describe('ranking router', () => {
  beforeEach(async () => {
    await prisma.timeEntry.deleteMany();
    await prisma.task.deleteMany();
    await prisma.list.deleteMany();
    await prisma.board.deleteMany();
    await prisma.friendship.deleteMany();

    for (const id of ['user-a', 'user-b', 'user-c']) {
      await prisma.user.upsert({
        where: { id },
        update: {},
        create: { id, name: id, email: `${id}@test.com` },
      });
    }

    // user-a 和 user-b 是好友
    await prisma.friendship.create({
      data: { requesterId: 'user-a', addresseeId: 'user-b', status: 'ACCEPTED' },
    });

    // 建立 boards 和 timeEntries
    const boardA = await prisma.board.create({
      data: { name: 'A-board', type: 'TIME_ONLY', order: 0, user_id: 'user-a' },
    });
    const boardB = await prisma.board.create({
      data: { name: 'B-board', type: 'TIME_ONLY', order: 0, user_id: 'user-b' },
    });

    // user-a: 120 分鐘（本週）
    await prisma.timeEntry.create({
      data: { boardId: boardA.id, duration: 120, createdAt: new Date() },
    });
    // user-b: 60 分鐘（本週）
    await prisma.timeEntry.create({
      data: { boardId: boardB.id, duration: 60, createdAt: new Date() },
    });
  });

  describe('leaderboard - hours', () => {
    it('應按學習時數降序排列', async () => {
      const caller = callerAs('user-a');
      const result = await caller.ranking.leaderboard({
        dimension: 'hours',
        timeRange: 'week',
      });
      expect(result).toHaveLength(2); // user-a + user-b
      expect(result[0].userId).toBe('user-a');
      expect(result[0].value).toBe(120);
      expect(result[0].rank).toBe(1);
      expect(result[1].userId).toBe('user-b');
      expect(result[1].value).toBe(60);
      expect(result[1].rank).toBe(2);
    });
  });

  describe('leaderboard - no friends', () => {
    it('沒有好友時只顯示自己', async () => {
      const caller = callerAs('user-c'); // user-c 沒有好友
      const result = await caller.ranking.leaderboard({
        dimension: 'hours',
        timeRange: 'week',
      });
      expect(result).toHaveLength(1);
      expect(result[0].userId).toBe('user-c');
      expect(result[0].rank).toBe(1);
    });
  });

  describe('myStats', () => {
    it('應回傳自己的各維度統計', async () => {
      const caller = callerAs('user-a');
      const result = await caller.ranking.myStats();
      expect(result.weeklyMinutes).toBe(120);
      expect(result.streak).toBeGreaterThanOrEqual(0);
      expect(result.weeklyTasks).toBeGreaterThanOrEqual(0);
    });
  });
});
```

- [ ] **Step 2：執行測試確認失敗**

```bash
pnpm test-unit tests/server/ranking.test.ts
```

預期：FAIL

- [ ] **Step 3：實作 ranking router**

建立 `src/server/routers/ranking.ts`：

```typescript
import { router, protectedProcedure } from '../trpc';
import { z } from 'zod';
import { prisma } from '~/server/prisma';
import { getAcceptedFriendIds } from './friend';

/** 取得時間範圍起始日 */
function getTimeRangeStart(timeRange: 'week' | 'month'): Date {
  const now = new Date();
  if (timeRange === 'week') {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7)); // Monday
    return d;
  }
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

/** 計算用戶的連續學習天數（streak） */
async function calculateStreak(userId: string): Promise<number> {
  const entries = await prisma.timeEntry.findMany({
    where: { board: { user_id: userId } },
    select: { createdAt: true },
  });

  const dateSet = new Set(
    entries.map((e) => {
      const d = new Date(e.createdAt);
      return `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
    }),
  );

  let streak = 0;
  const cursor = new Date();
  cursor.setUTCHours(0, 0, 0, 0);

  while (true) {
    const key = `${cursor.getUTCFullYear()}-${cursor.getUTCMonth()}-${cursor.getUTCDate()}`;
    if (!dateSet.has(key)) break;
    streak++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  return streak;
}

/** 計算用戶在時間範圍內完成的任務數 */
async function countCompletedTasks(userId: string, since: Date): Promise<number> {
  return prisma.task.count({
    where: {
      list: {
        board: { user_id: userId },
        name: { in: ['Done', 'done', 'Complete', 'complete', 'Completed', 'completed'] },
      },
      updatedAt: { gte: since },
    },
  });
}

export const rankingRouter = router({
  /** 取得排行榜 */
  leaderboard: protectedProcedure
    .input(z.object({
      dimension: z.enum(['hours', 'streak', 'tasks']),
      timeRange: z.enum(['week', 'month']).default('week'),
    }))
    .query(async ({ ctx, input }) => {
      const friendIds = await getAcceptedFriendIds(ctx.userId);
      const allUserIds = [ctx.userId, ...friendIds];

      // 取得用戶資訊
      const users = await prisma.user.findMany({
        where: { id: { in: allUserIds } },
        select: { id: true, name: true, image: true },
      });
      const userMap = new Map(users.map((u) => [u.id, u]));

      let entries: { userId: string; value: number }[];

      if (input.dimension === 'hours') {
        const since = getTimeRangeStart(input.timeRange);
        const results = await prisma.timeEntry.groupBy({
          by: ['boardId'],
          where: {
            board: { user_id: { in: allUserIds } },
            createdAt: { gte: since },
          },
          _sum: { duration: true },
        });

        // boardId → userId 映射
        const boards = await prisma.board.findMany({
          where: { id: { in: results.map((r) => r.boardId) } },
          select: { id: true, user_id: true },
        });
        const boardUserMap = new Map(boards.map((b) => [b.id, b.user_id]));

        // 彙總每個用戶的總時數
        const userMinutes = new Map<string, number>();
        for (const uid of allUserIds) userMinutes.set(uid, 0);
        for (const r of results) {
          const uid = boardUserMap.get(r.boardId);
          if (uid) userMinutes.set(uid, (userMinutes.get(uid) ?? 0) + (r._sum.duration ?? 0));
        }

        entries = allUserIds.map((uid) => ({ userId: uid, value: userMinutes.get(uid) ?? 0 }));

      } else if (input.dimension === 'streak') {
        // Streak 是累積值，不受 timeRange 影響
        entries = await Promise.all(
          allUserIds.map(async (uid) => ({
            userId: uid,
            value: await calculateStreak(uid),
          })),
        );

      } else {
        // tasks
        const since = getTimeRangeStart(input.timeRange);
        entries = await Promise.all(
          allUserIds.map(async (uid) => ({
            userId: uid,
            value: await countCompletedTasks(uid, since),
          })),
        );
      }

      // 排序（降序）並加上名次
      entries.sort((a, b) => b.value - a.value);

      let currentRank = 1;
      return entries.map((entry, i) => {
        if (i > 0 && entry.value < entries[i - 1].value) {
          currentRank = i + 1;
        }
        const user = userMap.get(entry.userId);
        return {
          rank: currentRank,
          userId: entry.userId,
          name: user?.name ?? null,
          image: user?.image ?? null,
          value: entry.value,
        };
      });
    }),

  /** 取得自己的各維度統計 */
  myStats: protectedProcedure.query(async ({ ctx }) => {
    const weekStart = getTimeRangeStart('week');

    const [weekAgg, streak, weeklyTasks] = await Promise.all([
      prisma.timeEntry.aggregate({
        where: {
          board: { user_id: ctx.userId },
          createdAt: { gte: weekStart },
        },
        _sum: { duration: true },
      }),
      calculateStreak(ctx.userId),
      countCompletedTasks(ctx.userId, weekStart),
    ]);

    return {
      weeklyMinutes: weekAgg._sum.duration ?? 0,
      streak,
      weeklyTasks,
    };
  }),
});
```

- [ ] **Step 4：在 `_app.ts` 註冊 ranking router**

```typescript
import { rankingRouter } from './ranking';

export const appRouter = router({
  // ...
  ranking: rankingRouter,
});
```

- [ ] **Step 5：執行測試確認通過**

```bash
pnpm test-unit tests/server/ranking.test.ts
```

預期：全部 PASS

- [ ] **Step 6：Commit**

```bash
git add src/server/routers/ranking.ts src/server/routers/_app.ts tests/server/ranking.test.ts
git commit -m "feat: add ranking router with multi-dimension leaderboard"
```

---

## Task 4：FriendStats Router — 好友統計（含存取控制）

**檔案：**
- 新增：`src/server/routers/friendStats.ts`
- 修改：`src/server/routers/_app.ts`
- 新增：`tests/server/friendStats.test.ts`

### 設計決策與 Edge Cases

| 情境 | 處理方式 |
|------|----------|
| 非好友存取 | 拋出 `FORBIDDEN` 錯誤 |
| 好友沒有任何學習紀錄 | 回傳 0 值，圖表顯示空狀態 |
| Board 時間分佈只顯示名稱和時數 | 隱私設計：不暴露 task/list 細節 |
| 查看自己的統計 | 不阻擋（redirected to dashboard 由前端處理） |

- [ ] **Step 1：寫 friendStats 測試**

建立 `tests/server/friendStats.test.ts`：

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { router, createCallerFactory } from '~/server/trpc';
import { friendStatsRouter } from '~/server/routers/friendStats';
import { prisma } from '~/server/prisma';

const appRouter = router({ friendStats: friendStatsRouter });
const createCaller = createCallerFactory(appRouter);

function callerAs(userId: string) {
  return createCaller({
    session: { user: { id: userId, email: `${userId}@test.com`, name: userId }, expires: '' },
    userId,
  });
}

describe('friendStats router', () => {
  beforeEach(async () => {
    await prisma.timeEntry.deleteMany();
    await prisma.task.deleteMany();
    await prisma.list.deleteMany();
    await prisma.board.deleteMany();
    await prisma.friendship.deleteMany();

    for (const id of ['user-a', 'user-b', 'user-c']) {
      await prisma.user.upsert({
        where: { id },
        update: {},
        create: { id, name: id, email: `${id}@test.com` },
      });
    }

    // user-a 和 user-b 是好友
    await prisma.friendship.create({
      data: { requesterId: 'user-a', addresseeId: 'user-b', status: 'ACCEPTED' },
    });

    // user-b 有學習紀錄
    const board = await prisma.board.create({
      data: { name: '英文學習', type: 'TASK_BASED', order: 0, user_id: 'user-b' },
    });
    await prisma.timeEntry.create({
      data: { boardId: board.id, duration: 90, createdAt: new Date() },
    });
  });

  it('好友可以查看統計', async () => {
    const caller = callerAs('user-a');
    const summary = await caller.friendStats.getSummary({ friendId: 'user-b' });
    expect(summary.name).toBe('user-b');
    expect(summary.weeklyMinutes).toBe(90);
  });

  it('非好友查看統計應拋出 FORBIDDEN', async () => {
    const caller = callerAs('user-c'); // user-c 和 user-b 不是好友
    await expect(
      caller.friendStats.getSummary({ friendId: 'user-b' }),
    ).rejects.toThrow('FORBIDDEN');
  });

  it('getWeeklyChart 應回傳 7 天資料', async () => {
    const caller = callerAs('user-a');
    const chart = await caller.friendStats.getWeeklyChart({ friendId: 'user-b' });
    expect(chart).toHaveLength(7);
    expect(chart.every((d) => typeof d.minutes === 'number')).toBe(true);
  });

  it('getBoardBreakdown 應回傳各 board 時數', async () => {
    const caller = callerAs('user-a');
    const breakdown = await caller.friendStats.getBoardBreakdown({ friendId: 'user-b' });
    expect(breakdown).toHaveLength(1);
    expect(breakdown[0].name).toBe('英文學習');
    expect(breakdown[0].minutes).toBe(90);
  });
});
```

- [ ] **Step 2：執行測試確認失敗**

```bash
pnpm test-unit tests/server/friendStats.test.ts
```

- [ ] **Step 3：實作 friendStats router**

建立 `src/server/routers/friendStats.ts`：

```typescript
import { router, protectedProcedure } from '../trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { prisma } from '~/server/prisma';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

/** 驗證查看者是被查看者的已接受好友 */
async function assertIsFriend(viewerId: string, friendId: string) {
  const friendship = await prisma.friendship.findFirst({
    where: {
      status: 'ACCEPTED',
      OR: [
        { requesterId: viewerId, addresseeId: friendId },
        { requesterId: friendId, addresseeId: viewerId },
      ],
    },
  });
  if (!friendship) {
    throw new TRPCError({ code: 'FORBIDDEN', message: '你們不是好友' });
  }
}

/** 本週一的 UTC 零時 */
function getWeekStart(): Date {
  const now = new Date();
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d;
}

export const friendStatsRouter = router({
  /** 好友的摘要統計 */
  getSummary: protectedProcedure
    .input(z.object({ friendId: z.string() }))
    .query(async ({ ctx, input }) => {
      await assertIsFriend(ctx.userId, input.friendId);

      const weekStart = getWeekStart();
      const userFilter = { board: { user_id: input.friendId } };

      const [user, weekAgg, taskCount, streakEntries] = await prisma.$transaction([
        prisma.user.findUniqueOrThrow({
          where: { id: input.friendId },
          select: { name: true, image: true },
        }),
        prisma.timeEntry.aggregate({
          where: { ...userFilter, createdAt: { gte: weekStart } },
          _sum: { duration: true },
        }),
        prisma.task.count({
          where: {
            list: {
              board: { user_id: input.friendId },
              name: { in: ['Done', 'done', 'Complete', 'complete', 'Completed', 'completed'] },
            },
            updatedAt: { gte: weekStart },
          },
        }),
        prisma.timeEntry.findMany({
          where: userFilter,
          select: { createdAt: true },
        }),
      ]);

      // Streak 計算
      const dateSet = new Set(
        streakEntries.map((e) => {
          const d = new Date(e.createdAt);
          return `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
        }),
      );
      let streak = 0;
      const cursor = new Date();
      cursor.setUTCHours(0, 0, 0, 0);
      while (dateSet.has(`${cursor.getUTCFullYear()}-${cursor.getUTCMonth()}-${cursor.getUTCDate()}`)) {
        streak++;
        cursor.setUTCDate(cursor.getUTCDate() - 1);
      }

      return {
        name: user.name,
        image: user.image,
        weeklyMinutes: weekAgg._sum.duration ?? 0,
        weeklyTasks: taskCount,
        streak,
      };
    }),

  /** 好友的本週每日學習時數（折線圖） */
  getWeeklyChart: protectedProcedure
    .input(z.object({ friendId: z.string() }))
    .query(async ({ ctx, input }) => {
      await assertIsFriend(ctx.userId, input.friendId);

      const weekStart = getWeekStart();
      const entries = await prisma.timeEntry.findMany({
        where: {
          board: { user_id: input.friendId },
          createdAt: { gte: weekStart },
        },
        select: { createdAt: true, duration: true },
      });

      // 初始化 7 天
      const dayMinutes = new Array(7).fill(0);
      for (const e of entries) {
        const d = new Date(e.createdAt);
        const dayIndex = (d.getUTCDay() + 6) % 7; // Monday = 0
        dayMinutes[dayIndex] += e.duration;
      }

      return DAY_LABELS.map((day, i) => ({ day, minutes: dayMinutes[i] }));
    }),

  /** 好友的 Board 時間分佈（圓餅圖） */
  getBoardBreakdown: protectedProcedure
    .input(z.object({ friendId: z.string() }))
    .query(async ({ ctx, input }) => {
      await assertIsFriend(ctx.userId, input.friendId);

      const results = await prisma.timeEntry.groupBy({
        by: ['boardId'],
        where: { board: { user_id: input.friendId } },
        _sum: { duration: true },
      });

      const boards = await prisma.board.findMany({
        where: { id: { in: results.map((r) => r.boardId) } },
        select: { id: true, name: true, color: true },
      });
      const boardMap = new Map(boards.map((b) => [b.id, b]));

      return results
        .map((r) => {
          const board = boardMap.get(r.boardId);
          return {
            name: board?.name ?? 'Unknown',
            color: board?.color ?? null,
            minutes: r._sum.duration ?? 0,
          };
        })
        .sort((a, b) => b.minutes - a.minutes);
    }),
});
```

- [ ] **Step 4：在 `_app.ts` 註冊**

```typescript
import { friendStatsRouter } from './friendStats';

export const appRouter = router({
  // ...
  friendStats: friendStatsRouter,
});
```

- [ ] **Step 5：執行測試確認通過**

```bash
pnpm test-unit tests/server/friendStats.test.ts
```

- [ ] **Step 6：Commit**

```bash
git add src/server/routers/friendStats.ts src/server/routers/_app.ts tests/server/friendStats.test.ts
git commit -m "feat: add friendStats router with access control"
```

---

## Task 5：Notification Service + Router — 推播訂閱管理

**檔案：**
- 新增：`src/server/routers/notification.service.ts`
- 新增：`src/server/routers/notification.ts`
- 修改：`src/server/routers/_app.ts`
- 修改：`src/server/env.ts`
- 新增：`tests/server/notification.test.ts`

### 設計決策與 Edge Cases

| 情境 | 處理方式 |
|------|----------|
| 同一用戶多裝置 | `PushSubscription` 以 `[userId, endpoint]` 為唯一鍵，每個裝置獨立紀錄 |
| Push 發送失敗 (404/410) | 該訂閱已失效，自動從 DB 刪除 |
| 使用者關閉通知 | `toggle(false)` 將 `enabled` 設為 false（保留紀錄方便重啟） |
| VAPID key 未設定 | 開發環境中跳過推播發送（log warning），不阻擋其他功能 |
| 里程碑通知 | 只在「跨越門檻」時發送，不是每次 timeEntry 都發 |

- [ ] **Step 1：更新環境變數驗證**

修改 `src/server/env.ts`：

```typescript
const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  NODE_ENV: z.enum(['development', 'test', 'production']),
  NEXTAUTH_SECRET: z.string().min(1),
  NEXTAUTH_URL: z.string().url(),
  // 推播通知 (可選 — 開發環境可不設)
  VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
  VAPID_EMAIL: z.string().optional(),
  // Cron 驗證密鑰
  CRON_SECRET: z.string().optional(),
});
```

- [ ] **Step 2：實作 notification service**

建立 `src/server/routers/notification.service.ts`：

```typescript
import { prisma } from '~/server/prisma';

interface NotificationPayload {
  title: string;
  body: string;
  url?: string;
}

/** 動態載入 web-push（避免在不需要推播的環境中產生錯誤） */
async function getWebPush() {
  const webPush = await import('web-push');
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const email = process.env.VAPID_EMAIL;

  if (!publicKey || !privateKey || !email) {
    console.warn('[notification] VAPID keys not configured, skipping push');
    return null;
  }

  webPush.setVapidDetails(email, publicKey, privateKey);
  return webPush;
}

/** 向單一用戶的所有啟用裝置發送推播 */
export async function sendPushToUser(userId: string, payload: NotificationPayload) {
  const webPush = await getWebPush();
  if (!webPush) return;

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId, enabled: true },
  });

  const results = await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webPush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload),
        );
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        // 404 或 410 表示訂閱已失效
        if (statusCode === 404 || statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } });
        }
        throw err;
      }
    }),
  );

  const failed = results.filter((r) => r.status === 'rejected');
  if (failed.length > 0) {
    console.warn(`[notification] ${failed.length}/${subscriptions.length} push(es) failed for user ${userId}`);
  }
}

/** 向多個用戶發送推播 */
export async function sendPushToUsers(userIds: string[], payload: NotificationPayload) {
  await Promise.allSettled(userIds.map((uid) => sendPushToUser(uid, payload)));
}

/** 里程碑門檻（分鐘） — 5hr, 10hr, 20hr, 50hr */
const MILESTONE_THRESHOLDS = [300, 600, 1200, 3000];

/** 檢查用戶是否跨越里程碑，並通知好友 */
export async function checkMilestoneAndNotify(userId: string, userName: string | null) {
  // 計算本週總分鐘數
  const now = new Date();
  const weekStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  weekStart.setUTCDate(weekStart.getUTCDate() - ((weekStart.getUTCDay() + 6) % 7));

  const agg = await prisma.timeEntry.aggregate({
    where: { board: { user_id: userId }, createdAt: { gte: weekStart } },
    _sum: { duration: true },
  });
  const totalMinutes = agg._sum.duration ?? 0;

  // 檢查是否剛好跨越某個門檻
  const crossedThreshold = MILESTONE_THRESHOLDS.find((threshold) => {
    // 跨越條件：當前總數 >= 門檻，但刪掉最後一筆紀錄的 duration 後 < 門檻
    // 簡化：只要 totalMinutes 在 [threshold, threshold + 60] 區間內就視為剛跨越
    // 這樣避免需要知道剛新增的 duration
    return totalMinutes >= threshold && totalMinutes < threshold + 60;
  });

  if (!crossedThreshold) return;

  const hours = crossedThreshold / 60;
  const displayName = userName ?? 'Someone';

  // 通知所有好友
  const { getAcceptedFriendIds } = await import('./friend');
  const friendIds = await getAcceptedFriendIds(userId);

  if (friendIds.length === 0) return;

  await sendPushToUsers(friendIds, {
    title: 'Friend Milestone! 🎉',
    body: `${displayName} just hit ${hours} hours this week!`,
    url: `/friends/${userId}`,
  });
}

/** 檢查排名變動並通知被超越者 */
export async function checkRankingChangeAndNotify(userId: string, userName: string | null) {
  const { getAcceptedFriendIds } = await import('./friend');
  const friendIds = await getAcceptedFriendIds(userId);
  if (friendIds.length === 0) return;

  const allUserIds = [userId, ...friendIds];
  const now = new Date();
  const weekStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  weekStart.setUTCDate(weekStart.getUTCDate() - ((weekStart.getUTCDay() + 6) % 7));

  // 計算所有人的本週時數
  const results = await prisma.timeEntry.groupBy({
    by: ['boardId'],
    where: { board: { user_id: { in: allUserIds } }, createdAt: { gte: weekStart } },
    _sum: { duration: true },
  });

  const boards = await prisma.board.findMany({
    where: { id: { in: results.map((r) => r.boardId) } },
    select: { id: true, user_id: true },
  });
  const boardUserMap = new Map(boards.map((b) => [b.id, b.user_id]));

  const userMinutes = new Map<string, number>();
  for (const uid of allUserIds) userMinutes.set(uid, 0);
  for (const r of results) {
    const uid = boardUserMap.get(r.boardId);
    if (uid) userMinutes.set(uid, (userMinutes.get(uid) ?? 0) + (r._sum.duration ?? 0));
  }

  // 排序取得當前排名
  const sorted = [...userMinutes.entries()].sort((a, b) => b[1] - a[1]);
  const myIndex = sorted.findIndex(([uid]) => uid === userId);
  const myRank = myIndex + 1;

  // 如果我剛好超越了下一名（排名在我後面的人）
  if (myIndex < sorted.length - 1) {
    const overtakenUserId = sorted[myIndex + 1][0];
    const overtakenMinutes = sorted[myIndex + 1][1];
    const myMinutes = userMinutes.get(userId) ?? 0;

    // 只有在分數非常接近時才通知（差距 < 60 分鐘，表示可能剛超越）
    if (myMinutes - overtakenMinutes < 60 && myMinutes > overtakenMinutes) {
      const displayName = userName ?? 'Someone';
      await sendPushToUser(overtakenUserId, {
        title: 'Ranking Change',
        body: `${displayName} passed you! You're now ranked #${myIndex + 2} this week.`,
        url: '/ranking',
      });
    }
  }
}
```

- [ ] **Step 3：實作 notification router**

建立 `src/server/routers/notification.ts`：

```typescript
import { router, protectedProcedure } from '../trpc';
import { z } from 'zod';
import { prisma } from '~/server/prisma';

export const notificationRouter = router({
  /** 訂閱推播通知（存儲 PushSubscription） */
  subscribe: protectedProcedure
    .input(z.object({
      endpoint: z.string(),
      p256dh: z.string(),
      auth: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      await prisma.pushSubscription.upsert({
        where: {
          userId_endpoint: { userId: ctx.userId, endpoint: input.endpoint },
        },
        update: { p256dh: input.p256dh, auth: input.auth, enabled: true },
        create: {
          userId: ctx.userId,
          endpoint: input.endpoint,
          p256dh: input.p256dh,
          auth: input.auth,
        },
      });
      return { success: true };
    }),

  /** 取消特定裝置的訂閱 */
  unsubscribe: protectedProcedure
    .input(z.object({ endpoint: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await prisma.pushSubscription.deleteMany({
        where: { userId: ctx.userId, endpoint: input.endpoint },
      });
      return { success: true };
    }),

  /** 切換所有裝置的通知開關 */
  toggle: protectedProcedure
    .input(z.object({ enabled: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await prisma.pushSubscription.updateMany({
        where: { userId: ctx.userId },
        data: { enabled: input.enabled },
      });
      return { success: true };
    }),

  /** 查詢通知狀態 */
  status: protectedProcedure.query(async ({ ctx }) => {
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId: ctx.userId },
      select: { enabled: true },
    });
    return {
      enabled: subscriptions.some((s) => s.enabled),
      deviceCount: subscriptions.length,
    };
  }),
});
```

- [ ] **Step 4：在 `_app.ts` 註冊**

```typescript
import { notificationRouter } from './notification';

export const appRouter = router({
  // ...
  notification: notificationRouter,
});
```

- [ ] **Step 5：寫測試並執行**

建立 `tests/server/notification.test.ts`（測試 subscribe、toggle、status）：

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { router, createCallerFactory } from '~/server/trpc';
import { notificationRouter } from '~/server/routers/notification';
import { prisma } from '~/server/prisma';

const appRouter = router({ notification: notificationRouter });
const createCaller = createCallerFactory(appRouter);

function callerAs(userId: string) {
  return createCaller({
    session: { user: { id: userId, email: `${userId}@test.com`, name: userId }, expires: '' },
    userId,
  });
}

describe('notification router', () => {
  beforeEach(async () => {
    await prisma.pushSubscription.deleteMany();
    await prisma.user.upsert({
      where: { id: 'user-a' },
      update: {},
      create: { id: 'user-a', name: 'user-a', email: 'user-a@test.com' },
    });
  });

  it('subscribe 應建立訂閱', async () => {
    const caller = callerAs('user-a');
    await caller.notification.subscribe({
      endpoint: 'https://push.example.com/sub1',
      p256dh: 'key123',
      auth: 'auth123',
    });
    const status = await caller.notification.status();
    expect(status.enabled).toBe(true);
    expect(status.deviceCount).toBe(1);
  });

  it('toggle 應切換所有裝置', async () => {
    const caller = callerAs('user-a');
    await caller.notification.subscribe({
      endpoint: 'https://push.example.com/sub1',
      p256dh: 'key123',
      auth: 'auth123',
    });
    await caller.notification.toggle({ enabled: false });
    const status = await caller.notification.status();
    expect(status.enabled).toBe(false);
    expect(status.deviceCount).toBe(1); // 紀錄保留
  });

  it('重複 subscribe 應 upsert', async () => {
    const caller = callerAs('user-a');
    await caller.notification.subscribe({
      endpoint: 'https://push.example.com/sub1',
      p256dh: 'key123',
      auth: 'auth123',
    });
    await caller.notification.subscribe({
      endpoint: 'https://push.example.com/sub1',
      p256dh: 'newkey',
      auth: 'newauth',
    });
    const status = await caller.notification.status();
    expect(status.deviceCount).toBe(1); // 沒有重複
  });
});
```

```bash
pnpm test-unit tests/server/notification.test.ts
```

- [ ] **Step 6：Commit**

```bash
git add src/server/routers/notification.service.ts src/server/routers/notification.ts src/server/env.ts src/server/routers/_app.ts tests/server/notification.test.ts
git commit -m "feat: add notification service and router with push subscription management"
```

---

## Task 6：TimeEntry 通知 Hook

**檔案：**
- 修改：`src/server/routers/timeEntries.ts`

- [ ] **Step 1：在 timeEntry.create 後觸發通知**

修改 `src/server/routers/timeEntries.ts` 的 `create` mutation：

```typescript
import { router, protectedProcedure } from '../trpc';
import { z } from 'zod';
import { prisma } from '~/server/prisma';

export const timeEntriesRouter = router({
  create: protectedProcedure
    .input(z.object({
      boardId: z.string(),
      taskId: z.string().optional(),
      duration: z.number(),
      startTime: z.date().optional(),
      endTime: z.date().optional(),
      note: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const entry = await prisma.timeEntry.create({ data: input });

      // Fire-and-forget: 非同步觸發通知，不阻塞 response
      const user = await prisma.user.findUnique({
        where: { id: ctx.userId },
        select: { name: true },
      });

      import('./notification.service').then(({ checkMilestoneAndNotify, checkRankingChangeAndNotify }) => {
        checkMilestoneAndNotify(ctx.userId, user?.name ?? null).catch(console.error);
        checkRankingChangeAndNotify(ctx.userId, user?.name ?? null).catch(console.error);
      });

      return entry;
    }),

  // update 和 delete 保持不變...
  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      duration: z.number().optional(),
      startTime: z.date().optional(),
      endTime: z.date().optional(),
      note: z.string().optional(),
    }))
    .mutation(({ ctx, input }) => {
      const { id, ...data } = input;
      return prisma.timeEntry.update({
        where: { id, board: { user_id: ctx.userId } },
        data,
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) => {
      return prisma.timeEntry.delete({
        where: { id: input.id, board: { user_id: ctx.userId } },
      });
    }),
});
```

- [ ] **Step 2：Commit**

```bash
git add src/server/routers/timeEntries.ts
git commit -m "feat: add milestone and ranking notification hooks to timeEntry creation"
```

---

## Task 7：Cron Endpoint — 每日學習提醒

**檔案：**
- 新增：`src/app/api/cron/daily-reminder/route.ts`
- 修改：`src/middleware.ts`

### Edge Cases

| 情境 | 處理方式 |
|------|----------|
| 無 CRON_SECRET | 開發環境跳過驗證，生產環境拒絕請求 |
| 用戶已學習 | 不發送提醒 |
| 無啟用訂閱的用戶 | 直接跳過 |

- [ ] **Step 1：更新 middleware 放行 cron 路徑**

修改 `src/middleware.ts`：

```typescript
export const config = {
  matcher: [
    '/((?!login|register|invite|api/auth|api/trpc|api/cron|_next/static|_next/image|favicon.ico|manifest.json|custom-sw.js|icon-.*\\.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
```

注意：同時放行 `/invite/*`（邀請頁面需要對外開放，登入由頁面內部處理）和 `/api/cron/*` 以及 PWA 相關靜態檔。

- [ ] **Step 2：實作 cron endpoint**

建立 `src/app/api/cron/daily-reminder/route.ts`：

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '~/server/prisma';
import { sendPushToUser } from '~/server/routers/notification.service';

export async function POST(req: NextRequest) {
  // 驗證請求來源
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers.get('authorization');
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  // 找出所有有啟用推播訂閱的用戶
  const activeSubscribers = await prisma.pushSubscription.findMany({
    where: { enabled: true },
    select: { userId: true },
    distinct: ['userId'],
  });

  const userIds = activeSubscribers.map((s) => s.userId);
  if (userIds.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  // 找出今天有學習紀錄的用戶
  const activeToday = await prisma.timeEntry.findMany({
    where: {
      board: { user_id: { in: userIds } },
      createdAt: { gte: todayStart },
    },
    select: { board: { select: { user_id: true } } },
    distinct: ['boardId'],
  });

  const activeTodayIds = new Set(activeToday.map((e) => e.board.user_id));

  // 只向今天「沒有」學習的用戶發送提醒
  const inactiveUserIds = userIds.filter((uid) => !activeTodayIds.has(uid));

  const results = await Promise.allSettled(
    inactiveUserIds.map((uid) =>
      sendPushToUser(uid, {
        title: 'Study Reminder 📚',
        body: "You haven't started studying today! Keep your streak going!",
        url: '/dashboard',
      }),
    ),
  );

  const sent = results.filter((r) => r.status === 'fulfilled').length;
  return NextResponse.json({ sent, total: inactiveUserIds.length });
}
```

- [ ] **Step 3：Commit**

```bash
git add src/app/api/cron/daily-reminder/route.ts src/middleware.ts
git commit -m "feat: add daily reminder cron endpoint and update middleware"
```

---

## Task 8：PWA 設定 — Manifest + Service Worker

**檔案：**
- 新增：`public/manifest.json`
- 新增：`public/custom-sw.js`
- 修改：`next.config.ts`
- 修改：`src/app/layout.tsx`
- 修改：`package.json`（安裝 next-pwa, web-push）

- [ ] **Step 1：安裝依賴**

```bash
pnpm add web-push next-pwa
pnpm add -D @types/web-push
```

- [ ] **Step 2：建立 PWA manifest**

建立 `public/manifest.json`：

```json
{
  "name": "Learning Dashboard",
  "short_name": "LearnDash",
  "description": "Personal growth management system — track your learning progress",
  "start_url": "/dashboard",
  "display": "standalone",
  "background_color": "#FAFAFA",
  "theme_color": "#E42313",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

- [ ] **Step 3：建立 Service Worker**

建立 `public/custom-sw.js`：

```javascript
/* eslint-disable no-restricted-globals */

// Push 事件：收到推播時顯示系統通知
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: { url: data.url || '/dashboard' },
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options),
  );
});

// 點擊通知：聚焦到已開啟的視窗或開新視窗
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/dashboard';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (new URL(client.url).pathname === url && 'focus' in client) {
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});
```

- [ ] **Step 4：更新 next.config.ts**

```typescript
import type { NextConfig } from 'next';
import withPWAInit from 'next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  customWorkerSrc: 'public',
  customWorkerPrefix: 'custom-sw',
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  // ... 現有設定保留
};

export default withPWA(nextConfig);
```

- [ ] **Step 5：在 layout.tsx 加入 manifest link**

在 `src/app/layout.tsx` 的 `<head>` 或 metadata 中加入：

```typescript
export const metadata: Metadata = {
  title: 'Learning & Growth Dashboard',
  description: '...',
  manifest: '/manifest.json',
  themeColor: '#E42313',
};
```

- [ ] **Step 6：產生 VAPID keys**

```bash
npx web-push generate-vapid-keys
```

將輸出的 public/private key 加到 `.env`：

```
VAPID_PUBLIC_KEY=<public key>
VAPID_PRIVATE_KEY=<private key>
VAPID_EMAIL=mailto:your@email.com
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<same as public key>
CRON_SECRET=<random string>
```

- [ ] **Step 7：Commit**

```bash
git add public/manifest.json public/custom-sw.js next.config.ts src/app/layout.tsx package.json pnpm-lock.yaml
git commit -m "feat: add PWA manifest, service worker, and next-pwa configuration"
```

---

## Task 9：Push Subscription Hook

**檔案：**
- 新增：`src/hooks/usePushSubscription.ts`

- [ ] **Step 1：實作 hook**

建立 `src/hooks/usePushSubscription.ts`：

```typescript
'use client';

import { useCallback, useEffect, useState } from 'react';
import { trpc } from '~/utils/trpc';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from(rawData, (char) => char.charCodeAt(0));
}

export function usePushSubscription() {
  const [permission, setPermission] = useState<NotificationPermission>('default');

  const statusQuery = trpc.notification.status.useQuery(undefined, {
    enabled: typeof window !== 'undefined',
  });
  const subscribeMutation = trpc.notification.subscribe.useMutation();
  const unsubscribeMutation = trpc.notification.unsubscribe.useMutation();
  const toggleMutation = trpc.notification.toggle.useMutation();
  const utils = trpc.useUtils();

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications not supported');
      return false;
    }

    const perm = await Notification.requestPermission();
    setPermission(perm);
    if (perm !== 'granted') return false;

    const registration = await navigator.serviceWorker.ready;
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) {
      console.warn('VAPID public key not configured');
      return false;
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    });

    const json = subscription.toJSON();
    await subscribeMutation.mutateAsync({
      endpoint: json.endpoint!,
      p256dh: json.keys!.p256dh!,
      auth: json.keys!.auth!,
    });

    await utils.notification.status.invalidate();
    return true;
  }, [subscribeMutation, utils]);

  const unsubscribe = useCallback(async () => {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await unsubscribeMutation.mutateAsync({ endpoint: subscription.endpoint });
      await subscription.unsubscribe();
    }
    await utils.notification.status.invalidate();
  }, [unsubscribeMutation, utils]);

  const toggle = useCallback(async (enabled: boolean) => {
    if (enabled && permission === 'default') {
      // 首次啟用需要先訂閱
      await subscribe();
      return;
    }
    await toggleMutation.mutateAsync({ enabled });
    await utils.notification.status.invalidate();
  }, [permission, subscribe, toggleMutation, utils]);

  return {
    permission,
    isEnabled: statusQuery.data?.enabled ?? false,
    deviceCount: statusQuery.data?.deviceCount ?? 0,
    isLoading: statusQuery.isLoading,
    subscribe,
    unsubscribe,
    toggle,
  };
}
```

- [ ] **Step 2：Commit**

```bash
git add src/hooks/usePushSubscription.ts
git commit -m "feat: add usePushSubscription hook for push notification management"
```

---

## Task 10：Invite Landing Page — 邀請登入頁

**檔案：**
- 新增：`src/app/invite/[token]/page.tsx`

### Edge Cases

| 情境 | 處理方式 |
|------|----------|
| 未登入 | redirect 到 `/login?callbackUrl=/invite/[token]` |
| token 無效 | 顯示錯誤訊息（依 reason 分類） |
| 接受後 | redirect 到 `/friends` |
| 拒絕後 | redirect 到 `/dashboard` |

- [ ] **Step 1：實作邀請頁面**

建立 `src/app/invite/[token]/page.tsx`：

```tsx
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { trpc } from '~/utils/trpc';
import { Button } from '~/components/ui/button';

const ERROR_MESSAGES: Record<string, string> = {
  not_found: '此邀請連結無效。',
  expired: '此邀請連結已過期。',
  used: '此邀請連結已被使用。',
  self: '你不能加自己為好友。',
  already_friends: '你們已經是好友了！',
};

export default function InvitePage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();

  // 未登入則 redirect
  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.replace(`/login?callbackUrl=/invite/${params.token}`);
    }
  }, [sessionStatus, params.token, router]);

  const { data: validation, isLoading } = trpc.friend.invite.validate.useQuery(
    { token: params.token },
    { enabled: sessionStatus === 'authenticated' },
  );

  const useMutation = trpc.friend.invite.use.useMutation({
    onSuccess: (data) => {
      if (data.status === 'ACCEPTED') {
        router.push('/friends');
      } else {
        router.push('/dashboard');
      }
    },
  });

  if (sessionStatus === 'loading' || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAFAFA]">
        <div className="text-sm text-muted-foreground">載入中...</div>
      </div>
    );
  }

  if (!validation) return null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAFAFA]">
      <div className="flex w-[440px] flex-col items-center gap-6 rounded-xl border border-border bg-white p-10">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-primary" />
          <span className="text-xl font-semibold">Learning Dashboard</span>
        </div>

        <div className="h-px w-full bg-border" />

        {!validation.valid ? (
          <>
            <p className="text-center text-sm text-muted-foreground">
              {ERROR_MESSAGES[validation.reason ?? ''] ?? '未知錯誤'}
            </p>
            <Button variant="outline" onClick={() => router.push('/dashboard')}>
              返回首頁
            </Button>
          </>
        ) : (
          <>
            {/* 邀請人頭像 */}
            {validation.inviterImage ? (
              <img
                src={validation.inviterImage}
                alt=""
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <div className="h-16 w-16 rounded-full bg-muted" />
            )}

            <div className="space-y-2 text-center">
              <h1 className="text-xl font-medium">
                {validation.inviterName ?? 'Someone'} invited you
              </h1>
              <p className="text-sm text-muted-foreground">
                Accept the invitation to become friends and compare your learning progress together.
              </p>
            </div>

            <div className="flex w-full gap-3">
              <Button
                variant="outline"
                className="flex-1"
                disabled={useMutation.isPending}
                onClick={() => useMutation.mutate({ token: params.token, action: 'decline' })}
              >
                Decline
              </Button>
              <Button
                className="flex-1"
                disabled={useMutation.isPending}
                onClick={() => useMutation.mutate({ token: params.token, action: 'accept' })}
              >
                Accept
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2：Commit**

```bash
git add src/app/invite/
git commit -m "feat: add invite landing page with accept/decline flow"
```

---

## Task 11：Friends Page + 元件

**檔案：**
- 新增：`src/app/(app)/friends/page.tsx`
- 新增：`src/components/friends/FriendCard.tsx`
- 新增：`src/components/friends/PendingInviteCard.tsx`
- 新增：`src/components/friends/InviteLinkDialog.tsx`

- [ ] **Step 1：實作 FriendCard**

建立 `src/components/friends/FriendCard.tsx`：

```tsx
'use client';

import Link from 'next/link';
import { MoreHorizontal } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { trpc } from '~/utils/trpc';

interface FriendCardProps {
  friendshipId: string;
  id: string;
  name: string | null;
  image: string | null;
  weeklyInfo?: string;
}

export function FriendCard({ friendshipId, id, name, image, weeklyInfo }: FriendCardProps) {
  const utils = trpc.useUtils();
  const removeMutation = trpc.friend.remove.useMutation({
    onSuccess: () => utils.friend.list.invalidate(),
  });

  return (
    <div className="flex items-center gap-4 px-6 py-4">
      <Link href={`/friends/${id}`} className="flex flex-1 items-center gap-4">
        {image ? (
          <img src={image} alt="" className="h-10 w-10 rounded-full object-cover" />
        ) : (
          <div className="h-10 w-10 rounded-full bg-muted" />
        )}
        <div className="flex-1">
          <p className="text-sm font-medium">{name ?? 'Unknown'}</p>
          {weeklyInfo && (
            <p className="text-xs text-muted-foreground">{weeklyInfo}</p>
          )}
        </div>
      </Link>
      <Button
        variant="ghost"
        size="sm"
        className="text-muted-foreground"
        onClick={() => {
          if (confirm('確定要移除此好友嗎？')) {
            removeMutation.mutate({ friendshipId });
          }
        }}
      >
        <MoreHorizontal size={16} />
      </Button>
    </div>
  );
}
```

- [ ] **Step 2：實作 PendingInviteCard**

建立 `src/components/friends/PendingInviteCard.tsx`：

```tsx
'use client';

import { Check, X } from 'lucide-react';
import { Button } from '~/components/ui/button';

interface PendingInviteCardProps {
  requester: { id: string; name: string | null; image: string | null };
  onAccept: () => void;
  onDecline: () => void;
  isPending?: boolean;
}

export function PendingInviteCard({ requester, onAccept, onDecline, isPending }: PendingInviteCardProps) {
  return (
    <div className="flex items-center gap-4 px-6 py-4">
      {requester.image ? (
        <img src={requester.image} alt="" className="h-10 w-10 rounded-full object-cover" />
      ) : (
        <div className="h-10 w-10 rounded-full bg-muted" />
      )}
      <div className="flex-1">
        <p className="text-sm font-medium">{requester.name ?? 'Unknown'}</p>
        <p className="text-xs text-muted-foreground">想成為你的好友</p>
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" disabled={isPending} onClick={onDecline}>
          <X size={14} />
        </Button>
        <Button size="sm" disabled={isPending} onClick={onAccept}>
          <Check size={14} />
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3：實作 InviteLinkDialog**

建立 `src/components/friends/InviteLinkDialog.tsx`：

```tsx
'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '~/components/ui/dialog';
import { trpc } from '~/utils/trpc';

export function InviteLinkDialog({ children }: { children: React.ReactNode }) {
  const [copied, setCopied] = useState(false);
  const createMutation = trpc.friend.invite.create.useMutation();

  const link = createMutation.data
    ? `${window.location.origin}/invite/${createMutation.data.token}`
    : null;

  const handleCopy = async () => {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog onOpenChange={(open) => {
      if (open && !createMutation.data) {
        createMutation.mutate();
      }
    }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Invite a Friend</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Share this link with your friend. The link expires in 7 days and can only be used once.
        </p>
        <div className="flex gap-2">
          <div className="flex-1 rounded-md border px-3 py-2">
            <p className="truncate text-sm text-muted-foreground">
              {link ?? 'Generating...'}
            </p>
          </div>
          <Button onClick={handleCopy} disabled={!link}>
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <span className="ml-1">{copied ? 'Copied' : 'Copy'}</span>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Tip: You can also share the link via messaging apps
        </p>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 4：實作 Friends 主頁面**

建立 `src/app/(app)/friends/page.tsx`：

```tsx
'use client';

import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { trpc } from '~/utils/trpc';
import { FriendCard } from '~/components/friends/FriendCard';
import { PendingInviteCard } from '~/components/friends/PendingInviteCard';
import { InviteLinkDialog } from '~/components/friends/InviteLinkDialog';

export default function FriendsPage() {
  const [tab, setTab] = useState<'all' | 'pending'>('all');
  const friendsQuery = trpc.friend.list.useQuery();
  const pendingQuery = trpc.friend.pending.useQuery();

  const utils = trpc.useUtils();

  const pendingCount = pendingQuery.data?.length ?? 0;

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-medium tracking-tight">Friends</h1>
        <InviteLinkDialog>
          <Button>
            <UserPlus size={16} className="mr-2" />
            Invite Friend
          </Button>
        </InviteLinkDialog>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          className={`rounded px-3 py-1.5 text-sm font-medium ${
            tab === 'all' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
          }`}
          onClick={() => setTab('all')}
        >
          All Friends
        </button>
        <button
          className={`rounded px-3 py-1.5 text-sm font-medium ${
            tab === 'pending' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
          }`}
          onClick={() => setTab('pending')}
        >
          Pending ({pendingCount})
        </button>
      </div>

      {/* Content */}
      {tab === 'all' ? (
        <div className="divide-y rounded-lg border">
          {friendsQuery.isLoading ? (
            <p className="p-6 text-center text-sm text-muted-foreground">載入中...</p>
          ) : friendsQuery.data?.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">
              還沒有好友，點擊上方按鈕邀請朋友吧！
            </p>
          ) : (
            friendsQuery.data?.map((friend) => (
              <FriendCard key={friend.friendshipId} {...friend} />
            ))
          )}
        </div>
      ) : (
        <div className="divide-y rounded-lg border">
          {pendingQuery.isLoading ? (
            <p className="p-6 text-center text-sm text-muted-foreground">載入中...</p>
          ) : pendingCount === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">
              沒有待處理的好友邀請
            </p>
          ) : (
            pendingQuery.data?.map((pending) => (
              <PendingInviteCard
                key={pending.id}
                requester={pending.requester}
                onAccept={() => {
                  // Note: pending invites 使用 friendship record，不是 invite.use
                  // 需要額外的 accept/decline mutation
                }}
                onDecline={() => {}}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 5：驗證 build**

```bash
pnpm build
```

- [ ] **Step 6：Commit**

```bash
git add src/app/\(app\)/friends/ src/components/friends/
git commit -m "feat: add friends page with friend list, pending invites, and invite dialog"
```

---

## Task 12：Friend Stats Page

**檔案：**
- 新增：`src/app/(app)/friends/[userId]/page.tsx`

- [ ] **Step 1：實作好友統計頁面**

建立 `src/app/(app)/friends/[userId]/page.tsx`：

```tsx
'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Flame } from 'lucide-react';
import { trpc } from '~/utils/trpc';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const CHART_COLORS = ['#6A9CC8', '#5BAD8A', '#D4A84C', '#C87474', '#9884CC', '#4AB8B8', '#D08456', '#BC7CAC'];

function formatMinutes(m: number): string {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return h > 0 ? `${h}h ${min}m` : `${min}m`;
}

export default function FriendStatsPage() {
  const params = useParams<{ userId: string }>();
  const router = useRouter();

  const summaryQuery = trpc.friendStats.getSummary.useQuery({ friendId: params.userId });
  const chartQuery = trpc.friendStats.getWeeklyChart.useQuery({ friendId: params.userId });
  const breakdownQuery = trpc.friendStats.getBoardBreakdown.useQuery({ friendId: params.userId });

  const summary = summaryQuery.data;

  if (summaryQuery.isLoading) {
    return <p className="text-muted-foreground">載入中...</p>;
  }

  if (summaryQuery.error) {
    return (
      <div className="flex flex-col items-center gap-4 py-20">
        <p className="text-muted-foreground">
          {summaryQuery.error.data?.code === 'FORBIDDEN' ? '你們不是好友，無法查看統計' : '載入失敗'}
        </p>
        <button onClick={() => router.back()} className="text-sm text-primary underline">返回</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft size={20} />
        </button>
        {summary?.image ? (
          <img src={summary.image} alt="" className="h-12 w-12 rounded-full object-cover" />
        ) : (
          <div className="h-12 w-12 rounded-full bg-muted" />
        )}
        <div>
          <h1 className="text-2xl font-medium">{summary?.name ?? 'Unknown'}</h1>
          <p className="text-sm text-muted-foreground">Learning Stats</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-6">
        <div className="space-y-1 rounded-lg border p-7">
          <p className="text-sm text-muted-foreground">本週學習</p>
          <p className="text-3xl font-semibold">{formatMinutes(summary?.weeklyMinutes ?? 0)}</p>
        </div>
        <div className="space-y-1 rounded-lg border p-7">
          <p className="text-sm text-muted-foreground">連續天數</p>
          <div className="flex items-center gap-2">
            <p className="text-3xl font-semibold">{summary?.streak ?? 0}</p>
            <Flame size={24} className="text-primary" />
          </div>
        </div>
        <div className="space-y-1 rounded-lg border p-7">
          <p className="text-sm text-muted-foreground">本週完成任務</p>
          <p className="text-3xl font-semibold">{summary?.weeklyTasks ?? 0}</p>
          <p className="text-sm text-muted-foreground">個任務</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6">
        {/* Weekly Bar Chart */}
        <div className="space-y-4 rounded-lg border p-6">
          <h3 className="font-medium">本週學習時數</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartQuery.data ?? []}>
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#7A7A7A' }} />
              <YAxis tick={{ fontSize: 12, fill: '#7A7A7A' }} />
              <Tooltip formatter={(value: number) => formatMinutes(value)} />
              <Bar dataKey="minutes" fill="#E42313" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Board Pie Chart */}
        <div className="space-y-4 rounded-lg border p-6">
          <h3 className="font-medium">Board 時間佔比</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={breakdownQuery.data ?? []}
                dataKey="minutes"
                nameKey="name"
                innerRadius={40}
                outerRadius={70}
              >
                {breakdownQuery.data?.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Legend
                formatter={(value, entry) => {
                  const item = breakdownQuery.data?.find((d) => d.name === value);
                  return `${value} — ${formatMinutes(item?.minutes ?? 0)}`;
                }}
              />
              <Tooltip formatter={(value: number) => formatMinutes(value)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2：Commit**

```bash
git add src/app/\(app\)/friends/\[userId\]/
git commit -m "feat: add friend stats page with weekly chart and board breakdown"
```

---

## Task 13：Ranking Page + 元件

**檔案：**
- 新增：`src/app/(app)/ranking/page.tsx`
- 新增：`src/components/ranking/RankRow.tsx`

- [ ] **Step 1：實作 RankRow**

建立 `src/components/ranking/RankRow.tsx`：

```tsx
import Link from 'next/link';
import { cn } from '~/lib/utils';

interface RankRowProps {
  rank: number;
  userId: string;
  name: string | null;
  image: string | null;
  value: number;
  formatValue: (v: number) => string;
  isMe: boolean;
}

export function RankRow({ rank, userId, name, image, value, formatValue, isMe }: RankRowProps) {
  return (
    <Link
      href={isMe ? '/dashboard' : `/friends/${userId}`}
      className={cn(
        'flex items-center gap-4 px-6 py-4',
        isMe && 'bg-red-50',
      )}
    >
      <span className={cn(
        'w-10 text-base font-semibold',
        isMe ? 'text-primary' : 'text-foreground',
      )}>
        {rank}
      </span>
      {image ? (
        <img src={image} alt="" className="h-10 w-10 rounded-full object-cover" />
      ) : (
        <div className="h-10 w-10 rounded-full bg-muted" />
      )}
      <div className="flex-1">
        <p className={cn('text-sm font-medium', isMe && 'text-primary font-semibold')}>
          {isMe ? 'You' : name ?? 'Unknown'}
        </p>
        {isMe && <p className="text-xs text-primary/60">That&apos;s you!</p>}
      </div>
      <span className={cn(
        'text-base font-medium',
        isMe ? 'text-primary font-semibold' : 'text-foreground',
      )}>
        {formatValue(value)}
      </span>
    </Link>
  );
}
```

- [ ] **Step 2：實作 Ranking Page**

建立 `src/app/(app)/ranking/page.tsx`：

```tsx
'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { trpc } from '~/utils/trpc';
import { RankRow } from '~/components/ranking/RankRow';

type Dimension = 'hours' | 'streak' | 'tasks';
type TimeRange = 'week' | 'month';

function formatValue(dimension: Dimension, value: number): string {
  if (dimension === 'hours') {
    const h = Math.floor(value / 60);
    const m = value % 60;
    return h > 0 ? `${h}h ${m.toString().padStart(2, '0')}m` : `${m}m`;
  }
  if (dimension === 'streak') return `${value}d`;
  return `${value}`;
}

export default function RankingPage() {
  const { data: session } = useSession();
  const [dimension, setDimension] = useState<Dimension>('hours');
  const [timeRange, setTimeRange] = useState<TimeRange>('week');

  const leaderboardQuery = trpc.ranking.leaderboard.useQuery({ dimension, timeRange });

  const dimensions: { key: Dimension; label: string }[] = [
    { key: 'hours', label: 'Study Hours' },
    { key: 'streak', label: 'Streak' },
    { key: 'tasks', label: 'Tasks Done' },
  ];

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-4xl font-medium tracking-tight">Ranking</h1>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {dimensions.map(({ key, label }) => (
            <button
              key={key}
              className={`rounded px-3 py-1.5 text-sm font-medium ${
                dimension === key ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
              }`}
              onClick={() => setDimension(key)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Time range toggle (不適用於 streak) */}
        {dimension !== 'streak' && (
          <div className="flex gap-2">
            {(['week', 'month'] as const).map((tr) => (
              <button
                key={tr}
                className={`rounded px-3 py-1.5 text-sm font-medium ${
                  timeRange === tr ? 'bg-foreground text-white' : 'bg-muted text-muted-foreground'
                }`}
                onClick={() => setTimeRange(tr)}
              >
                {tr === 'week' ? 'This Week' : 'This Month'}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="divide-y rounded-lg border">
        {/* Header */}
        <div className="flex items-center gap-4 bg-muted/50 px-6 py-3">
          <span className="w-10 text-xs font-medium text-muted-foreground">#</span>
          <span className="w-10" />
          <span className="flex-1 text-xs font-medium text-muted-foreground">Name</span>
          <span className="w-24 text-right text-xs font-medium text-muted-foreground">
            {dimension === 'hours' ? 'Hours' : dimension === 'streak' ? 'Days' : 'Tasks'}
          </span>
        </div>

        {leaderboardQuery.isLoading ? (
          <p className="p-6 text-center text-sm text-muted-foreground">載入中...</p>
        ) : leaderboardQuery.data?.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">
            加入好友就能看到排行榜！
          </p>
        ) : (
          leaderboardQuery.data?.map((entry) => (
            <RankRow
              key={entry.userId}
              rank={entry.rank}
              userId={entry.userId}
              name={entry.name}
              image={entry.image}
              value={entry.value}
              formatValue={(v) => formatValue(dimension, v)}
              isMe={entry.userId === session?.user?.id}
            />
          ))
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3：Commit**

```bash
git add src/app/\(app\)/ranking/ src/components/ranking/
git commit -m "feat: add ranking page with multi-dimension leaderboard"
```

---

## Task 14：Settings Page — 通知設定

**檔案：**
- 新增：`src/components/settings/NotificationToggle.tsx`
- 新增：`src/app/(app)/settings/page.tsx`

- [ ] **Step 1：實作 NotificationToggle**

建立 `src/components/settings/NotificationToggle.tsx`：

```tsx
'use client';

import { usePushSubscription } from '~/hooks/usePushSubscription';

export function NotificationToggle() {
  const { permission, isEnabled, deviceCount, isLoading, toggle } = usePushSubscription();

  return (
    <div className="space-y-5 rounded-lg border p-6">
      {/* Main toggle */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="font-medium">Push Notifications</h3>
          <p className="text-sm text-muted-foreground">
            Receive notifications for friend milestones, ranking changes, and study reminders
          </p>
        </div>
        <button
          onClick={() => toggle(!isEnabled)}
          disabled={isLoading || permission === 'denied'}
          className={`relative h-6 w-11 rounded-full transition-colors ${
            isEnabled ? 'bg-primary' : 'bg-muted'
          }`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
              isEnabled ? 'left-[22px]' : 'left-0.5'
            }`}
          />
        </button>
      </div>

      {permission === 'denied' && (
        <p className="text-sm text-destructive">
          Notifications blocked by browser. Enable in browser settings.
        </p>
      )}

      {deviceCount > 0 && (
        <p className="text-xs text-muted-foreground">
          {deviceCount} device(s) registered
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 2：實作 Settings Page**

建立 `src/app/(app)/settings/page.tsx`：

```tsx
import { NotificationToggle } from '~/components/settings/NotificationToggle';

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-4xl font-medium tracking-tight">Settings</h1>

      <div className="space-y-4">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Notifications
        </p>
        <NotificationToggle />
      </div>
    </div>
  );
}
```

- [ ] **Step 3：Commit**

```bash
git add src/components/settings/ src/app/\(app\)/settings/
git commit -m "feat: add settings page with notification toggle"
```

---

## Task 15：Sidebar Navigation 更新

**檔案：**
- 修改：`src/components/layout/Sidebar.tsx`
- 修改：`src/components/layout/MobileSidebar.tsx`

- [ ] **Step 1：更新 Sidebar**

在 `src/components/layout/Sidebar.tsx` 中，在 Dashboard link 之後加入 Social 區塊：

```tsx
import { LayoutDashboard, Plus, Users, Trophy, Settings } from 'lucide-react';

// 在 {/* Dashboard link */} 之後，{/* Board list */} 之前加入：

{/* Social section */}
<div className="mt-4">
  <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-sidebar-muted-foreground">
    Social
  </p>
  {[
    { href: '/friends', icon: Users, label: 'Friends' },
    { href: '/ranking', icon: Trophy, label: 'Ranking' },
    { href: '/settings', icon: Settings, label: 'Settings' },
  ].map(({ href, icon: Icon, label }) => {
    const isActive = pathname === href;
    return (
      <Link
        key={href}
        href={href}
        className={cn(
          'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors relative',
          isActive
            ? 'text-sidebar-accent font-medium before:absolute before:left-0 before:top-1 before:bottom-1 before:w-1 before:rounded-full before:bg-sidebar-accent'
            : 'text-sidebar-muted-foreground hover:bg-sidebar-muted hover:text-sidebar-foreground',
        )}
      >
        <Icon size={16} />
        {label}
      </Link>
    );
  })}
</div>
```

- [ ] **Step 2：同步更新 MobileSidebar**

以相同模式在 `src/components/layout/MobileSidebar.tsx` 中加入社交導航項目。

- [ ] **Step 3：驗證 build**

```bash
pnpm build
```

- [ ] **Step 4：Commit**

```bash
git add src/components/layout/Sidebar.tsx src/components/layout/MobileSidebar.tsx
git commit -m "feat: add Friends, Ranking, Settings navigation to sidebar"
```

---

## Task 16：最終驗證與整合測試

- [ ] **Step 1：執行全部單元測試**

```bash
pnpm test-unit
```

預期：所有測試通過。

- [ ] **Step 2：執行 type check**

```bash
pnpm typecheck
```

預期：無型別錯誤。

- [ ] **Step 3：執行 build**

```bash
pnpm build
```

預期：Build 成功。

- [ ] **Step 4：手動驗證清單**

| 功能 | 驗證項目 |
|------|----------|
| 邀請連結 | 產生 → 複製 → 另一帳號開啟 → Accept/Decline |
| 好友列表 | 接受後雙方都能看到對方 |
| 好友統計 | 點擊好友名稱 → 看到摘要卡片 + 圖表 |
| 排行榜 | 切換維度 + 時間範圍 → 數據正確更新 |
| 推播通知 | 啟用 → 好友新增時間 → 收到里程碑通知 |
| Settings | Toggle on/off → 狀態持久化 |
| Edge cases | 過期連結、已用連結、自己邀請自己 → 正確錯誤訊息 |

- [ ] **Step 5：最終 Commit**

```bash
git add -A
git commit -m "feat: complete Phase 3 social features integration"
```

---

## 附錄：Cloud Scheduler 設定（部署時）

部署到 Cloud Run 後，設定 Google Cloud Scheduler：

```bash
gcloud scheduler jobs create http daily-study-reminder \
  --schedule="0 12 * * *" \
  --uri="https://YOUR_CLOUD_RUN_URL/api/cron/daily-reminder" \
  --http-method=POST \
  --headers="Authorization=Bearer YOUR_CRON_SECRET" \
  --time-zone="UTC" \
  --description="Daily study reminder at 20:00 Taiwan time"
```

- `0 12 * * *` UTC = 20:00 Taiwan time (UTC+8)
- Free tier: 3 jobs/account — 足夠使用
