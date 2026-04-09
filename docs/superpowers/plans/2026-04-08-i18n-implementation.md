# i18n Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add bilingual support (Traditional Chinese + English) to the Learning Dashboard using next-intl with URL-based locale routing.

**Architecture:** All pages move under `app/[locale]/`. Middleware handles locale detection and redirection. Translation strings live in `messages/{locale}/*.json` organized by namespace. tRPC routers return error codes (not translated strings), and Zod schemas become factory functions accepting a translator.

**Tech Stack:** next-intl, Next.js 15 App Router, tRPC, Zod, sonner

**Branch:** `feat/i18n`

---

## File Structure Overview

```
NEW FILES:
  src/i18n/                        # i18n configuration
  ├── config.ts                    # Locale list, default locale constants
  ├── request.ts                   # next-intl server config (getRequestConfig)
  └── routing.ts                   # Routing config for middleware + navigation
  src/i18n/navigation.ts           # Locale-aware Link, redirect, useRouter
  middleware.ts                     # Root middleware (replaces src/middleware.ts)
  messages/zh/                     # Chinese translation files
  ├── common.json
  ├── nav.json
  ├── board.json
  ├── task.json
  ├── list.json
  ├── timer.json
  ├── auth.json
  ├── friends.json
  ├── settings.json
  ├── dashboard.json
  ├── ranking.json
  └── errors.json
  messages/en/                     # English translation files (mirror zh/)
  src/components/LanguageSwitcher.tsx

MOVED (into [locale]):
  src/app/[locale]/layout.tsx      # was src/app/layout.tsx (split)
  src/app/[locale]/(app)/...       # was src/app/(app)/...
  src/app/[locale]/(auth)/...      # was src/app/(auth)/...
  src/app/[locale]/invite/...      # was src/app/invite/...
  src/app/[locale]/page.tsx        # was src/app/page.tsx

STAYS (no locale prefix):
  src/app/layout.tsx               # Minimal root layout (html, body, providers)
  src/app/api/...                  # All API routes unchanged

MODIFIED:
  next.config.ts                   # Add withNextIntl wrapper
  src/lib/validations/auth.ts      # Schema factories
  src/server/routers/friend.ts     # Error codes
  src/server/routers/friendStats.ts # Error codes
  src/server/routers/board.ts      # Error codes
  src/server/routers/list.ts       # Error codes
  src/server/routers/user.ts       # Error codes
  ~30 component files              # t() calls replacing hardcoded strings
```

---

## Task 1: Install next-intl and create i18n config

**Files:**
- Modify: `package.json`
- Create: `src/i18n/config.ts`
- Create: `src/i18n/routing.ts`
- Create: `src/i18n/request.ts`
- Create: `src/i18n/navigation.ts`

- [ ] **Step 1: Install next-intl**

```bash
npm install next-intl
```

- [ ] **Step 2: Create `src/i18n/config.ts`**

```typescript
export const locales = ['zh', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'zh';
```

- [ ] **Step 3: Create `src/i18n/routing.ts`**

```typescript
import { defineRouting } from 'next-intl/routing';
import { locales, defaultLocale } from './config';

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: 'always',
});
```

- [ ] **Step 4: Create `src/i18n/navigation.ts`**

```typescript
import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
```

- [ ] **Step 5: Create `src/i18n/request.ts`**

```typescript
import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: {
      ...(await import(`../../messages/${locale}/common.json`)).default,
      ...(await import(`../../messages/${locale}/nav.json`)).default,
      ...(await import(`../../messages/${locale}/board.json`)).default,
      ...(await import(`../../messages/${locale}/task.json`)).default,
      ...(await import(`../../messages/${locale}/list.json`)).default,
      ...(await import(`../../messages/${locale}/timer.json`)).default,
      ...(await import(`../../messages/${locale}/auth.json`)).default,
      ...(await import(`../../messages/${locale}/friends.json`)).default,
      ...(await import(`../../messages/${locale}/settings.json`)).default,
      ...(await import(`../../messages/${locale}/dashboard.json`)).default,
      ...(await import(`../../messages/${locale}/ranking.json`)).default,
      ...(await import(`../../messages/${locale}/errors.json`)).default,
    },
  };
});
```

- [ ] **Step 6: Commit**

```bash
git add src/i18n/ package.json package-lock.json
git commit -m "feat(i18n): install next-intl and create i18n config"
```

---

## Task 2: Create all translation JSON files

**Files:**
- Create: `messages/zh/common.json`
- Create: `messages/zh/nav.json`
- Create: `messages/zh/board.json`
- Create: `messages/zh/task.json`
- Create: `messages/zh/list.json`
- Create: `messages/zh/timer.json`
- Create: `messages/zh/auth.json`
- Create: `messages/zh/friends.json`
- Create: `messages/zh/settings.json`
- Create: `messages/zh/dashboard.json`
- Create: `messages/zh/ranking.json`
- Create: `messages/zh/errors.json`
- Create: `messages/en/*.json` (all 12 files, mirroring zh)

All keys extracted from the codebase exploration. These are the complete, exact strings.

- [ ] **Step 1: Create `messages/zh/common.json`**

```json
{
  "cancel": "取消",
  "confirm": "確認",
  "save": "儲存",
  "saving": "儲存中...",
  "delete": "刪除",
  "deleting": "刪除中...",
  "edit": "編輯",
  "add": "新增",
  "loading": "載入中...",
  "optional": "選填",
  "name": "名稱",
  "description": "描述",
  "color": "顏色",
  "icon": "Icon",
  "backToHome": "返回首頁",
  "hours": "小時",
  "minutes": "分鐘",
  "days": "天",
  "noRecords": "尚無記錄",
  "unsavedTimerWarning": "您有未儲存的計時紀錄，確定要離開嗎？",
  "or": "or"
}
```

- [ ] **Step 2: Create `messages/zh/nav.json`**

```json
{
  "dashboard": "Dashboard",
  "friends": "Friends",
  "ranking": "Ranking",
  "settings": "Settings",
  "boards": "Boards",
  "noBoards": "No boards yet",
  "addBoard": "新增 Board",
  "signOut": "登出"
}
```

- [ ] **Step 3: Create `messages/zh/board.json`**

```json
{
  "createBoard": "建立新 Board",
  "selectType": "選擇類型",
  "taskBased": "任務型",
  "taskBasedDesc": "建立任務清單，逐步完成學習目標。適合有明確步驟的學習，例如讀書計畫、程式課題。",
  "timeOnly": "計時型",
  "timeOnlyDesc": "單純記錄投入的時間，不需要任務列表。適合難以拆解成任務的練習，例如滑雪、樂器。",
  "boardInfo": "Board 資訊",
  "boardName": "名稱",
  "boardNamePlaceholder": "例：日文 N2 備考",
  "create": "建立 Board",
  "creating": "建立中...",
  "createError": "建立 Board 失敗",
  "boardNameRequired": "Board 名稱為必填",
  "boardNameMaxLength": "Board 名稱不可超過 50 字",
  "boardSettings": "Board 設定",
  "boardNameInputPlaceholder": "Board 名稱",
  "updateError": "更新 Board 失敗",
  "deleteBoard": "刪除 Board",
  "confirmDelete": "確認刪除？此操作無法復原",
  "deleteError": "刪除 Board 失敗",
  "boardNotFound": "Board 不存在",
  "boardNotFoundDesc": "找不到這個 Board，它可能已被刪除",
  "emptyBoardTitle": "這個 Board 還沒有 List",
  "emptyBoardDesc": "新增第一個 List 來開始管理你的任務",
  "addList": "新增 List",
  "sortError": "排序更新失敗，已自動恢復"
}
```

