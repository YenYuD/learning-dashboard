# Phase 3 Design: Social Features & Push Notifications

## Overview

Phase 3 adds social features to the Learning Dashboard, enabling users to connect with friends, compare learning progress, and receive push notifications. The goal is to create social motivation and accountability.

## Prerequisites

- Phase 2 authentication (NextAuth.js + Google OAuth) must be in place
- Existing User model with Board/TimeEntry relationships
- Deployment on Cloud Run

---

## 1. Friend System

### 1.1 Invitation Flow

- Users generate **one-time invitation links** (expire after 7 days)
- Link format: `https://{domain}/invite/{token}`
- Once used, the link is marked with `usedById` + `usedAt` and cannot be reused

**Full flow:**

```
User A clicks "Invite Friend"
  → Backend creates FriendInvite (token + 7-day expiry)
  → Returns link → User A copies and shares it

User B opens the link
  → Not logged in → Redirect to login/register with callbackUrl=/invite/{token}
  → After login → Redirect back to invite page
  → Logged in → Show "A invited you to be friends"
  → Accept → Create Friendship (ACCEPTED)
  → Decline → Create Friendship (DECLINED)
  → Link marked as used

Edge cases:
  → Expired link → "This invitation has expired"
  → Already used → "This link has already been used"
  → Self-invite → "You cannot add yourself as a friend"
  → Already friends → "You are already friends"
```

### 1.2 Friend Relationship

- **Bidirectional confirmation required**: requester sends invite, addressee must accept
- Friendship status: `PENDING → ACCEPTED` or `PENDING → DECLINED`
- Users can remove friends (deletes Friendship record)

### 1.3 Friend Management Page

- Friend list: all ACCEPTED friends with name, avatar, this week's study hours
- Pending invites: received PENDING requests with accept/decline buttons
- Invite button: generate one-time link, one-click copy
- Remove friend option

### 1.4 tRPC Router

```
friendRouter:
  - invite.create    → Generate invitation link
  - invite.use       → Accept/decline invitation
  - invite.validate  → Check if link is valid (called when opening link)
  - list             → Get friend list
  - pending          → Get pending invitations
  - remove           → Remove a friend
```

---

## 2. Ranking / Leaderboard

### 2.1 Ranking Dimensions (switchable)

| Dimension | Calculation | Time Range |
|-----------|------------|------------|
| Study hours | `SUM(timeEntry.duration)` | This week / This month |
| Streak | Consecutive days with at least one timeEntry | Cumulative |
| Tasks completed | Tasks moved to "Done" list | This week / This month |

### 2.2 Query Approach

No additional database model needed — calculate in real-time from existing data:

```
1. Query all friend IDs (Friendship where status = ACCEPTED)
2. Use friendIds + own ID to groupBy timeEntry
   → groupBy: userId (via board.user_id)
   → where: createdAt >= startOfWeek
   → _sum: duration
3. Sort and return
```

**Streak calculation:**

```
Starting from today, check each previous day for any timeEntry:
  → Has entry → streak + 1, continue
  → No entry → stop, return streak count
```

Real-time calculation is fine given the small number of friends. If optimization is needed later, a `UserStats` cache table can be added.

### 2.3 Leaderboard UI

- Default view: this week's study hours ranking
- Tabs to switch dimension (hours / streak / tasks)
- Hours and tasks support time range toggle (this week / this month)
- Own ranking is highlighted
- Each row: rank, avatar, name, value
- Clicking a person navigates to their stats page

### 2.4 tRPC Router

```
rankingRouter:
  - leaderboard  → Get leaderboard (params: dimension, timeRange)
  - myStats      → Get own stats across all dimensions
```

---

## 3. Friend Stats Page (Privacy: Stats Only)

Friends can only see **aggregated statistics**, not specific board content (tasks, lists).

### 3.1 Visible Data

```
Friend "Alice"'s Learning Stats
├── This week's study hours: 12h 30m
├── Current streak: 15 days
├── Tasks completed this week: 8
├── Weekly study hours line chart (Mon–Sun)
└── Board time distribution pie chart
    (shows Board name + hours only, no tasks/lists visible)
```

### 3.2 Access Control

All queries verify the viewer is an accepted friend (`Friendship.status = ACCEPTED`). Non-friends are blocked.

### 3.3 Entry Points

- Friend list → click name → `/friends/{userId}`
- Leaderboard → click person → same page

### 3.4 tRPC Router

```
friendStatsRouter:
  - getSummary(friendId)       → Hours / streak / task count
  - getWeeklyChart(friendId)   → Daily study hours for the week (line chart)
  - getBoardBreakdown(friendId) → Hours per board (pie chart)
```

---

## 4. Push Notifications (PWA + Web Push)

### 4.1 Architecture

```
Browser (Frontend)  ←→  Service Worker  ←→  Push Service (browser vendor)
                                                  ↑
                                            Next.js Backend
                                            (web-push package)
```

