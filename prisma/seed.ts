/**
 * Adds seed data to your database
 *
 * @link https://www.prisma.io/docs/guides/database/seed-database
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Migrate boards from 'demo-user' to 'user-demo' first (before touching User records)
  const migratedBoards = await prisma.board.updateMany({
    where: { user_id: 'demo-user' },
    data: { user_id: 'user-demo' },
  });
  if (migratedBoards.count > 0) {
    console.log(
      `✅ Migrated ${migratedBoards.count} boards from 'demo-user' to 'user-demo'`,
    );
  }

  // 2. Delete orphan 'demo-user' User if it exists (frees up the email)
  const orphanUser = await prisma.user.findUnique({
    where: { id: 'demo-user' },
  });
  if (orphanUser) {
    await prisma.user.delete({ where: { id: 'demo-user' } });
    console.log(`✅ Deleted orphan user 'demo-user'`);
  }

  // 3. Create/update the demo user with proper auth fields
  const demoPassword = await bcrypt.hash('demo1234', 12);

  const demoUser = await prisma.user.upsert({
    where: { id: 'user-demo' },
    update: {
      email: 'demo@learning-dashboard.app',
      name: 'Demo User',
      password: demoPassword,
    },
    create: {
      id: 'user-demo',
      email: 'demo@learning-dashboard.app',
      name: 'Demo User',
      password: demoPassword,
    },
  });
  console.log(`✅ Demo user created/updated: ${demoUser.email}`);

  // Clear existing boards to avoid duplicates on re-seed
  await prisma.board.deleteMany({ where: { user_id: 'user-demo' } });

  // Create sample boards
  const englishBoard = await prisma.board.create({
    data: {
      name: 'English Learning',
      type: 'TASK_BASED',
      icon: '📚',
      color: '#3B82F6',
      order: 1,
      user_id: 'user-demo',
      lists: {
        create: [
          {
            name: 'Vocabulary',
            order: 1,
            tasks: {
              create: [
                {
                  title: 'Memorize 50 TOEFL words',
                  description: 'Focus on high-frequency vocabulary',
                  order: 1,
                },
                {
                  title: 'Review last week vocabulary',
                  order: 2,
                },
              ],
            },
          },
          {
            name: 'Grammar',
            order: 2,
            tasks: {
              create: [
                {
                  title: 'Practice tenses',
                  order: 1,
                },
              ],
            },
          },
          {
            name: 'Practice',
            order: 3,
            tasks: {
              create: [
                {
                  title: 'Speaking practice',
                  order: 1,
                },
              ],
            },
          },
        ],
      },
    },
  });

  const leetcodeBoard = await prisma.board.create({
    data: {
      name: 'LeetCode',
      type: 'TASK_BASED',
      icon: '💻',
      color: '#10B981',
      order: 2,
      user_id: 'user-demo',
      lists: {
        create: [
          {
            name: 'To Do',
            order: 1,
            tasks: {
              create: [
                {
                  title: 'Two Sum (Easy)',
                  order: 1,
                },
                {
                  title: 'Valid Parentheses (Easy)',
                  order: 2,
                },
              ],
            },
          },
          {
            name: 'In Progress',
            order: 2,
            tasks: {
              create: [
                {
                  title: 'Binary Tree Level Order Traversal (Medium)',
                  order: 1,
                },
              ],
            },
          },
          {
            name: 'Done',
            order: 3,
          },
        ],
      },
    },
  });

  const skiingBoard = await prisma.board.create({
    data: {
      name: 'Skiing Training',
      type: 'TIME_ONLY',
      icon: '⛷️',
      color: '#F59E0B',
      order: 3,
      user_id: 'user-demo',
    },
  });

  // 取回 task ids 以便建立 time entries
  const englishBoardWithTasks = await prisma.board.findUnique({
    where: { id: englishBoard.id },
    include: { lists: { include: { tasks: true } } },
  });
  const vocabList = englishBoardWithTasks!.lists.find(
    (l) => l.name === 'Vocabulary',
  );
  const toeflTask = vocabList!.tasks.find(
    (t) => t.title === 'Memorize 50 TOEFL words',
  );
  const reviewTask = vocabList!.tasks.find(
    (t) => t.title === 'Review last week vocabulary',
  );

  // Add some sample time entries
  await prisma.timeEntry.create({
    data: {
      boardId: englishBoard.id,
      taskId: toeflTask!.id,
      duration: 90, // 1.5 hours in minutes
      startTime: new Date('2026-03-24T10:00:00'),
      endTime: new Date('2026-03-24T11:30:00'),
      note: 'Vocabulary practice',
    },
  });

  await prisma.timeEntry.create({
    data: {
      boardId: englishBoard.id,
      taskId: reviewTask!.id,
      duration: 60,
      startTime: new Date('2026-03-23T09:00:00'),
      endTime: new Date('2026-03-23T10:00:00'),
      note: 'Review last week vocabulary',
    },
  });

  await prisma.timeEntry.create({
    data: {
      boardId: skiingBoard.id,
      duration: 180, // 3 hours in minutes
      startTime: new Date('2026-03-23T14:00:00'),
      endTime: new Date('2026-03-23T17:00:00'),
      note: 'Parallel turning practice',
    },
  });

  console.log('✅ Seeding completed!');
  console.log(
    `Created boards: ${englishBoard.name}, ${leetcodeBoard.name}, ${skiingBoard.name}`,
  );
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