- [ ] **Step 4: Create `messages/zh/task.json`**

```json
{
  "createTask": "新增任務",
  "taskTitle": "任務標題",
  "taskTitlePlaceholder": "例如：複習 N2 單字 Unit 5",
  "taskTitleRequired": "任務標題為必填",
  "descriptionPlaceholder": "補充任務細節、參考資料連結...",
  "addToList": "加入清單",
  "createError": "建立任務失敗",
  "editTask": "編輯任務",
  "titleLabel": "標題",
  "titlePlaceholder": "任務名稱",
  "descriptionLabel": "描述",
  "descriptionOptionalPlaceholder": "選填描述...",
  "deleteTask": "刪除任務",
  "confirmDeleteTask": "確認刪除？",
  "updateError": "更新任務失敗",
  "deleteError": "刪除任務失敗"
}
```

- [ ] **Step 5: Create `messages/zh/list.json`**

```json
{
  "createList": "新增清單",
  "listName": "清單名稱",
  "listNamePlaceholder": "例如：To Do、In Progress...",
  "listNameRequired": "清單名稱為必填",
  "create": "建立清單",
  "createError": "建立清單失敗",
  "rename": "重新命名",
  "deleteList": "刪除清單",
  "updateError": "更新清單失敗",
  "deleteError": "刪除清單失敗"
}
```

- [ ] **Step 6: Create `messages/zh/timer.json`**

```json
{
  "taskTimer": "任務計時",
  "weeklyTotal": "本周累計",
  "monthlyTotal": "本月累計",
  "addManualTime": "手動新增時間",
  "duration": "時長",
  "date": "日期",
  "note": "備註",
  "notePlaceholder": "選填",
  "timerNote": "計時器",
  "manualNote": "手動新增",
  "timeSaved": "時間記錄已儲存",
  "saveError": "儲存失敗",
  "recordDeleted": "記錄已刪除",
  "deleteError": "刪除失敗",
  "taskTimeRecords": "此任務的時間記錄",
  "recentRecords": "最近記錄",
  "hoursValidation": "小時數須介於 0 ~ 23",
  "hoursNegative": "小時數不可為負",
  "minutesValidation": "分鐘數須介於 0 ~ 59",
  "minutesNegative": "分鐘數不可為負",
  "selectDate": "請選擇日期",
  "durationPositive": "時長必須大於 0 分鐘"
}
```

- [ ] **Step 7: Create `messages/zh/auth.json`**

```json
{
  "login": "登入",
  "loggingIn": "登入中...",
  "register": "註冊",
  "registering": "註冊中...",
  "createAccount": "建立帳號",
  "startTracking": "開始追蹤你的學習進度",
  "loginTracking": "登入以追蹤你的學習進度",
  "continueDemo": "Continue as Demo",
  "continueGoogle": "Continue with Google",
  "continueGithub": "Continue with GitHub",
  "orSignInEmail": "or sign in with email",
  "noAccount": "還沒有帳號？",
  "hasAccount": "已有帳號？",
  "nameLabel": "名稱",
  "namePlaceholder": "你的名字",
  "emailPlaceholder": "your@email.com",
  "passwordLabel": "密碼",
  "passwordPlaceholder": "至少 6 個字元",
  "confirmPasswordLabel": "確認密碼",
  "confirmPasswordPlaceholder": "再次輸入密碼",
  "invalidCredentials": "Email 或密碼不正確",
  "demoLoginFailed": "Demo 登入失敗，請確認 seed 已執行",
  "registerFailed": "註冊失敗",
  "registerSuccessLoginFailed": "註冊成功但自動登入失敗，請手動登入",
  "networkError": "網路錯誤，請稍後再試",
  "emailRequired": "Email 為必填",
  "emailInvalid": "請輸入有效的 Email 格式",
  "passwordRequired": "密碼為必填",
  "passwordMinLength": "密碼至少 6 個字元",
  "passwordMaxLength": "密碼不可超過 100 個字元",
  "nameRequired": "名稱為必填",
  "nameMaxLength": "名稱不可超過 50 個字元",
  "confirmPasswordRequired": "請再次輸入密碼",
  "passwordMismatch": "密碼不一致"
}
```

- [ ] **Step 8: Create `messages/zh/friends.json`**

```json
{
  "title": "好友",
  "inviteFriend": "邀請好友",
  "allFriends": "所有好友",
  "pending": "待處理",
  "noFriends": "還沒有好友，點擊上方按鈕邀請朋友吧！",
  "noPending": "沒有待處理的好友邀請",
  "inviteTitle": "Invite a Friend",
  "inviteDesc": "Share this link with your friend. The link expires in 7 days and can only be used once.",
  "generating": "Generating...",
  "copy": "Copy",
  "copied": "Copied",
  "inviteTip": "Tip: You can also share the link via messaging apps",
  "invitedYou": "{name} invited you",
  "inviteAcceptDesc": "Accept the invitation to become friends and compare your learning progress together.",
  "accept": "Accept",
  "decline": "Decline",
  "inviteNotFound": "此邀請連結無效。",
  "inviteExpired": "此邀請連結已過期。",
  "inviteUsed": "此邀請連結已被使用。",
  "inviteSelf": "你不能加自己為好友。",
  "alreadyFriends": "你們已經是好友了！",
  "unknownError": "未知錯誤"
}
```

- [ ] **Step 9: Create `messages/zh/settings.json`**

```json
{
  "title": "Settings",
  "profile": "Profile",
  "profileUpdated": "個人資料已更新",
  "profileUpdateError": "更新失敗",
  "notifications": "Notifications",
  "pushNotifications": "Push Notifications",
  "pushDesc": "Receive notifications for friend milestones, ranking changes, and study reminders",
  "notificationsBlocked": "Notifications blocked by browser. Enable in browser settings.",
  "devicesRegistered": "{count} device(s) registered",
  "language": "Language",
  "nameRequired": "名稱為必填",
  "nameMaxLength": "名稱不可超過 50 字"
}
```

- [ ] **Step 10: Create `messages/zh/dashboard.json`**