- **Frontend**: requests notification permission, registers Service Worker
- **Backend**: sends push messages via `web-push` package
- **Push Service**: browser vendor (Google/Mozilla) delivers to device
- **Service Worker**: receives push event and displays system notification (works even when page is closed)

### 4.2 Subscription Flow

```
1. User logs in → frontend checks if browser supports Push API
2. Browser shows native "Allow notifications?" prompt
3. User allows
   → Browser generates PushSubscription (endpoint, p256dh, auth)
   → Frontend sends to backend → stored in PushSubscription table
4. User denies
   → Nothing stored
   → Can re-enable later in settings page
```

### 4.3 Notification Types & Triggers

| Type | Trigger | Frequency |
|------|---------|-----------|
| Friend milestone | Real-time (on timeEntry create) | Only when crossing a threshold (5hr, 10hr, 20hr, 50hr) |
| Ranking change | Real-time (on timeEntry create) | Only when ranking actually changes |
| Study reminder | Cloud Scheduler → daily 20:00 (Taiwan time) | Max once per day |

**Friend milestone (real-time):**

```
User A creates a timeEntry
  → Calculate A's cumulative weekly hours
  → Check if a milestone threshold was just crossed (5hr, 10hr, 20hr, 50hr)
  → If crossed → notify A's friends: "Alice just hit 10 hours this week!"
  → If not crossed → do nothing
```

**Ranking change (real-time):**

```
User A creates a timeEntry
  → Recalculate this week's ranking
  → Compare with previous ranking
  → If someone was overtaken (A passed B)
  → Notify B: "Alice passed you! You're now ranked #3"
```

**Study reminder (daily cron):**

```
Every day at 20:00 Taiwan time
  → Find users with no timeEntry today
  → Filter to those with notifications enabled (PushSubscription.enabled = true)
  → Send push: "You haven't started studying today!"
```

### 4.4 Cron Job on Cloud Run

Use **Google Cloud Scheduler** to trigger the daily reminder:

```
Cloud Scheduler (cron schedule: 0 12 * * * UTC = 20:00 Taiwan)
  → Sends HTTP POST to Cloud Run endpoint
  → Hits /api/cron/daily-reminder
  → Endpoint runs reminder logic
```

Cloud Scheduler free tier: 3 jobs/account — sufficient for this use case.

The cron endpoint should verify requests come from Cloud Scheduler (check `X-CloudScheduler` header or use OIDC authentication).

### 4.5 PWA Setup

| File | Purpose |
|------|---------|
| `public/manifest.json` | App name, icons, theme color, `display: standalone` |
| Service Worker | Listen for `push` event → show notification; listen for `notificationclick` → navigate to app |
| `next.config.ts` | Add `next-pwa` package configuration for Service Worker generation |

### 4.6 VAPID Keys

Web Push requires a VAPID key pair for server identity verification:

```bash
npx web-push generate-vapid-keys
```

```env
VAPID_PUBLIC_KEY=...      # Used by both frontend and backend
VAPID_PRIVATE_KEY=...     # Backend only
VAPID_EMAIL=mailto:your@email.com
```

### 4.7 Notification Toggle

- Settings page: single toggle "Receive push notifications"
- ON → `PushSubscription.enabled = true`
- OFF → `PushSubscription.enabled = false` (subscription record kept for easy re-enable)
- One user can have multiple PushSubscriptions (different devices/browsers), toggle controls all

### 4.8 tRPC Router

```
notificationRouter:
  - subscribe    → Store PushSubscription from frontend
  - unsubscribe  → Remove subscription for a specific device
  - toggle       → Enable/disable all notifications
  - status       → Query current notification state (on/off, device count)
```

---

## 5. Data Model

### New Models

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

  @@unique([requesterId, addresseeId])
  @@index([addresseeId])
}

enum FriendshipStatus {
  PENDING
  ACCEPTED
  DECLINED
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

### User Model Additions

```prisma
model User {
  // ... existing fields
  sentRequests      Friendship[]       @relation("SentRequests")
  receivedRequests  Friendship[]       @relation("ReceivedRequests")
  friendInvites     FriendInvite[]
  pushSubscriptions PushSubscription[]
}
```

---

## 6. New Pages & Routes

| Route | Purpose |
|-------|---------|
| `/invite/[token]` | Invitation landing page |
| `/friends` | Friend list + pending invites + invite button |
| `/friends/[userId]` | Friend's stats page |
| `/ranking` | Leaderboard page |
| `/settings` | Notification toggle (extend existing settings if any) |
| `/api/cron/daily-reminder` | Cron endpoint for study reminders |

---

## 7. New Dependencies

| Package | Purpose |
|---------|---------|
| `web-push` | Server-side Web Push protocol implementation |
| `next-pwa` | PWA support + Service Worker generation for Next.js |

---

## 8. Infrastructure

- **Google Cloud Scheduler**: 1 cron job for daily study reminder (20:00 Taiwan time)
- **VAPID keys**: stored as environment variables in Cloud Run
- **Cloud Scheduler → Cloud Run auth**: use OIDC token or verify `X-CloudScheduler` header
