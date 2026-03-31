# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Learning & Growth Dashboard** - A personal growth management system combining task management and time tracking for multi-goal learners (e.g., language learning, programming, sports).

**Tech Stack:**
- Frontend: Next.js 14 (App Router) + TypeScript + TailwindCSS
- UI Components: shadcn/ui
- Backend: tRPC v11 (end-to-end type safety)
- Database: PostgreSQL + Prisma ORM
- State Management: Zustand
- Drag & Drop: @dnd-kit/core
- Charts: Recharts
- Form Validation: React Hook Form + Zod

**Project Status:** Planning phase - no code has been implemented yet. This repository currently contains product specifications and design requirements.

## Core Concepts

### Board System
The application supports two types of boards:

1. **Task-based Boards** - For structured learning activities
   - Contains Lists (columns) and Tasks (cards)
   - Examples: Language learning, programming practice, exam prep
   - Supports drag-and-drop task organization

2. **Time-only Boards** - For skill-based activities
   - Records time without task structure
   - Examples: Skiing, skating, dancing
   - Simpler UI focused on time accumulation

### Time Tracking
Dual-mode time tracking system:
- **Timer Mode**: Built-in timer (start/pause/stop)
- **Manual Entry**: Manual time input with date/duration

### Data Model
Core entities:
- `Board` - Container for tasks or time tracking
- `List` - Column within task-based boards (e.g., "To Do", "In Progress", "Done")
- `Task` - Individual task cards within lists
- `TimeEntry` - Time tracking records (linked to boards/tasks)

## Development Workflow

### Initial Setup (when implementing)
```bash
# Initialize Next.js project
npx create-next-app@latest . --typescript --tailwind --app

# Install dependencies
npm install @trpc/client@next @trpc/server@next @trpc/react-query@next
npm install @prisma/client prisma
npm install @dnd-kit/core @dnd-kit/sortable
npm install recharts
npm install zustand
npm install react-hook-form zod @hookform/resolvers

# Install shadcn/ui
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card input dialog select
```

### Database Setup
```bash
# Initialize Prisma
npx prisma init

# After creating schema
npx prisma generate
npx prisma db push

# View database
npx prisma studio
```

### Running Development Server
```bash
npm run dev
```

## Architecture Guidelines

### tRPC Implementation
- Use tRPC v11 with Next.js App Router
- Define procedures in `src/server/api/routers/`
- Router structure:
  - `board.router.ts` - Board CRUD operations
  - `list.router.ts` - List management
  - `task.router.ts` - Task operations and drag-drop updates
  - `timeEntry.router.ts` - Time tracking operations
  - `analytics.router.ts` - Dashboard statistics (groupBy, aggregate queries)

### File Structure (when implementing)
```
app/
├── (routes)/
│   ├── dashboard/
│   ├── board/[boardId]/
│   └── layout.tsx
├── api/
│   └── trpc/[trpc]/route.ts
src/
├── server/
│   ├── api/
│   │   ├── routers/
│   │   └── trpc.ts
│   └── db.ts
├── components/
│   ├── ui/ (shadcn/ui components)
│   ├── board/
│   ├── task/
│   └── timer/
└── lib/
    └── utils.ts
prisma/
└── schema.prisma
```

### State Management
- Use Zustand for:
  - Active timer state
  - UI state (modals, sidebar collapse)
  - Optimistic updates during drag-and-drop
- Use tRPC's React Query integration for server state
- Avoid duplicating server state in Zustand

### Drag & Drop Implementation
Use @dnd-kit for:
- Board reordering in sidebar
- List reordering within boards
- Task reordering within lists
- Cross-list task movement

Key considerations:
- Update order fields in database after drop
- Implement optimistic UI updates
- Provide clear visual feedback (placeholder, ghost element)

## Key Technical Decisions

### Why tRPC?
- End-to-end type safety (TypeScript checks across frontend/backend)
- No need for manual API documentation (types serve as docs)
- Auto-completion and error checking on frontend
- Company experience: tRPC used in previous projects
- Current Next.js ecosystem standard (2024-2025)

### Why Zustand over Redux?
- MVP doesn't require complex state management
- Lighter weight with lower learning curve
- Easy to upgrade to Redux Toolkit later if needed

### Why Skip Authentication in MVP?
- Authentication requires 2-3 days development time
- MVP prioritizes core functionality (task management + time tracking)
- Can be added in Phase 2 to demonstrate iterative development