```json
{
  "title": "Learning Dashboard",
  "today": "今天",
  "thisWeek": "本週",
  "thisMonth": "本月",
  "thisYear": "本年",
  "todayStudy": "今日學習",
  "weekStudy": "本週學習",
  "monthStudy": "本月學習",
  "yearStudy": "本年學習",
  "streak": "連續學習",
  "vsYesterday": "昨天",
  "vsLastWeek": "上週",
  "vsLastMonth": "上月",
  "timeDistToday": "今日時間分佈",
  "timeDistWeek": "本週時間分佈",
  "timeDistMonth": "本月時間分佈",
  "timeDistYear": "本年時間分佈",
  "noRecordsToday": "今日尚無學習記錄",
  "noRecordsWeek": "本週尚無學習記錄",
  "noRecordsMonth": "本月尚無學習記錄",
  "noRecordsYear": "本年尚無學習記錄",
  "timeShareToday": "今日時間佔比",
  "timeShareWeek": "本週時間佔比",
  "timeShareMonth": "本月時間佔比",
  "timeShareYear": "本年時間佔比",
  "trendToday": "今日趨勢",
  "trendWeek": "每日趨勢（近7天）",
  "trendMonth": "每日趨勢（近30天）",
  "trendYear": "每日趨勢（近365天）",
  "noTrendToday": "今日尚無學習記錄",
  "noTrendWeek": "近七天尚無學習記錄",
  "noTrendMonth": "近三十天尚無學習記錄",
  "noTrendYear": "本年尚無學習記錄",
  "studyHours": "學習時數",
  "monthlyCalendar": "本月學習日曆",
  "monthlyBoardBreakdown": "{month}月各科時數",
  "monthlyTotal": "本月總計",
  "noMonthRecords": "本月尚無學習記錄",
  "monthNames": ["一", "二", "三", "四", "五", "六", "七", "八", "九", "十", "十一", "十二"],
  "weekdayHeaders": ["一", "二", "三", "四", "五", "六", "日"],
  "metaTitle": "儀表板"
}
```

- [ ] **Step 11: Create `messages/zh/ranking.json`**

```json
{
  "title": "Ranking",
  "studyHours": "Study Hours",
  "streakLabel": "Streak",
  "thisWeek": "This Week",
  "thisMonth": "This Month",
  "nameColumn": "Name",
  "hoursColumn": "Hours",
  "daysColumn": "Days",
  "noRanking": "加入好友就能看到排行榜！"
}
```

- [ ] **Step 12: Create `messages/zh/errors.json`**

```json
{
  "INVITE_NOT_FOUND": "邀請連結不存在",
  "INVITE_USED": "此連結已被使用",
  "INVITE_EXPIRED": "此連結已過期",
  "CANNOT_ADD_SELF": "不能加自己為好友",
  "FRIEND_ALREADY_EXISTS": "你們已經是好友了",
  "FRIEND_REQUEST_NOT_FOUND": "找不到該好友邀請",
  "NOT_FRIENDS": "你們不是好友",
  "BOARD_NOT_FOUND": "Board 不存在",
  "UNKNOWN_ERROR": "發生未知錯誤"
}
```

- [ ] **Step 13: Create all `messages/en/*.json` files**

Create English translations mirroring each zh file. Key examples:

**`messages/en/common.json`:**
```json
{
  "cancel": "Cancel",
  "confirm": "Confirm",
  "save": "Save",
  "saving": "Saving...",
  "delete": "Delete",
  "deleting": "Deleting...",
  "edit": "Edit",
  "add": "Add",
  "loading": "Loading...",
  "optional": "Optional",
  "name": "Name",
  "description": "Description",
  "color": "Color",
  "icon": "Icon",
  "backToHome": "Back to Home",
  "hours": "hours",
  "minutes": "minutes",
  "days": "days",
  "noRecords": "No records yet",
  "unsavedTimerWarning": "You have an unsaved timer recording. Are you sure you want to leave?",
  "or": "or"
}
```

**`messages/en/nav.json`:**
```json
{
  "dashboard": "Dashboard",
  "friends": "Friends",
  "ranking": "Ranking",
  "settings": "Settings",
  "boards": "Boards",
  "noBoards": "No boards yet",
  "addBoard": "Add Board",
  "signOut": "Sign Out"
}
```

**`messages/en/board.json`:**
```json
{
  "createBoard": "Create Board",
  "selectType": "Select Type",
  "taskBased": "Task-based",
  "taskBasedDesc": "Create task lists to complete learning goals step by step. Great for structured learning like study plans or coding exercises.",
  "timeOnly": "Time Only",
  "timeOnlyDesc": "Simply record time invested without task lists. Great for practice-based activities like skiing or music.",
  "boardInfo": "Board Info",
  "boardName": "Name",
  "boardNamePlaceholder": "e.g. Japanese N2 Prep",
  "create": "Create Board",
  "creating": "Creating...",
  "createError": "Failed to create board",
  "boardNameRequired": "Board name is required",
  "boardNameMaxLength": "Board name must be 50 characters or less",
  "boardSettings": "Board Settings",
  "boardNameInputPlaceholder": "Board name",
  "updateError": "Failed to update board",
  "deleteBoard": "Delete Board",
  "confirmDelete": "Confirm delete? This cannot be undone",
  "deleteError": "Failed to delete board",
  "boardNotFound": "Board Not Found",
  "boardNotFoundDesc": "This board could not be found. It may have been deleted.",
  "emptyBoardTitle": "This board has no lists yet",
  "emptyBoardDesc": "Add your first list to start managing tasks",
  "addList": "Add List",
  "sortError": "Sort update failed, auto-recovered"
}
```

**`messages/en/task.json`:**
```json
{
  "createTask": "Add Task",
  "taskTitle": "Task Title",
  "taskTitlePlaceholder": "e.g. Review N2 Vocabulary Unit 5",
  "taskTitleRequired": "Task title is required",
  "descriptionPlaceholder": "Add task details, reference links...",
  "addToList": "Add to List",
  "createError": "Failed to create task",
  "editTask": "Edit Task",
  "titleLabel": "Title",
  "titlePlaceholder": "Task name",
  "descriptionLabel": "Description",
  "descriptionOptionalPlaceholder": "Optional description...",
  "deleteTask": "Delete Task",
  "confirmDeleteTask": "Confirm delete?",
  "updateError": "Failed to update task",
  "deleteError": "Failed to delete task"
}
```

**`messages/en/list.json`:**
```json
{
  "createList": "Add List",
  "listName": "List Name",
  "listNamePlaceholder": "e.g. To Do, In Progress...",
  "listNameRequired": "List name is required",
  "create": "Create List",
  "createError": "Failed to create list",
  "rename": "Rename",
  "deleteList": "Delete List",
  "updateError": "Failed to update list",
  "deleteError": "Failed to delete list"
}
```

**`messages/en/timer.json`:**
```json
{
  "taskTimer": "Task Timer",
  "weeklyTotal": "This Week",
  "monthlyTotal": "This Month",
  "addManualTime": "Add Time Manually",
  "duration": "Duration",
  "date": "Date",
  "note": "Note",
  "notePlaceholder": "Optional",
  "timerNote": "Timer",
  "manualNote": "Manual entry",
  "timeSaved": "Time entry saved",
  "saveError": "Save failed",
  "recordDeleted": "Record deleted",
  "deleteError": "Delete failed",
  "taskTimeRecords": "Time records for this task",
  "recentRecords": "Recent Records",
  "hoursValidation": "Hours must be between 0 and 23",
  "hoursNegative": "Hours cannot be negative",
  "minutesValidation": "Minutes must be between 0 and 59",
  "minutesNegative": "Minutes cannot be negative",
  "selectDate": "Please select a date",
  "durationPositive": "Duration must be greater than 0 minutes"
}
```

