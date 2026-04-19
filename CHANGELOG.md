## [1.2.0](https://github.com/YenYuD/learning-dashboard/compare/v1.1.0...v1.2.0) (2026-04-19)

### Features

* **invite:** block demo account from accepting friend invites ([f50de69](https://github.com/YenYuD/learning-dashboard/commit/f50de6939e15917fe60cf5a3e9f632d360a02a9a))
* **monitoring:** 使用官方 wizard 完成 Sentry 整合 ([1b9dd81](https://github.com/YenYuD/learning-dashboard/commit/1b9dd81b1eeb5dad75b3cc0cce1904f6ba746795))
* **time-entry:** add edit dialog with optimistic update ([1f25b7e](https://github.com/YenYuD/learning-dashboard/commit/1f25b7ec30b02c5c8e5965c2bab884929f058320))
* **timezone:** 用瀏覽器時區取代 UTC 作為日期分界 ([581ad0b](https://github.com/YenYuD/learning-dashboard/commit/581ad0bd36b54f19236c4fbb59a5a948abe6e2c5))
* 加入 Sentry 錯誤監控與 Rate Limiting 保護 ([fa07122](https://github.com/YenYuD/learning-dashboard/commit/fa07122ee1f217bcb69b3d7c570f8c1d0b15ccbd))
* 新增 health check endpoint 及 CI 單元測試 ([8c62255](https://github.com/YenYuD/learning-dashboard/commit/8c62255dee519e5f8fa1c65c676146e57f83dd00))

### Bug Fixes

* **analytics:** add grace period to inline streak calculation ([b165e3f](https://github.com/YenYuD/learning-dashboard/commit/b165e3f5090bfeea83cacf78d8d29d250a6d9eac))
* **invite:** hide demo login button when redirected from invite link ([dd0d8a9](https://github.com/YenYuD/learning-dashboard/commit/dd0d8a9ba3eac280f4478708f1876746a61ff14b))
* **time-entry:** close edit dialog optimistically after mutate, not in onSuccess ([f026eed](https://github.com/YenYuD/learning-dashboard/commit/f026eedeb14198a33b97c8548ea42090a93016b3))
* **timezone:** use DST-safe date arithmetic across analytics and streak ([3bcb4c0](https://github.com/YenYuD/learning-dashboard/commit/3bcb4c003cff9a5fe22e9e3285b5d79a687e9596))
* **timezone:** 修正 streak key 格式不一致與表單預設日期時區問題 ([ebecd85](https://github.com/YenYuD/learning-dashboard/commit/ebecd85c41d0a28422201489ad9d23566f66b459))
* **ui:** use consistent Chinese copy and add rounded-md to delete buttons ([3f34820](https://github.com/YenYuD/learning-dashboard/commit/3f3482004eadedb2dbae1f9b2fafb76966e2227a))
* 修正 health check timer 洩漏與 error message 安全問題 ([7957a2a](https://github.com/YenYuD/learning-dashboard/commit/7957a2ae963c3f398529a007e57a915f5fb266ef))
* 修正 Sentry PII 過濾與 Rate Limiting 安全問題 ([88b1fb2](https://github.com/YenYuD/learning-dashboard/commit/88b1fb20360f60fb8c9ebfcea3ef55756f3fde43))

## [1.1.0](https://github.com/YenYuD/learning-dashboard/compare/v1.0.0...v1.1.0) (2026-04-09)

### Features

* **auth:** strengthen registration validation ([222e489](https://github.com/YenYuD/learning-dashboard/commit/222e48927936506a28f297f76eccffcc3ee1a0ec))
* **seed:** redesign seed data with realistic learning patterns ([8f68432](https://github.com/YenYuD/learning-dashboard/commit/8f68432b526805f8fcef606b3b2918bb1231ca2c))

### Bug Fixes

* **auth:** refresh session profile data ([8c579bb](https://github.com/YenYuD/learning-dashboard/commit/8c579bbe45a5e0d64033b3145f06a846dc292efd))
* **seed:** use upsert and delete by email to prevent unique constraint errors ([8eee179](https://github.com/YenYuD/learning-dashboard/commit/8eee179e2b4c37ad4e0356b7c3f9ba71378f6c33))

## 1.0.0 (2026-04-08)

### Features

* add all Phase 3 frontend pages and components ([52bf354](https://github.com/YenYuD/learning-dashboard/commit/52bf354343e10a23c1265b9dbad8f8fe3184722b))
* add daily reminder cron endpoint and notification hooks ([38b073b](https://github.com/YenYuD/learning-dashboard/commit/38b073b21f533e7fc533c9ff9001e6fdf786c5d2))
* add error boundaries at global, app, and auth levels ([6735b9c](https://github.com/YenYuD/learning-dashboard/commit/6735b9ce7116bd5568b3e7ea293b8e35c83de664))
* add friend router with invite, accept, list, remove ([9dc526e](https://github.com/YenYuD/learning-dashboard/commit/9dc526e2ab5803a34d124f59f2350397a61ade3c))
* add leave confirmation when timer is active ([38eac63](https://github.com/YenYuD/learning-dashboard/commit/38eac63998a414ebcb10344788245f19a8416008))
* add loading skeletons for app and board pages ([9d0aba4](https://github.com/YenYuD/learning-dashboard/commit/9d0aba410c744c8bf78f48ff4bb57eff199025b6))
* add optimistic update for sidebar board list on create ([627bfac](https://github.com/YenYuD/learning-dashboard/commit/627bfacb90a6f7be21f8d13dcf75c8d8541cb32d))
* add optimistic updates to TimeOnlyBoard time entry mutations ([2d33acb](https://github.com/YenYuD/learning-dashboard/commit/2d33acbc68063c87c94dd7f6bfd8ba314ceafa70))
* add per-task timer page for task-based boards ([81179a8](https://github.com/YenYuD/learning-dashboard/commit/81179a862a9f0e71dcd75cb15abe8c44068ec331))
* add profile name editing in Settings page ([3e86eaa](https://github.com/YenYuD/learning-dashboard/commit/3e86eaa6e33d0ef5bd808734ce97284e51018834))
* add PWA manifest, service worker, and next-pwa configuration ([0511d26](https://github.com/YenYuD/learning-dashboard/commit/0511d26d231a1e28d128392b505ec67521eb1411))
* add ranking, friendStats, notification routers ([bcd57b2](https://github.com/YenYuD/learning-dashboard/commit/bcd57b25f2a66ddb0a9f17dd4b2ddead7cf317eb))
* add sonner toast notification system ([a32af5d](https://github.com/YenYuD/learning-dashboard/commit/a32af5d20a0835bcad9440240d6254ab8bbf46a6))
* add Suspense boundaries to dashboard charts ([4fa65e4](https://github.com/YenYuD/learning-dashboard/commit/4fa65e46bf5edd5d5b84e668b8e64c080c2b17e9))
* add toast error handling to all remaining mutations ([527c948](https://github.com/YenYuD/learning-dashboard/commit/527c9483d665bfb93ffbc5207e93a1c6f827d905))
* add toast error handling to CreateTaskModal and CreateBoardModal ([af3890c](https://github.com/YenYuD/learning-dashboard/commit/af3890ce2a1a9c2e2210761b39d13ea1649f0198))
* add toast notifications to timer mutations ([68e82ba](https://github.com/YenYuD/learning-dashboard/commit/68e82ba59322cf333aa66ab4e01dd3826792d22b))
* add TouchSensor for mobile drag-and-drop and empty list guidance ([a3a99f6](https://github.com/YenYuD/learning-dashboard/commit/a3a99f6ab18cbcfb59a5bee88a6c32a13a3ad3f8))
* **auth:** add login page with OAuth/credentials/demo + register page ([b6c23e6](https://github.com/YenYuD/learning-dashboard/commit/b6c23e675bb74e24f717e9246ae5fd630159df8a))
* **auth:** add NextAuth User/Account/Session/VerificationToken models to Prisma schema ([95289a1](https://github.com/YenYuD/learning-dashboard/commit/95289a11360aa27668c6958f6d1f1b51686488d6))
* **auth:** add password hash/verify utility (TDD) ([642cc90](https://github.com/YenYuD/learning-dashboard/commit/642cc90409eb6ea6160ec31b192796ea0b2d3348))
* **auth:** add protectedProcedure middleware and session-aware tRPC context (TDD) ([fc3fc6d](https://github.com/YenYuD/learning-dashboard/commit/fc3fc6ddc81d7aeba3682659eedd8be005565806))
* **auth:** add SessionProvider to root layout ([e3833dc](https://github.com/YenYuD/learning-dashboard/commit/e3833dc42703aba5bd4a1b0345edbb9e817884ff))
* **auth:** add UserMenu component with avatar and sign-out ([8240caf](https://github.com/YenYuD/learning-dashboard/commit/8240caff7a8c7b8b93203ec3a3876fd4d530d568))
* **auth:** auto-link OAuth accounts with same email ([eef07d3](https://github.com/YenYuD/learning-dashboard/commit/eef07d3cb37670afbb0e3e20ca90117c39f7b1e6))
* **auth:** configure NextAuth with Google/GitHub/Facebook/Credentials providers ([9ef233d](https://github.com/YenYuD/learning-dashboard/commit/9ef233d3a129752530a31e8a7381fe8289f8e478))
* **auth:** install next-auth v4 dependencies and update env validation ([6ef691f](https://github.com/YenYuD/learning-dashboard/commit/6ef691f62f93676423f824e73ab12b33035ccdc5))
* **auth:** migrate all tRPC routers to protectedProcedure with ownership checks ([93d5a67](https://github.com/YenYuD/learning-dashboard/commit/93d5a67649c98fb640e134aca05e32f20d8271a3))
* **auth:** replace Supabase middleware with NextAuth route protection ([c10956b](https://github.com/YenYuD/learning-dashboard/commit/c10956bf8916ba5bd8446915a0eb00de34fc3b17))
* **auth:** seed demo user and consolidate demo-user -> user-demo board migration ([6710145](https://github.com/YenYuD/learning-dashboard/commit/67101454c32ca23d1a5abaaed6b6e9f368f6579d))
* complete Phase 1 frontend UI (layout, dashboard, board, modal) ([15ff9fb](https://github.com/YenYuD/learning-dashboard/commit/15ff9fbd6926a37eb91b26141dbb4df9af8af8d9))
* **docker:** add Dockerfile and skip env validation during build ([d5c9cf7](https://github.com/YenYuD/learning-dashboard/commit/d5c9cf72c3a6d6470d02be6ee2f7700cd655e335))
* improve accessibility with aria-labels and descriptive alt text ([f11e6af](https://github.com/YenYuD/learning-dashboard/commit/f11e6af96389b1dcef54c9ae5c9237c712b9dfcc))
* initial commit ([00bcf69](https://github.com/YenYuD/learning-dashboard/commit/00bcf6905d5c5a68cb8b9368b49d5767fa3044f9))
* install recharts and shadcn/ui components ([d1607e4](https://github.com/YenYuD/learning-dashboard/commit/d1607e40bb95ff091bff1dcea1d609fb4d3f8440))
* migrate to App Router and implement Board management ([c1ff434](https://github.com/YenYuD/learning-dashboard/commit/c1ff4346a88f2d0849eca3f867ba2718254c822c))
* persist timer state to localStorage for cross-page survival ([d06d383](https://github.com/YenYuD/learning-dashboard/commit/d06d3830f4dddb0bdc29d3fb6f603cd461181fde))
* replace <img> with next/image for optimized loading ([cfddab4](https://github.com/YenYuD/learning-dashboard/commit/cfddab46a8a37b2771fb0c7ec0b9e5f7b83d8a4e))
* setup red color theme and Inter font ([39d2138](https://github.com/YenYuD/learning-dashboard/commit/39d213805477d550d263edee50aa7997aeda1555))
* **timer:** validate manual time entry with react-hook-form and zod ([4ca86a2](https://github.com/YenYuD/learning-dashboard/commit/4ca86a2f01bda1941a173f09e45c9ff8015d8d7e))
* **ui:** improve mobile spacing and navigation interactions ([3bb35bd](https://github.com/YenYuD/learning-dashboard/commit/3bb35bdb0158ba766e01d86b24b40575d061bd02))
* update metadata for SEO and per-page titles ([e99077d](https://github.com/YenYuD/learning-dashboard/commit/e99077d8a86f3326ba8d298730e3b456436eb02e))
* wire up CreateBoardModal with tRPC and navigate to new board ([e2adfb1](https://github.com/YenYuD/learning-dashboard/commit/e2adfb12cb3f060c638dddd48601ce3b3b1ceebc))

### Bug Fixes

* add boundary validation for manual time entry (hours < 24, minutes < 60) ([af6a59a](https://github.com/YenYuD/learning-dashboard/commit/af6a59a58038d69b17f9770f02bf4e728aead787))
* add missing social features migration and update CLAUDE.md rules ([841ea65](https://github.com/YenYuD/learning-dashboard/commit/841ea65c1c5afb5ef57498f05d5ed27b128c8c7b))
* add Prisma binary targets for Docker deployment ([be11b0d](https://github.com/YenYuD/learning-dashboard/commit/be11b0d29bdc16a113a763e8367441e8a0764233))
* address code review feedback from Gemini bot ([c1c96e2](https://github.com/YenYuD/learning-dashboard/commit/c1c96e2e51b33b3b50afb1122de5cedbba81b391))
* address round 3 code review feedback ([cff8d15](https://github.com/YenYuD/learning-dashboard/commit/cff8d1512e5abd411e8c590a8eb5a71b228b35e6))
* address round 4 code review feedback ([e541579](https://github.com/YenYuD/learning-dashboard/commit/e541579389df19a2a2818bc70f3aa41fe7024b67))
* address round 5 code review feedback ([2477be6](https://github.com/YenYuD/learning-dashboard/commit/2477be63d9368d14e4bf25d8751d91560969e5e2))
* **analytics:** anchor dashboard trend aggregation to client date ([ca33eed](https://github.com/YenYuD/learning-dashboard/commit/ca33eed2809bc48d799813978d2f9165ca2c2046))
* **auth:** move middleware to src/ so Next.js picks it up ([95ef87d](https://github.com/YenYuD/learning-dashboard/commit/95ef87d1c53e0503889f2621b2de80da97693239))
* change TaskCard button text from "Start Timer" to "開始計時" ([6dde7da](https://github.com/YenYuD/learning-dashboard/commit/6dde7daa570aae3fe5a770480a85706a6c8e4660))
* Cloud Run build failing due to missing env vars and VAPID key ([924bec1](https://github.com/YenYuD/learning-dashboard/commit/924bec146ed75d6688f6028d7d2183a2cfa10544))
* correct NEXTAUTH_URL in Cloud Build config ([22c0900](https://github.com/YenYuD/learning-dashboard/commit/22c0900cb690e0e4f2aa8fc1b8d56228e8d0dc0b))
* invalidate analytics queries on time entry create/delete ([2590960](https://github.com/YenYuD/learning-dashboard/commit/2590960f135dac020ce7d9cd802ad582eaca80ec))
* invite dialog overflow and unify page padding ([143a8b7](https://github.com/YenYuD/learning-dashboard/commit/143a8b77a830c5443e98f4809afa8643db1c358e))
* lint errors and add husky pre-commit hook ([26df4b2](https://github.com/YenYuD/learning-dashboard/commit/26df4b28de33f4d07ecb935d40c06cecda393df7))
* notification toggle hanging and missing service worker registration ([75a11c1](https://github.com/YenYuD/learning-dashboard/commit/75a11c1201e965750d17a5e57fe798e0edf7bdc2))
* optimize mobile responsive layout and typography ([f3dc3de](https://github.com/YenYuD/learning-dashboard/commit/f3dc3de6240b41895d2d2ab50ae9740a4bf45fbc))
* remove default Recharts outline when not focus-visible ([2a66f5c](https://github.com/YenYuD/learning-dashboard/commit/2a66f5cbd1697d9b0a2e2684baec3a682d407992))
* show full month in monthly calendar instead of hiding future dates ([b850a3d](https://github.com/YenYuD/learning-dashboard/commit/b850a3d99f4e4a18b8577c02023e2908a7e1fd85))
* use Cloud Build built-in vars for NEXTAUTH_URL ([e584400](https://github.com/YenYuD/learning-dashboard/commit/e5844001de4f885eac2f989934a29d2a20f743cf))
* use process.env instead of undefined env in daily-reminder route ([9d52ecf](https://github.com/YenYuD/learning-dashboard/commit/9d52ecf8e0084808948364b243e16fc9fea43f19))
* use startTime instead of createdAt for time entry date attribution ([f8dff53](https://github.com/YenYuD/learning-dashboard/commit/f8dff5353a3f367507381a61e2097bd69728460a))

### Performance Improvements

* improve board loading via caching, prefetch, and query trim ([6697d2d](https://github.com/YenYuD/learning-dashboard/commit/6697d2d911b33eb9215e20387af589b33317ad52))
