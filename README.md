# Learning & Growth Dashboard

A personal growth management system combining task management and time tracking for multi-goal learners.

## Tech Stack

- **Framework:** Next.js 15 (App Router) + React 19 + TypeScript
- **Backend:** tRPC v11 (end-to-end type safety)
- **Database:** PostgreSQL + Prisma ORM
- **Auth:** NextAuth.js (Google, GitHub, Facebook, Credentials)
- **UI:** TailwindCSS + shadcn/ui
- **Drag & Drop:** @dnd-kit
- **Charts:** Recharts
- **Forms:** React Hook Form + Zod
- **Testing:** Vitest + Playwright
- **CI/CD:** GitHub Actions (lint/typecheck) + Google Cloud Build (deploy to Cloud Run)

## Features

- **Board System** — Task-based boards (with lists & cards) and time-only boards (for skill tracking)
- **Drag & Drop** — Reorder lists and tasks across columns with @dnd-kit
- **Time Tracking** — Built-in timer and manual entry, linked to boards or tasks
- **Dashboard** — Weekly/monthly stats, daily trend charts, board breakdown, calendar heatmap
- **Authentication** — Multi-provider OAuth (Google, GitHub, Facebook) + email/password registration
- **Templates** — Pre-configured board templates (Language Learning, Programming, Fitness, Custom)

## Getting Started

### Prerequisites

- Node.js 22+
- pnpm
- PostgreSQL database

### Installation

```bash
git clone https://github.com/YenYuD/learning-dashboard.git
cd learning-dashboard
pnpm install
```

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://postgres:@localhost:5432/learning-dashboard

# NextAuth
NEXTAUTH_SECRET=your-secret
NEXTAUTH_URL=http://localhost:3000

# OAuth providers (optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
FACEBOOK_CLIENT_ID=
FACEBOOK_CLIENT_SECRET=
```

### Database Setup

```bash
pnpm migrate-dev    # Run migrations
pnpm db-seed        # Seed example data
```

### Development

```bash
pnpm dev             # Start dev server + run migrations + seed
pnpm prisma-studio   # Open database GUI at localhost:5555
```

Open http://localhost:3000

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Production build |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm typecheck` | Run TypeScript type check |
| `pnpm test-unit` | Run unit tests (Vitest) |
| `pnpm test-e2e` | Run E2E tests (Playwright) |
| `pnpm migrate-dev` | Run database migrations |
| `pnpm db-seed` | Seed database |
| `pnpm prisma-studio` | Open Prisma Studio |

## Project Structure

```
src/
├── app/
│   ├── (app)/              # Authenticated routes
│   │   ├── dashboard/      # Dashboard with stats & charts
│   │   ├── board/[boardId] # Board detail page
│   │   └── timer/          # Timer page
│   ├── (auth)/             # Auth routes (login, register)
│   └── api/
│       ├── trpc/           # tRPC API handler
│       └── auth/           # NextAuth + registration endpoints
├── server/
│   ├── routers/            # tRPC routers (board, list, task, timeEntries, analytics)
│   ├── context.ts
│   └── trpc.ts
├── components/
│   ├── board/              # Board, list, task, drag-and-drop components
│   ├── dashboard/          # Charts and stats components
│   ├── dialogs/            # Modals (create board/list/task, settings)
│   ├── auth/               # User menu
│   ├── layout/             # Sidebar
│   └── ui/                 # shadcn/ui components
├── hooks/
├── lib/
└── types/
prisma/
├── schema.prisma
├── seed.ts
└── migrations/
```

## Database Schema

- **User** — Auth accounts with multi-provider support
- **Board** — `TASK_BASED` (lists + tasks) or `TIME_ONLY` (time tracking only)
- **List** — Columns within task-based boards (ordered)
- **Task** — Cards within lists (ordered, draggable)
- **TimeEntry** — Duration records linked to boards and optionally to tasks

## Deployment

Deployed on **Google Cloud Run** via Cloud Build:

1. Push to `main` triggers Cloud Build
2. Builds Docker image → pushes to Artifact Registry → deploys to Cloud Run
3. Secrets managed via GCP Secret Manager

GitHub Actions CI runs lint + typecheck on every push/PR — must pass before merging to `main`.

## License

MIT