**`messages/en/auth.json`:**
```json
{
  "login": "Sign In",
  "loggingIn": "Signing in...",
  "register": "Register",
  "registering": "Registering...",
  "createAccount": "Create Account",
  "startTracking": "Start tracking your learning progress",
  "loginTracking": "Sign in to track your learning progress",
  "continueDemo": "Continue as Demo",
  "continueGoogle": "Continue with Google",
  "continueGithub": "Continue with GitHub",
  "orSignInEmail": "or sign in with email",
  "noAccount": "Don't have an account?",
  "hasAccount": "Already have an account?",
  "nameLabel": "Name",
  "namePlaceholder": "Your name",
  "emailPlaceholder": "your@email.com",
  "passwordLabel": "Password",
  "passwordPlaceholder": "At least 6 characters",
  "confirmPasswordLabel": "Confirm Password",
  "confirmPasswordPlaceholder": "Re-enter password",
  "invalidCredentials": "Invalid email or password",
  "demoLoginFailed": "Demo login failed. Please make sure the seed data exists.",
  "registerFailed": "Registration failed",
  "registerSuccessLoginFailed": "Registered successfully but auto-login failed. Please sign in manually.",
  "networkError": "Network error. Please try again later.",
  "emailRequired": "Email is required",
  "emailInvalid": "Please enter a valid email",
  "passwordRequired": "Password is required",
  "passwordMinLength": "Password must be at least 6 characters",
  "passwordMaxLength": "Password must be 100 characters or less",
  "nameRequired": "Name is required",
  "nameMaxLength": "Name must be 50 characters or less",
  "confirmPasswordRequired": "Please re-enter your password",
  "passwordMismatch": "Passwords do not match"
}
```

**`messages/en/friends.json`:**
```json
{
  "title": "Friends",
  "inviteFriend": "Invite Friend",
  "allFriends": "All Friends",
  "pending": "Pending",
  "noFriends": "No friends yet. Click the button above to invite someone!",
  "noPending": "No pending friend requests",
  "inviteTitle": "Invite a Friend",
  "inviteDesc": "Share this link with your friend. The link expires in 7 days and can only be used once.",
  "generating": "Generating...",
  "copy": "Copy",
  "copied": "Copied",
  "inviteTip": "Tip: You can also share the link via messaging apps",
  "invitedYou": "{name} invited you",
  "inviteAcceptDesc": "Accept the invitation to become friends and compare your learning progress together.",
  "accept": "Accept",
  "decline": "Decline",
  "inviteNotFound": "This invitation link is invalid.",
  "inviteExpired": "This invitation link has expired.",
  "inviteUsed": "This invitation link has already been used.",
  "inviteSelf": "You cannot add yourself as a friend.",
  "alreadyFriends": "You are already friends!",
  "unknownError": "Unknown error"
}
```

**`messages/en/settings.json`:**
```json
{
  "title": "Settings",
  "profile": "Profile",
  "profileUpdated": "Profile updated",
  "profileUpdateError": "Update failed",
  "notifications": "Notifications",
  "pushNotifications": "Push Notifications",
  "pushDesc": "Receive notifications for friend milestones, ranking changes, and study reminders",
  "notificationsBlocked": "Notifications blocked by browser. Enable in browser settings.",
  "devicesRegistered": "{count} device(s) registered",
  "language": "Language",
  "nameRequired": "Name is required",
  "nameMaxLength": "Name must be 50 characters or less"
}
```

**`messages/en/dashboard.json`:**
```json
{
  "title": "Learning Dashboard",
  "today": "Today",
  "thisWeek": "This Week",
  "thisMonth": "This Month",
  "thisYear": "This Year",
  "todayStudy": "Today",
  "weekStudy": "This Week",
  "monthStudy": "This Month",
  "yearStudy": "This Year",
  "streak": "Streak",
  "vsYesterday": "yesterday",
  "vsLastWeek": "last week",
  "vsLastMonth": "last month",
  "timeDistToday": "Today's Time Distribution",
  "timeDistWeek": "Weekly Time Distribution",
  "timeDistMonth": "Monthly Time Distribution",
  "timeDistYear": "Yearly Time Distribution",
  "noRecordsToday": "No records for today",
  "noRecordsWeek": "No records this week",
  "noRecordsMonth": "No records this month",
  "noRecordsYear": "No records this year",
  "timeShareToday": "Today's Time Share",
  "timeShareWeek": "Weekly Time Share",
  "timeShareMonth": "Monthly Time Share",
  "timeShareYear": "Yearly Time Share",
  "trendToday": "Today's Trend",
  "trendWeek": "Daily Trend (7 days)",
  "trendMonth": "Daily Trend (30 days)",
  "trendYear": "Daily Trend (365 days)",
  "noTrendToday": "No records for today",
  "noTrendWeek": "No records in the past 7 days",
  "noTrendMonth": "No records in the past 30 days",
  "noTrendYear": "No records this year",
  "studyHours": "Study Hours",
  "monthlyCalendar": "Monthly Calendar",
  "monthlyBoardBreakdown": "{month} Board Breakdown",
  "monthlyTotal": "Monthly Total",
  "noMonthRecords": "No records this month",
  "monthNames": ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  "weekdayHeaders": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  "metaTitle": "Dashboard"
}
```

**`messages/en/ranking.json`:**
```json
{
  "title": "Ranking",
  "studyHours": "Study Hours",
  "streakLabel": "Streak",
  "thisWeek": "This Week",
  "thisMonth": "This Month",
  "nameColumn": "Name",
  "hoursColumn": "Hours",
  "daysColumn": "Days",
  "noRanking": "Add friends to see the leaderboard!"
}
```

**`messages/en/errors.json`:**
```json
{
  "INVITE_NOT_FOUND": "Invitation link not found",
  "INVITE_USED": "This link has already been used",
  "INVITE_EXPIRED": "This link has expired",
  "CANNOT_ADD_SELF": "You cannot add yourself as a friend",
  "FRIEND_ALREADY_EXISTS": "You are already friends",
  "FRIEND_REQUEST_NOT_FOUND": "Friend request not found",
  "NOT_FRIENDS": "You are not friends",
  "BOARD_NOT_FOUND": "Board not found",
  "UNKNOWN_ERROR": "An unknown error occurred"
}
```

- [ ] **Step 14: Commit**

```bash
git add messages/
git commit -m "feat(i18n): add zh and en translation files for all namespaces"
```

---

## Task 3: Update next.config.ts and create middleware

**Files:**
- Modify: `next.config.ts`
- Create: `middleware.ts` (project root, replaces `src/middleware.ts`)
- Delete: `src/middleware.ts`

- [ ] **Step 1: Update `next.config.ts`**

Add the `withNextIntl` plugin wrapper. The existing config stays intact:

```typescript
// @ts-check
import type { NextConfig } from 'next';
import path from 'path';
import createNextIntlPlugin from 'next-intl/plugin';
import './src/server/env';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const config: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  outputFileTracingRoot: path.join(__dirname, '.'),

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
    ],
  },

  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  experimental: { serverActions: { bodySizeLimit: '2mb' } },
};

export default withNextIntl(config);
```

- [ ] **Step 2: Create root `middleware.ts`**

This replaces `src/middleware.ts`. It combines next-intl locale routing with NextAuth protection:

