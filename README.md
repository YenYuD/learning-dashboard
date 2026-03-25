# 📊 Learning & Growth Dashboard

> A personal growth management system combining task management and time tracking for multi-goal learners.

## 🎯 Project Overview

This full-stack web application helps users manage multiple learning goals simultaneously (e.g., language learning, programming practice, sports training) with integrated task boards and time tracking.

**Tech Stack:**
- **Frontend:** Next.js 14 (Pages Router) + React 19 + TypeScript
- **Backend:** tRPC v11 (end-to-end type safety)
- **Database:** PostgreSQL + Prisma ORM
- **Styling:** TailwindCSS
- **State Management:** React Query (via tRPC)
- **Testing:** Playwright (E2E)

## 🚀 Getting Started

### Prerequisites

- Node.js 18.0.0 or higher
- PostgreSQL database (local or cloud)
- npm or pnpm package manager

### Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd learning-dashboard
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
# Copy the example env file
cp .env.example .env

# Edit .env and set your DATABASE_URL
# For local PostgreSQL:
DATABASE_URL=postgresql://postgres:@localhost:5432/learning-dashboard

# For Supabase or other cloud providers, update accordingly
```

4. **Set up the database**
```bash
# Run migrations
npm run migrate-dev

# (Optional) Seed the database with example data
npm run db-seed
```

5. **Start the development server**
```bash
# Start Next.js dev server and Prisma Studio
npm run dx

# Or just the Next.js server
npm run dev
```

6. **Open the application**
- Application: http://localhost:3000
- Prisma Studio: http://localhost:5555

## 📜 Available Scripts

- `npm run dev` - Start Next.js development server
- `npm run dx` - Start dev server + Prisma Studio + run migrations
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run prisma-studio` - Open Prisma Studio (database GUI)
- `npm run migrate-dev` - Run database migrations
- `npm run db-seed` - Seed database with example data
- `npm run test-e2e` - Run end-to-end tests with Playwright

## 🏗️ Project Structure

```
learning-dashboard/
├── src/
│   ├── pages/              # Next.js pages (Pages Router)
│   │   ├── index.tsx       # Home page
│   │   ├── _app.tsx        # App wrapper with tRPC provider
│   │   └── api/
│   │       └── trpc/       # tRPC API endpoints
│   ├── server/
│   │   ├── routers/        # tRPC routers
│   │   │   ├── _app.ts     # Root router
│   │   │   └── post.ts     # Example router (to be replaced)
│   │   ├── context.ts      # tRPC context
│   │   ├── prisma.ts       # Prisma client
│   │   └── trpc.ts         # tRPC setup
│   ├── components/         # React components
│   └── utils/              # Utility functions
├── prisma/
│   ├── schema.prisma       # Database schema
│   ├── seed.ts             # Database seeding script
│   └── migrations/         # Database migrations
├── public/                 # Static assets
└── package.json
```

## 🗄️ Database Schema (Current)

The starter includes a simple `Post` model. This will be replaced with the Learning Dashboard schema:

**Planned Models:**
- `Board` - Learning/activity boards (e.g., "English Learning", "Skiing")
- `List` - Task columns within boards (e.g., "To Do", "In Progress")
- `Task` - Individual tasks within lists
- `TimeEntry` - Time tracking records

See `CLAUDE.md` for detailed schema design.

## 🔑 Key Features (Planned)

### Phase 1: MVP
- [ ] Board management (Task-based and Time-only types)
- [ ] Template-based board creation
- [ ] Task management with drag-and-drop
- [ ] Dual-mode time tracking (Timer + Manual entry)
- [ ] Dashboard with statistics and charts
- [ ] Responsive design (desktop-first, mobile-friendly)

### Phase 2: Enhancements
- [ ] Authentication (NextAuth.js + Google OAuth)
- [ ] Streak tracking
- [ ] Goal setting
- [ ] Dark mode
- [ ] Data export

## 🧪 Testing

```bash
# Run end-to-end tests
npm run test-e2e

# Run unit tests (when implemented)
npm run test-unit
```

## 🚢 Deployment

### Recommended Stack:
- **Frontend + API:** Vercel
- **Database:** Supabase (free tier) or Vercel Postgres

### Deploy to Vercel:

1. Push your code to GitHub
2. Import project in Vercel
3. Set environment variables:
   - `DATABASE_URL`
4. Deploy!

Vercel will automatically run `npm run build` which includes database migrations.

## 📚 Documentation

- [Product Specification](./03-Learning-Dashboard-產品規格書.md) - Full product requirements (Chinese)
- [Design Brief](./05-設計需求文件-Design-Brief.md) - UI/UX design specifications (Chinese)
- [AI Design Tools Guide](./06-AI設計工具使用指南.md) - Guide for using AI design tools (Chinese)
- [CLAUDE.md](./CLAUDE.md) - Technical guidance for Claude Code

## 🔗 Technology References

- [Next.js Documentation](https://nextjs.org/docs)
- [tRPC Documentation](https://trpc.io/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)

## 🤝 Contributing

This is a portfolio project for job interview preparation. Contributions are welcome!

## 📝 License

MIT

## 👤 Author

Built as a portfolio project to demonstrate full-stack development skills with modern TypeScript technologies.

---

**Last Updated:** March 2026