## Design System

### Color Palette
```typescript
// Primary colors
primary: '#3B82F6' (blue)
success: '#10B981' (green)
warning: '#F59E0B' (orange)

// Neutral colors
text-primary: '#111827'
text-secondary: '#6B7280'
background: '#F3F4F6'
card: '#FFFFFF'

// Board color options (8 soft colors for user selection)
['#EFF6FF', '#F0FDF4', '#FEF3C7', '#FCE7F3',
 '#F3E8FF', '#FEE2E2', '#E0F2FE', '#FEF9C3']
```

### Spacing System
Use Tailwind's default spacing scale (4px base unit):
- xs: 4px, sm: 8px, md: 16px, lg: 24px, xl: 32px, 2xl: 48px

### Typography
- Headings: 32px (H1), 24px (H2), 20px (H3)
- Body: 16px
- Small: 14px
- Tiny: 12px

## Database Schema Patterns

### Board Type Flexibility
```prisma
model Board {
  id        String   @id @default(uuid())
  name      String
  type      BoardType // TASK_BASED | TIME_ONLY
  icon      String?
  color     String?
  order     Int
  // ... relationships
}
```

### Time Entry Structure
```prisma
model TimeEntry {
  id        String   @id @default(uuid())
  boardId   String   // required
  taskId    String?  // optional (null for TIME_ONLY boards)
  duration  Int      // minutes
  startTime DateTime?
  endTime   DateTime?
  type      EntryType // TIMER | MANUAL
  note      String?
}
```

## Dashboard Analytics Queries

Use Prisma's aggregate and groupBy for statistics:
```typescript
// Example: Weekly time distribution
const weeklyStats = await prisma.timeEntry.groupBy({
  by: ['boardId'],
  where: {
    createdAt: {
      gte: startOfWeek,
      lte: endOfWeek,
    },
  },
  _sum: {
    duration: true,
  },
})
```

## Template System

When creating boards, provide templates with pre-configured lists:

**Language Learning:**
- Lists: Vocabulary, Grammar, Practice

**Programming:**
- Lists: To Learn, In Progress, Completed

**Fitness Training:**
- Lists: Plan, In Progress, Done

**Custom:**
- User-defined lists

## Responsive Design Breakpoints

- Desktop (1440px+): Fixed sidebar (240px) + main content
- Tablet (768-1439px): Collapsible sidebar + full-width content
- Mobile (<768px): Bottom tab navigation + vertical scrolling

Minimum screen size: 375px
Maximum content width: 1920px

## Phase 2 Features (Future Enhancements)

When implementing Phase 2:
- NextAuth.js authentication (Google OAuth)
- Streak tracking (consecutive learning days)
- Daily/weekly goal setting
- Pomodoro timer integration
- Tag system for tasks
- Data export (CSV/JSON)
- Dark mode
- Notification reminders

## Demo Script (for interviews)

1. **Introduction** (30s): "I built this because I'm learning multiple skills simultaneously and needed better progress tracking"
2. **Feature Demo** (2-3min):
   - Create board with template
   - Add and drag tasks
   - Use timer to track time
   - Manually add sports time
   - View dashboard statistics
3. **Technical Deep Dive** (2min):
   - Database design (board type flexibility)
   - Drag-and-drop implementation challenges
   - End-to-end type safety with tRPC
   - Show key code sections

## Database Migration Rules

**NEVER modify a migration file after it has been applied to the database.** This causes Prisma checksum mismatch errors.

- Migration files in `prisma/migrations/` are **immutable** once applied
- Need schema changes? Always run `prisma migrate dev --name <description>` to create a **new** migration
- Seed data (demo users, sample boards) belongs in `prisma/seed.ts`, NOT in migration SQL files
- Need to add data alongside a schema change? Add it to `seed.ts` and run `prisma db seed`

## Important Notes

- **Design-First**: Review design documents (03-Learning-Dashboard-產品規格書.md, 05-設計需求文件-Design-Brief.md) before implementing
- **Type Safety**: Leverage tRPC's end-to-end TypeScript validation - all API calls should have full type safety
- **Database Indexes**: Add indexes on frequently queried fields (boardId, taskId, createdAt)
- **Optimistic Updates**: Implement optimistic UI updates for drag-and-drop and timer actions
- **Error Boundaries**: Wrap major UI sections in error boundaries
- **Loading States**: Use skeleton screens instead of spinners for better UX