```typescript
import createMiddleware from 'next-intl/middleware';
import { withAuth } from 'next-auth/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from '~/i18n/routing';

const intlMiddleware = createMiddleware(routing);

// Paths that don't require authentication (without locale prefix)
const publicPaths = ['/login', '/register', '/invite'];

function isPublicPath(pathname: string): boolean {
  // Strip locale prefix to check the actual path
  const pathWithoutLocale = pathname.replace(/^\/(zh|en)/, '') || '/';
  return (
    publicPaths.some((p) => pathWithoutLocale.startsWith(p)) ||
    pathWithoutLocale === '/'
  );
}

const authMiddleware = withAuth(
  function onSuccess(req) {
    return intlMiddleware(req);
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: '/login',
    },
  },
);

export default function middleware(req: NextRequest) {
  if (isPublicPath(req.nextUrl.pathname)) {
    return intlMiddleware(req);
  }
  return (authMiddleware as any)(req);
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|manifest.json|sw\\.js|icon-.*\\.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
```

- [ ] **Step 3: Delete `src/middleware.ts`**

```bash
rm src/middleware.ts
```

- [ ] **Step 4: Commit**

```bash
git add next.config.ts middleware.ts
git rm src/middleware.ts
git commit -m "feat(i18n): add next-intl middleware with NextAuth integration"
```

---

## Task 4: Restructure route files under [locale]

**Files:**
- Modify: `src/app/layout.tsx` (strip to minimal root layout)
- Create: `src/app/[locale]/layout.tsx` (locale-aware layout with providers)
- Move: all pages from `src/app/(app)/` → `src/app/[locale]/(app)/`
- Move: all pages from `src/app/(auth)/` → `src/app/[locale]/(auth)/`
- Move: `src/app/invite/` → `src/app/[locale]/invite/`
- Move: `src/app/page.tsx` → `src/app/[locale]/page.tsx`
- Move: `src/app/error.tsx` → `src/app/[locale]/error.tsx`

- [ ] **Step 1: Strip `src/app/layout.tsx` to minimal root layout**

This becomes a bare shell — no metadata, no providers (those move to `[locale]/layout.tsx`):

```typescript
import './globals.css';
import { Space_Grotesk } from 'next/font/google';

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <body className={spaceGrotesk.className}>{children}</body>
    </html>
  );
}
```

Note: `<html lang>` will be set in `[locale]/layout.tsx` via next-intl.

- [ ] **Step 2: Create `src/app/[locale]/layout.tsx`**

```typescript
import type { Metadata, Viewport } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '~/i18n/routing';
import { TRPCReactProvider } from '~/utils/trpc-provider';
import { SessionProvider } from '~/components/providers/SessionProvider';
import { ServiceWorkerRegister } from '~/components/ServiceWorkerRegister';
import { Toaster } from '~/components/ui/sonner';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  title: {
    default: 'Learning Dashboard',
    template: '%s | Learning Dashboard',
  },
  manifest: '/manifest.json',
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#E42313',
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body>
        <SessionProvider>
          <NextIntlClientProvider messages={messages}>
            <TRPCReactProvider>{children}</TRPCReactProvider>
          </NextIntlClientProvider>
          <ServiceWorkerRegister />
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  );
}
```

Wait — the root layout already renders `<html>` and `<body>`. We need to remove those from root and only have them in `[locale]/layout.tsx`. Let me correct Step 1:

**Corrected Step 1: Strip `src/app/layout.tsx`**

```typescript
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
```

The root layout becomes a pass-through that just imports global CSS. The `[locale]/layout.tsx` now owns `<html>`, `<body>`, font, providers, and metadata.

Update `[locale]/layout.tsx` to include the font:

```typescript
import { Space_Grotesk } from 'next/font/google';
// ... other imports above

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'] });

// ... in the return:
<html lang={locale}>
  <body className={spaceGrotesk.className}>
    {/* ... providers ... */}
  </body>
</html>
```

- [ ] **Step 3: Move route groups into `[locale]/`**

```bash
mkdir -p src/app/\[locale\]
mv src/app/\(app\) src/app/\[locale\]/\(app\)
mv src/app/\(auth\) src/app/\[locale\]/\(auth\)
mv src/app/invite src/app/\[locale\]/invite
mv src/app/page.tsx src/app/\[locale\]/page.tsx
mv src/app/error.tsx src/app/\[locale\]/error.tsx
```

- [ ] **Step 4: Update `src/app/[locale]/page.tsx` to use locale-aware redirect**

```typescript
import { redirect } from '~/i18n/navigation';

export default function RootPage() {
  redirect('/dashboard');
}
```

- [ ] **Step 5: Update all `Link` and `useRouter` imports**

In every component under `[locale]/`, replace:
- `import Link from 'next/link'` → `import { Link } from '~/i18n/navigation'`
- `import { useRouter } from 'next/navigation'` → `import { useRouter } from '~/i18n/navigation'`
- `import { usePathname } from 'next/navigation'` → `import { usePathname } from '~/i18n/navigation'`
- `import { redirect } from 'next/navigation'` → `import { redirect } from '~/i18n/navigation'`

Files that need this update:
- `src/components/layout/Sidebar.tsx` — Link, usePathname
- `src/components/auth/UserMenu.tsx` — signOut callbackUrl needs locale prefix
- `src/components/dialogs/CreateBoardModal.tsx` — useRouter
- `src/components/dialogs/BoardSettingsModal.tsx` — useRouter
- `src/app/[locale]/(auth)/login/page.tsx` — Link, useRouter
- `src/app/[locale]/(auth)/register/page.tsx` — Link, useRouter
- `src/app/[locale]/(app)/timer/page.tsx` — useRouter
- `src/app/[locale]/invite/[token]/page.tsx` — useRouter
- `src/components/friends/FriendCard.tsx` — Link

**Important:** `next-intl`'s navigation utilities automatically prefix the locale to paths. So `router.push('/dashboard')` becomes `/zh/dashboard` or `/en/dashboard` automatically. No need to manually prefix.

For `signOut({ callbackUrl: '/login' })`, since NextAuth operates outside next-intl's router, change to:
```typescript
signOut({ callbackUrl: `/${locale}/login` })
```
where `locale` comes from `useLocale()`.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(i18n): restructure routes under [locale] with next-intl provider"
```

---

## Task 5: Convert tRPC routers to use error codes

**Files:**
- Modify: `src/server/routers/friend.ts`
- Modify: `src/server/routers/friendStats.ts`
- Modify: `src/server/routers/board.ts`
- Modify: `src/server/routers/list.ts`
- Modify: `src/server/routers/user.ts`

- [ ] **Step 1: Update `src/server/routers/friend.ts`**

Replace all Chinese error messages with error codes:

| Before | After |
|--------|-------|
| `'邀請連結不存在'` | `'INVITE_NOT_FOUND'` |
| `'此連結已被使用'` | `'INVITE_USED'` |
| `'此連結已過期'` | `'INVITE_EXPIRED'` |
| `'不能加自己為好友'` | `'CANNOT_ADD_SELF'` |
| `'你們已經是好友了'` | `'FRIEND_ALREADY_EXISTS'` |
| `'找不到該好友邀請'` | `'FRIEND_REQUEST_NOT_FOUND'` |

- [ ] **Step 2: Update `src/server/routers/friendStats.ts`**

Replace `'你們不是好友'` with `'NOT_FRIENDS'`.

- [ ] **Step 3: Update `src/server/routers/board.ts`**

Replace `'Board not found'` with `'BOARD_NOT_FOUND'`.

- [ ] **Step 4: Update `src/server/routers/list.ts`**

Replace `'Board not found'` with `'BOARD_NOT_FOUND'`.

- [ ] **Step 5: Update `src/server/routers/user.ts`**

Remove Chinese validation messages from the inline Zod schema. Since server-side validation messages are not shown to the user (they're caught by client-side validation first), simplify to:

```typescript
.input(
  z.object({
    name: z.string().min(1).max(50),
  }),
)
```

- [ ] **Step 6: Commit**

```bash
git add src/server/routers/
git commit -m "feat(i18n): replace hardcoded error messages with error codes in tRPC routers"
```

---

## Task 6: Convert Zod schemas to factory functions

**Files:**
- Modify: `src/lib/validations/auth.ts`

- [ ] **Step 1: Rewrite `src/lib/validations/auth.ts`**

```typescript
import { z } from 'zod';

export const createLoginSchema = (t: (key: string) => string) =>
  z.object({
    email: z
      .string()
      .min(1, t('emailRequired'))
      .email(t('emailInvalid')),
    password: z
      .string()
      .min(1, t('passwordRequired')),
  });

export type LoginFormData = z.infer<ReturnType<typeof createLoginSchema>>;

export const createRegisterSchema = (t: (key: string) => string) =>
  z
    .object({
      name: z
        .string()
        .min(1, t('nameRequired'))
        .max(50, t('nameMaxLength')),
      email: z
        .string()
        .min(1, t('emailRequired'))
        .email(t('emailInvalid')),
      password: z
        .string()
        .min(6, t('passwordMinLength'))
        .max(100, t('passwordMaxLength')),
      confirmPassword: z
        .string()
        .min(1, t('confirmPasswordRequired')),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t('passwordMismatch'),
      path: ['confirmPassword'],
    });

export type RegisterFormData = z.infer<ReturnType<typeof createRegisterSchema>>;
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/validations/auth.ts
git commit -m "feat(i18n): convert auth Zod schemas to factory functions accepting translator"
```

---

## Task 7: Migrate auth pages

**Files:**
- Modify: `src/app/[locale]/(auth)/login/page.tsx`
- Modify: `src/app/[locale]/(auth)/register/page.tsx`

- [ ] **Step 1: Update login page**

Key changes:
1. Add `import { useTranslations } from 'next-intl'`
2. Add `import { useLocale } from 'next-intl'`
3. Import `Link, useRouter` from `~/i18n/navigation`
4. Import `createLoginSchema` instead of `loginSchema`
5. Replace all hardcoded strings with `t('key')`
6. Create schema in component: `const schema = createLoginSchema(t)`
7. Update `signOut` callbackUrl to include locale

```typescript
// At top of LoginForm:
const t = useTranslations('auth');
const locale = useLocale();
const schema = createLoginSchema(t);

// Form:
useForm<LoginFormData>({ resolver: zodResolver(schema) });

// All strings:
// '登入以追蹤你的學習進度' → t('loginTracking')
// 'Email 或密碼不正確' → t('invalidCredentials')
// 'Demo 登入失敗，請確認 seed 已執行' → t('demoLoginFailed')
// '登入中...' → t('loggingIn')
// '登入' → t('login')
// '還沒有帳號？' → t('noAccount')
// '註冊' → t('register')
// 'Continue as Demo' → t('continueDemo')
// 'Continue with Google' → t('continueGoogle')
// 'Continue with GitHub' → t('continueGithub')
// 'or sign in with email' → t('orSignInEmail')
// 'or' → tc('or')  (from common namespace)
```

- [ ] **Step 2: Update register page**

Same pattern. Key changes:
1. Add `useTranslations('auth')`
2. Import `createRegisterSchema`
3. Replace all hardcoded strings
4. Update `Link` and `useRouter` imports

```typescript
// All strings:
// '建立帳號' → t('createAccount')
// '開始追蹤你的學習進度' → t('startTracking')
// '名稱' → t('nameLabel')
// '你的名字' → t('namePlaceholder')
// '密碼' → t('passwordLabel')
// '至少 6 個字元' → t('passwordPlaceholder')
// '確認密碼' → t('confirmPasswordLabel')
// '再次輸入密碼' → t('confirmPasswordPlaceholder')
// '註冊中...' → t('registering')
// '註冊' → t('register')
// '已有帳號？' → t('hasAccount')
// '登入' → t('login')
// '註冊失敗' → t('registerFailed')
// '註冊成功但自動登入失敗，請手動登入' → t('registerSuccessLoginFailed')
// '網路錯誤，請稍後再試' → t('networkError')
```

- [ ] **Step 3: Commit**

```bash
git add src/app/\[locale\]/\(auth\)/
git commit -m "feat(i18n): migrate auth pages to use translations"
```

---

## Task 8: Migrate layout and navigation components

**Files:**
- Modify: `src/components/layout/Sidebar.tsx`
- Modify: `src/components/auth/UserMenu.tsx`
- Modify: `src/components/layout/MobileSidebar.tsx`
- Create: `src/components/LanguageSwitcher.tsx`

- [ ] **Step 1: Update `Sidebar.tsx`**

1. Import `{ useTranslations } from 'next-intl'` and `{ Link, usePathname } from '~/i18n/navigation'`
2. Replace all nav strings: `Dashboard` → `t('dashboard')`, `Friends` → `t('friends')`, etc.
3. Replace `'No boards yet'` → `t('noBoards')`
4. Replace `'新增 Board'` → `t('addBoard')`
5. Replace `'Settings'` → `t('settings')`
6. Replace `'Boards'` → `t('boards')`
7. All `href` paths stay as-is (e.g. `/dashboard`) — next-intl's `Link` auto-prefixes locale

- [ ] **Step 2: Update `UserMenu.tsx`**

1. Import `{ useLocale } from 'next-intl'` and `{ useTranslations } from 'next-intl'`
2. Change `signOut({ callbackUrl: '/login' })` → `signOut({ callbackUrl: \`/\${locale}/login\` })`
3. Replace `title="登出"` → `title={t('signOut')}`

- [ ] **Step 3: Create `src/components/LanguageSwitcher.tsx`**

```typescript
'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '~/i18n/navigation';

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = (newLocale: string) => {
    document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=31536000`;
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <button
      onClick={() => switchLocale(locale === 'zh' ? 'en' : 'zh')}
      className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-sidebar-muted-foreground hover:bg-sidebar-muted hover:text-sidebar-foreground transition-colors"
    >
      {locale === 'zh' ? 'EN' : '中文'}
    </button>
  );
}
```

- [ ] **Step 4: Add LanguageSwitcher to Sidebar footer**

In `Sidebar.tsx`, add `<LanguageSwitcher />` in the footer section (before or after the Settings link).

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/ src/components/auth/ src/components/LanguageSwitcher.tsx
git commit -m "feat(i18n): migrate navigation and layout components with language switcher"
```

---

## Task 9: Migrate board-related components

**Files:**
- Modify: `src/app/[locale]/(app)/board/[boardId]/page.tsx`
- Modify: `src/components/board/BoardHeader.tsx`
- Modify: `src/components/board/EmptyBoard.tsx`
- Modify: `src/components/board/ListColumn.tsx`
- Modify: `src/components/board/BoardDndContext.tsx`
- Modify: `src/components/board/TimeOnlyBoard.tsx`

- [ ] **Step 1: Update board page**

Add `useTranslations('board')`, replace:
- `'Board 不存在'` → `t('boardNotFound')`
- `'找不到這個 Board，它可能已被刪除'` → `t('boardNotFoundDesc')`

- [ ] **Step 2: Update BoardHeader.tsx**

Replace `'Board settings'` sr-only text with translated string.

- [ ] **Step 3: Update EmptyBoard.tsx**

Replace:
- `'這個 Board 還沒有 List'` → `t('emptyBoardTitle')`
- `'新增第一個 List 來開始管理你的任務'` → `t('emptyBoardDesc')`
- `'新增 List'` → `t('addList')`

- [ ] **Step 4: Update ListColumn.tsx**

Replace:
- `'更新清單失敗'` → `toast.error(tList('updateError'), ...)`
- `'刪除清單失敗'` → `toast.error(tList('deleteError'), ...)`
- `'重新命名'` → `tList('rename')`
- `'刪除清單'` → `tList('deleteList')`

Use `const tList = useTranslations('list')` and `const tErr = useTranslations('errors')`.

For toast error descriptions from tRPC, use the error translation helper:
```typescript
toast.error(tList('updateError'), {
  description: tErr.has(error.message) ? tErr(error.message) : error.message,
});
```

- [ ] **Step 5: Update BoardDndContext.tsx**

Replace `'排序更新失敗，已自動恢復'` → `t('sortError')` (using board namespace).

- [ ] **Step 6: Update TimeOnlyBoard.tsx**

Replace all hardcoded strings:
- Timer section: `'本周累計'`, `'本月累計'`, `'小時'` → from timer namespace
- Manual dialog: `'手動新增時間'`, `'時長'`, `'日期'`, `'備註'`, `'選填'`, `'取消'`, `'新增'` → from timer namespace
- Toast messages: `'儲存失敗'`, `'刪除失敗'`, `'時間記錄已儲存'`, `'記錄已刪除'` → from timer namespace
- Validation: `'小時數須介於 0 ~ 23'`, `'分鐘數須介於 0 ~ 59'` → from timer namespace
- Notes: `'計時器'`, `'手動新增'` → from timer namespace
- Records: `'最近記錄'`, `'尚無記錄'` → from timer namespace

- [ ] **Step 7: Commit**

```bash
git add src/app/\[locale\]/\(app\)/board/ src/components/board/
git commit -m "feat(i18n): migrate board and timer components to use translations"
```

---

## Task 10: Migrate dialog components

**Files:**
- Modify: `src/components/dialogs/CreateBoardModal.tsx`
- Modify: `src/components/dialogs/CreateTaskModal.tsx`
- Modify: `src/components/dialogs/CreateListModal.tsx`
- Modify: `src/components/dialogs/BoardSettingsModal.tsx`
- Modify: `src/components/dialogs/TaskDetailModal.tsx`

- [ ] **Step 1: Update CreateBoardModal.tsx**

1. Add `useTranslations('board')`
2. Replace `BOARD_TYPES` labels and descriptions with `t()` calls
3. Replace all form labels, placeholders, button text
4. Convert inline Zod schema to use `t()`:
```typescript
const t = useTranslations('board');
const createBoardSchema = z.object({
  name: z.string().min(1, t('boardNameRequired')).max(50, t('boardNameMaxLength')),
});
```
5. Replace toast error: `'建立 Board 失敗'` → `t('createError')`
6. Replace `router.push(\`/board/\${newBoard.id}\`)` — works as-is with next-intl's router

- [ ] **Step 2: Update CreateTaskModal.tsx**

1. `useTranslations('task')`
2. Replace: `'新增任務'` → `t('createTask')`, `'任務標題'` → `t('taskTitle')`, etc.
3. Replace validation: `{ required: '任務標題為必填' }` → `{ required: t('taskTitleRequired') }`
4. Replace toast: `'建立任務失敗'` → `t('createError')`

- [ ] **Step 3: Update CreateListModal.tsx**

1. `useTranslations('list')`
2. Replace all strings including validation message `'清單名稱為必填'` → `t('listNameRequired')`
3. Replace toast: `'建立清單失敗'` → `t('createError')`

- [ ] **Step 4: Update BoardSettingsModal.tsx**

1. `useTranslations('board')`, `useTranslations('common')`
2. Replace: `'Board 設定'` → `t('boardSettings')`, labels, buttons
3. Replace delete button states: `'刪除 Board'`, `'確認刪除？此操作無法復原'`, `'刪除中...'`
4. Replace toasts: `'更新 Board 失敗'`, `'刪除 Board 失敗'`

- [ ] **Step 5: Update TaskDetailModal.tsx**

1. `useTranslations('task')`, `useTranslations('common')`
2. Replace: `'編輯任務'`, `'標題'`, `'描述'`, `'刪除任務'`, `'確認刪除？'`, `'取消'`, `'儲存'`, etc.
3. Replace toasts: `'更新任務失敗'`, `'刪除任務失敗'`

- [ ] **Step 6: Commit**

```bash
git add src/components/dialogs/
git commit -m "feat(i18n): migrate all dialog components to use translations"
```

---

## Task 11: Migrate dashboard components

**Files:**
- Modify: `src/app/[locale]/(app)/dashboard/page.tsx`
- Modify: `src/components/dashboard/DashboardContent.tsx`
- Modify: `src/components/dashboard/StatsRow.tsx`
- Modify: `src/components/dashboard/TimeRangeFilter.tsx`
- Modify: `src/components/dashboard/WeeklyBarChart.tsx`
- Modify: `src/components/dashboard/BoardDonutChart.tsx`
- Modify: `src/components/dashboard/DailyTrendChart.tsx`
- Modify: `src/components/dashboard/MonthlyCalendar.tsx`
- Modify: `src/components/dashboard/MonthlyBoardBreakdown.tsx`

- [ ] **Step 1: Update dashboard page metadata**

Use `getTranslations` from `next-intl/server` for the page metadata:

```typescript
import { getTranslations } from 'next-intl/server';

export async function generateMetadata() {
  const t = await getTranslations('dashboard');
  return { title: t('metaTitle') };
}
```

- [ ] **Step 2: Update StatsRow.tsx**

Replace `'昨天'`, `'上週'`, `'上月'` with `t('vsYesterday')`, `t('vsLastWeek')`, `t('vsLastMonth')`.
Replace `'今日學習'`, `'本週學習'`, etc. with `t('todayStudy')`, `t('weekStudy')`, etc.
Replace `'小時'` → `t('hours')`, `'天'` → `t('days')` (from common or dashboard).

- [ ] **Step 3: Update TimeRangeFilter.tsx**

Replace `'今天'`, `'本週'`, `'本月'`, `'本年'` with `t('today')`, `t('thisWeek')`, `t('thisMonth')`, `t('thisYear')`.

- [ ] **Step 4: Update WeeklyBarChart.tsx**

Replace `TITLES` and `EMPTY_MESSAGES` dictionaries with `t()` calls:
```typescript
const t = useTranslations('dashboard');
const title = t(`timeDist${capitalize(timeRange)}`); // e.g. timeDistWeek
const empty = t(`noRecords${capitalize(timeRange)}`);
```

Or use a simple map:
```typescript
const titleKey = { today: 'timeDistToday', week: 'timeDistWeek', month: 'timeDistMonth', year: 'timeDistYear' } as const;
```

- [ ] **Step 5: Update BoardDonutChart.tsx**

Same pattern as WeeklyBarChart — replace `TITLES` dict.

- [ ] **Step 6: Update DailyTrendChart.tsx**

Replace `TITLES`, `EMPTY_MESSAGES`, and `'學習時數'` tooltip label.

- [ ] **Step 7: Update MonthlyCalendar.tsx**

Replace `WEEKDAY_HEADERS` and `MONTH_NAMES` with translated arrays from JSON:
```typescript
const t = useTranslations('dashboard');
const weekdayHeaders = t.raw('weekdayHeaders') as string[];
const monthNames = t.raw('monthNames') as string[];
```

- [ ] **Step 8: Update MonthlyBoardBreakdown.tsx**

Replace `MONTH_NAMES`, `'本月尚無學習記錄'`, `'本月總計'`, and the title template.

For the title `{month}月各科時數`, use:
```typescript
t('monthlyBoardBreakdown', { month: monthNames[month - 1] })
```

- [ ] **Step 9: Commit**

```bash
git add src/app/\[locale\]/\(app\)/dashboard/ src/components/dashboard/
git commit -m "feat(i18n): migrate dashboard components to use translations"
```

---

## Task 12: Migrate friends, ranking, settings, timer, and invite pages

**Files:**
- Modify: `src/app/[locale]/(app)/friends/page.tsx`
- Modify: `src/app/[locale]/(app)/ranking/page.tsx`
- Modify: `src/app/[locale]/(app)/settings/page.tsx`
- Modify: `src/app/[locale]/(app)/timer/page.tsx`
- Modify: `src/app/[locale]/invite/[token]/page.tsx`
- Modify: `src/components/friends/InviteLinkDialog.tsx`
- Modify: `src/components/friends/FriendCard.tsx`
- Modify: `src/components/friends/PendingInviteCard.tsx`
- Modify: `src/components/settings/ProfileSection.tsx`
- Modify: `src/components/settings/NotificationToggle.tsx`
- Modify: `src/components/ranking/RankRow.tsx`

- [ ] **Step 1: Update friends page**

```typescript
const t = useTranslations('friends');
// Replace: '好友' → t('title'), '邀請好友' → t('inviteFriend'),
// '所有好友' → t('allFriends'), '待處理' → t('pending'),
// '載入中...' → tc('loading'), '還沒有好友...' → t('noFriends'),
// '沒有待處理的好友邀請' → t('noPending')
```

- [ ] **Step 2: Update InviteLinkDialog.tsx**

Replace English strings: `'Invite a Friend'` → `t('inviteTitle')`, `'Generating...'` → `t('generating')`, etc.

- [ ] **Step 3: Update invite page**

Replace `ERROR_MESSAGES` dict with `t()` calls from friends namespace:
```typescript
const t = useTranslations('friends');
const errorMap: Record<string, string> = {
  not_found: t('inviteNotFound'),
  expired: t('inviteExpired'),
  used: t('inviteUsed'),
  self: t('inviteSelf'),
  already_friends: t('alreadyFriends'),
};
```

Replace: `'載入中...'` → `tc('loading')`, `'返回首頁'` → `tc('backToHome')`, invitation text, Accept/Decline buttons.

- [ ] **Step 4: Update ranking page**

```typescript
const t = useTranslations('ranking');
// Replace: 'Ranking' → t('title'), 'Study Hours' → t('studyHours'),
// 'Streak' → t('streakLabel'), 'This Week' → t('thisWeek'),
// 'This Month' → t('thisMonth'), column headers, empty state
```

- [ ] **Step 5: Update settings page**

```typescript
const t = useTranslations('settings');
// Replace: 'Settings' → t('title'), 'Notifications' → t('notifications')
```

- [ ] **Step 6: Update ProfileSection.tsx**

```typescript
const t = useTranslations('settings');
// Replace: 'Profile' → t('profile'), '個人資料已更新' → t('profileUpdated'),
// '更新失敗' → t('profileUpdateError'), '儲存' → tc('save'), etc.
```

- [ ] **Step 7: Update NotificationToggle.tsx**

```typescript
const t = useTranslations('settings');
// Replace: 'Push Notifications' → t('pushNotifications'),
// description text, blocked text, device count text
```

- [ ] **Step 8: Update timer page**

This is one of the larger migrations. Add `useTranslations('timer')`:

Replace all strings including:
- Header: `'任務計時'` → `t('taskTimer')`
- Stats: `'本周累計'`, `'本月累計'`, `'小時'`
- Manual entry dialog: all labels, placeholders, buttons
- Zod schema: convert to inline factory using `t()`
- Toast messages: `'時間記錄已儲存'`, `'儲存失敗'`, `'記錄已刪除'`, `'刪除失敗'`
- Notes: `'計時器'` → `t('timerNote')`, `'手動新增'` → `t('manualNote')`
- Records section: `'此任務的時間記錄'`, `'尚無記錄'`
- Confirmation: `'您有未儲存的計時紀錄，確定要離開嗎？'` → `tc('unsavedTimerWarning')`

- [ ] **Step 9: Commit**

```bash
git add src/app/\[locale\]/ src/components/friends/ src/components/settings/ src/components/ranking/
git commit -m "feat(i18n): migrate friends, ranking, settings, timer, and invite pages"
```

---

## Task 13: Update metadata and SEO for both locales

**Files:**
- Modify: `src/app/[locale]/layout.tsx` (metadata)
- Modify: page-level metadata in dashboard, etc.

- [ ] **Step 1: Add locale-aware metadata to `[locale]/layout.tsx`**

Since `generateMetadata` in the layout can access the locale:

```typescript
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isZh = locale === 'zh';

  return {
    title: {
      default: isZh
        ? 'Learning Dashboard — 學習時間追蹤與成長管理'
        : 'Learning Dashboard — Track Your Learning Progress',
      template: '%s | Learning Dashboard',
    },
    description: isZh
      ? '同時學習多項技能？Learning Dashboard 幫你量化每項學習的投入時間，用數據檢視自己的成長軌跡。'
      : 'Learning multiple skills? Learning Dashboard helps you quantify time invested and track growth with data.',
    openGraph: {
      title: isZh ? 'Learning Dashboard — 量化你的學習投入' : 'Learning Dashboard — Quantify Your Learning',
      type: 'website',
      locale: isZh ? 'zh_TW' : 'en',
      siteName: 'Learning Dashboard',
    },
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/\[locale\]/layout.tsx
git commit -m "feat(i18n): add locale-aware metadata and SEO"
```

---

## Task 14: Verify and fix all remaining hardcoded strings

- [ ] **Step 1: Search for remaining Chinese characters in component files**

```bash
grep -rn '[\u4e00-\u9fff]' src/components/ src/app/ --include='*.tsx' --include='*.ts' | grep -v 'node_modules' | grep -v '.json'
```

Fix any remaining hardcoded strings found.

- [ ] **Step 2: Test both locales**

```bash
npm run dev
```

Verify:
1. `/` redirects to `/zh/dashboard` (or `/en/dashboard` based on browser language)
2. `/zh/dashboard` renders all text in Chinese
3. `/en/dashboard` renders all text in English
4. Language switcher works in sidebar
5. Login/register pages work in both locales
6. Board creation, task creation, list creation — all strings translated
7. Timer page — all strings translated
8. Error messages from tRPC show in correct language
9. Form validation messages show in correct language
10. Toast notifications show in correct language

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat(i18n): fix remaining hardcoded strings and finalize bilingual support"
```
