/**
 * Seed data for LearnTrack
 *
 * Generates realistic learning patterns for 2 demo users across 9 boards,
 * with ~400-600 time entries spanning Jan 1 - Apr 7, 2026.
 *
 * @link https://www.prisma.io/docs/guides/database/seed-database
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Deterministic seeded random number generator (Mulberry32)
// ---------------------------------------------------------------------------
function createRng(seed: number) {
  let state = seed;
  return function next(): number {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = createRng(20260408);

/** Random int in [min, max] inclusive */
function randInt(min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

/** Pick a random element from an array */
function pick<T>(arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

/** Return true with given probability (0-1) */
function chance(p: number): boolean {
  return rng() < p;
}

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------
const SEED_START = new Date('2026-01-01T00:00:00');
const SEED_END = new Date('2026-04-07T23:59:59');

function dateRange(start: Date, end: Date): Date[] {
  const dates: Date[] = [];
  const d = new Date(start);
  while (d <= end) {
    dates.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return dates;
}

function isWeekend(d: Date): boolean {
  const day = d.getDay();
  return day === 0 || day === 6;
}

function getMonth(d: Date): number {
  return d.getMonth() + 1; // 1-indexed
}

/** Create a startTime on a given date at a given hour with some minute jitter */
function makeStartTime(date: Date, baseHour: number, jitterMinutes = 30): Date {
  const d = new Date(date);
  d.setHours(baseHour, randInt(0, jitterMinutes), 0, 0);
  return d;
}

function addMinutes(d: Date, minutes: number): Date {
  return new Date(d.getTime() + minutes * 60000);
}

// ---------------------------------------------------------------------------
// Time entry generation types
// ---------------------------------------------------------------------------
interface TimeEntryData {
  boardId: string;
  taskId?: string;
  duration: number;
  startTime: Date;
  endTime: Date;
  note?: string;
  createdAt: Date;
}

interface EntryPattern {
  /** Probability of doing this activity on a given day (0-1) */
  dailyChance: (date: Date) => number;
  /** Duration range in minutes [min, max] */
  durationRange: (date: Date) => [number, number];
  /** Base hour of day to start (24h) */
  baseHour: (date: Date) => number;
  /** Optional notes to randomly attach */
  notes: string[];
  /** Probability of attaching a note */
  noteChance: number;
  /** Optional: pick a taskId for this entry */
  pickTaskId?: () => string | undefined;
}

function generateEntries(
  boardId: string,
  pattern: EntryPattern,
  startDate: Date,
  endDate: Date,
): TimeEntryData[] {
  const entries: TimeEntryData[] = [];
  const allDays = dateRange(startDate, endDate);

  // Generate gap periods (3-5 day breaks)
  const gapStarts: Date[] = [];
  let i = 0;
  while (i < allDays.length) {
    if (chance(0.02)) {
      // ~2% chance per day to start a gap
      const gapLen = randInt(3, 5);
      for (let g = 0; g < gapLen && i + g < allDays.length; g++) {
        gapStarts.push(allDays[i + g]);
      }
      i += randInt(3, 5);
    }
    i++;
  }
  const gapSet = new Set(gapStarts.map((d) => d.toDateString()));

  for (const day of allDays) {
    if (gapSet.has(day.toDateString())) continue;

    const prob = pattern.dailyChance(day);
    if (!chance(prob)) continue;

    const [minDur, maxDur] = pattern.durationRange(day);
    const duration = randInt(minDur, maxDur);
    const hour = pattern.baseHour(day);
    const startTime = makeStartTime(day, hour);
    const endTime = addMinutes(startTime, duration);

    const note = chance(pattern.noteChance) ? pick(pattern.notes) : undefined;
    const taskId = pattern.pickTaskId ? pattern.pickTaskId() : undefined;

    entries.push({
      boardId,
      taskId,
      duration,
      startTime,
      endTime,
      note,
      createdAt: endTime,
    });
  }

  return entries;
}

// ---------------------------------------------------------------------------
// Main seed function
// ---------------------------------------------------------------------------
async function main() {
  console.log('Seeding database...');

  // =========================================================================
  // 0. Clean up existing data for both users
  // =========================================================================
  for (const userId of ['user-demo', 'user-alice']) {
    const existingBoards = await prisma.board.findMany({
      where: { user_id: userId },
      select: { id: true },
    });
    if (existingBoards.length > 0) {
      // TimeEntries, Tasks, Lists cascade from Board delete
      await prisma.board.deleteMany({ where: { user_id: userId } });
    }
  }
  // Clean friendships and invites
  await prisma.friendship.deleteMany({
    where: {
      OR: [{ requesterId: 'user-demo' }, { requesterId: 'user-alice' }],
    },
  });
  await prisma.friendInvite.deleteMany({
    where: { inviterId: 'user-demo' },
  });
  // Delete old users if they exist (by ID or email to avoid unique constraint conflicts)
  await prisma.user.deleteMany({
    where: {
      OR: [
        { id: { in: ['user-demo', 'user-alice'] } },
        { email: { in: ['demo@learning-dashboard.app', 'alice@example.com'] } },
      ],
    },
  });

  // =========================================================================
  // 1. Create users
  // =========================================================================
  const hashedPassword = await bcrypt.hash('demo1234', 12);

  const demoUser = await prisma.user.upsert({
    where: { id: 'user-demo' },
    update: {
      name: 'Demo User',
      email: 'demo@learning-dashboard.app',
      password: hashedPassword,
      timezone: 'Asia/Taipei',
    },
    create: {
      id: 'user-demo',
      name: 'Demo User',
      email: 'demo@learning-dashboard.app',
      password: hashedPassword,
      timezone: 'Asia/Taipei',
    },
  });
  console.log(`  User created: ${demoUser.email}`);

  const aliceUser = await prisma.user.upsert({
    where: { id: 'user-alice' },
    update: {
      name: 'Alice Chen',
      email: 'alice@example.com',
      password: hashedPassword,
      timezone: 'Asia/Taipei',
    },
    create: {
      id: 'user-alice',
      name: 'Alice Chen',
      email: 'alice@example.com',
      password: hashedPassword,
      timezone: 'Asia/Taipei',
    },
  });
  console.log(`  User created: ${aliceUser.email}`);

  // =========================================================================
  // 2. Friendship & Invite
  // =========================================================================
  await prisma.friendship.create({
    data: {
      requesterId: 'user-demo',
      addresseeId: 'user-alice',
      status: 'ACCEPTED',
    },
  });

  await prisma.friendInvite.create({
    data: {
      inviterId: 'user-demo',
      expiresAt: new Date('2026-05-08T00:00:00'),
    },
  });
  console.log('  Friendship and invite created');

  // =========================================================================
  // 3. Demo User boards
  // =========================================================================

  // --- Board 1: 日文 N2 備考 (TASK_BASED) ---
  const japaneseBoard = await prisma.board.create({
    data: {
      name: '日文 N2 備考',
      type: 'TASK_BASED',
      icon: '📚',
      color: '#3B82F6',
      order: 1,
      user_id: 'user-demo',
      lists: {
        create: [
          {
            name: '單字',
            order: 1,
            tasks: {
              create: [
                { title: 'N2 單字 Unit 1-5 複習', description: '使用新完全マスター單字本', order: 1 },
                { title: 'N2 單字 Unit 6-10 複習', order: 2 },
                { title: '動詞活用變化整理', description: '五段/一段/する/くる 整理表', order: 3 },
                { title: '擬態語・擬聲語 50 個', order: 4 },
              ],
            },
          },
          {
            name: '文法',
            order: 2,
            tasks: {
              create: [
                { title: 'て形文法練習', description: 'ている/てある/ておく/てしまう', order: 1 },
                { title: 'N2 文法 ～にとって/～として/～について', order: 2 },
                { title: '條件句總整理 (たら/ば/と/なら)', order: 3 },
                { title: '敬語表現練習', description: '尊敬語・謙譲語・丁寧語', order: 4 },
              ],
            },
          },
          {
            name: '聽力練習',
            order: 3,
            tasks: {
              create: [
                { title: 'JLPT 模擬試題 第1回', description: '聽力部分完整做一回', order: 1 },
                { title: 'JLPT 模擬試題 第2回', order: 2 },
                { title: 'NHK News Web Easy 精聽', description: '每天聽一篇新聞', order: 3 },
                { title: 'Podcast 日本語の森 N2 聽力', order: 4 },
              ],
            },
          },
          {
            name: '已完成',
            order: 4,
            tasks: {
              create: [
                { title: 'N2 單字 Unit 1-3 第一輪', order: 1 },
                { title: '基礎文法 N3 複習完成', order: 2 },
                { title: 'JLPT 模擬試題 第1回（聽力）', order: 3 },
              ],
            },
          },
        ],
      },
    },
    include: { lists: { include: { tasks: true } } },
  });

  // --- Board 2: LeetCode 刷題 (TASK_BASED) ---
  const leetcodeBoard = await prisma.board.create({
    data: {
      name: 'LeetCode 刷題',
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
                { title: 'Two Sum (Easy)', description: 'Hash map approach', order: 1 },
                { title: 'Merge Intervals (Medium)', description: 'Sort + sweep', order: 2 },
                { title: 'LRU Cache (Hard)', description: 'HashMap + Doubly Linked List', order: 3 },
                { title: 'Longest Substring Without Repeating Characters (Medium)', order: 4 },
                { title: 'Course Schedule (Medium)', description: 'Topological sort / BFS', order: 5 },
              ],
            },
          },
          {
            name: 'In Progress',
            order: 2,
            tasks: {
              create: [
                { title: 'Binary Tree Level Order Traversal (Medium)', description: 'BFS with queue', order: 1 },
                { title: 'Word Search (Medium)', description: 'DFS backtracking', order: 2 },
              ],
            },
          },
          {
            name: 'Done',
            order: 3,
            tasks: {
              create: [
                { title: 'Valid Parentheses (Easy)', order: 1 },
                { title: 'Climbing Stairs (Easy)', description: 'DP bottom-up', order: 2 },
                { title: 'Maximum Subarray (Medium)', description: "Kadane's algorithm", order: 3 },
                { title: 'Reverse Linked List (Easy)', order: 4 },
                { title: 'Best Time to Buy and Sell Stock (Easy)', order: 5 },
              ],
            },
          },
        ],
      },
    },
    include: { lists: { include: { tasks: true } } },
  });

  // --- Board 3: 吉他練習 (TIME_ONLY) ---
  const guitarBoard = await prisma.board.create({
    data: {
      name: '吉他練習',
      type: 'TIME_ONLY',
      icon: '🎸',
      color: '#8B5CF6',
      order: 3,
      user_id: 'user-demo',
    },
  });

  // --- Board 4: 滑雪訓練 (TIME_ONLY) ---
  const skiBoard = await prisma.board.create({
    data: {
      name: '滑雪訓練',
      type: 'TIME_ONLY',
      icon: '⛷️',
      color: '#F59E0B',
      order: 4,
      user_id: 'user-demo',
    },
  });

  // --- Board 5: 閱讀計畫 (TASK_BASED) ---
  const readingBoard = await prisma.board.create({
    data: {
      name: '閱讀計畫',
      type: 'TASK_BASED',
      icon: '📖',
      color: '#EC4899',
      order: 5,
      user_id: 'user-demo',
      lists: {
        create: [
          {
            name: '待讀',
            order: 1,
            tasks: {
              create: [
                { title: '《人類大歷史》', description: 'Yuval Noah Harari', order: 1 },
                { title: '《深度工作力》', description: 'Cal Newport - Deep Work', order: 2 },
                { title: '《設計模式》', description: 'Design Patterns (GoF)', order: 3 },
              ],
            },
          },
          {
            name: '閱讀中',
            order: 2,
            tasks: {
              create: [
                { title: '《Clean Code》', description: 'Robert C. Martin - 第 7-12 章', order: 1 },
                { title: '《系統思考》', description: 'Donella H. Meadows', order: 2 },
              ],
            },
          },
          {
            name: '讀完',
            order: 3,
            tasks: {
              create: [
                { title: '《原子習慣》', description: 'James Clear - Atomic Habits', order: 1 },
                { title: '《Clean Code》前 6 章', order: 2 },
                { title: '《鉤引行銷》', description: 'Brendan Kane - Hook Point', order: 3 },
              ],
            },
          },
        ],
      },
    },
    include: { lists: { include: { tasks: true } } },
  });

  // --- Board 6: 跑步訓練 (TIME_ONLY) ---
  const runningBoard = await prisma.board.create({
    data: {
      name: '跑步訓練',
      type: 'TIME_ONLY',
      icon: '🏃',
      color: '#EF4444',
      order: 6,
      user_id: 'user-demo',
    },
  });

  console.log('  Demo user boards created (6)');

  // =========================================================================
  // 4. Alice's boards
  // =========================================================================
  const aliceEnglishBoard = await prisma.board.create({
    data: {
      name: '英文學習',
      type: 'TASK_BASED',
      icon: '📚',
      color: '#3B82F6',
      order: 1,
      user_id: 'user-alice',
      lists: {
        create: [
          {
            name: 'Vocabulary',
            order: 1,
            tasks: {
              create: [
                { title: 'TOEIC 核心單字 Week 5', order: 1 },
                { title: 'Business English 片語 20 個', order: 2 },
              ],
            },
          },
          {
            name: 'Grammar',
            order: 2,
            tasks: {
              create: [{ title: '被動語態練習', order: 1 }],
            },
          },
          {
            name: 'Done',
            order: 3,
            tasks: {
              create: [
                { title: 'TOEIC 核心單字 Week 1-4', order: 1 },
                { title: '基礎時態複習', order: 2 },
              ],
            },
          },
        ],
      },
    },
    include: { lists: { include: { tasks: true } } },
  });

  const aliceDrawingBoard = await prisma.board.create({
    data: {
      name: '畫畫練習',
      type: 'TIME_ONLY',
      icon: '🎨',
      color: '#F59E0B',
      order: 2,
      user_id: 'user-alice',
    },
  });

  const aliceFrontendBoard = await prisma.board.create({
    data: {
      name: '前端學習',
      type: 'TASK_BASED',
      icon: '💻',
      color: '#10B981',
      order: 3,
      user_id: 'user-alice',
      lists: {
        create: [
          {
            name: 'To Learn',
            order: 1,
            tasks: {
              create: [
                { title: 'React Server Components', order: 1 },
                { title: 'CSS Container Queries', order: 2 },
              ],
            },
          },
          {
            name: 'In Progress',
            order: 2,
            tasks: {
              create: [{ title: 'Next.js App Router', order: 1 }],
            },
          },
          {
            name: 'Done',
            order: 3,
            tasks: {
              create: [
                { title: 'TypeScript Generics', order: 1 },
                { title: 'Tailwind CSS 基礎', order: 2 },
              ],
            },
          },
        ],
      },
    },
    include: { lists: { include: { tasks: true } } },
  });

  console.log('  Alice boards created (3)');

  // =========================================================================
  // 5. Collect task IDs for time entry generation
  // =========================================================================
  const jpVocabTasks = japaneseBoard.lists.find((l) => l.name === '單字')!.tasks;
  const jpGrammarTasks = japaneseBoard.lists.find((l) => l.name === '文法')!.tasks;
  const jpListeningTasks = japaneseBoard.lists.find((l) => l.name === '聽力練習')!.tasks;
  const jpAllActiveTasks = [...jpVocabTasks, ...jpGrammarTasks, ...jpListeningTasks];

  const lcTodoTasks = leetcodeBoard.lists.find((l) => l.name === 'To Do')!.tasks;
  const lcInProgressTasks = leetcodeBoard.lists.find((l) => l.name === 'In Progress')!.tasks;
  const lcDoneTasks = leetcodeBoard.lists.find((l) => l.name === 'Done')!.tasks;
  const lcAllTasks = [...lcTodoTasks, ...lcInProgressTasks, ...lcDoneTasks];

  const readingActiveTasks = readingBoard.lists.find((l) => l.name === '閱讀中')!.tasks;
  const readingTodoTasks = readingBoard.lists.find((l) => l.name === '待讀')!.tasks;
  const readingAllActive = [...readingActiveTasks, ...readingTodoTasks];

  const aliceEnglishTasks = aliceEnglishBoard.lists.flatMap((l) => l.tasks);
  const aliceFrontendTasks = aliceFrontendBoard.lists.flatMap((l) => l.tasks);

  // =========================================================================
  // 6. Generate time entries for Demo User
  // =========================================================================
  const allEntries: TimeEntryData[] = [];

  // --- Japanese N2 ---
  // ~4-5 times/week, 30-90 min, intensity increases in March
  allEntries.push(
    ...generateEntries(japaneseBoard.id, {
      dailyChance: (d) => {
        const m = getMonth(d);
        if (m === 3) return 0.8; // JLPT prep month
        return isWeekend(d) ? 0.75 : 0.6;
      },
      durationRange: (d) => {
        const m = getMonth(d);
        if (m === 3) return [45, 90];
        return isWeekend(d) ? [40, 90] : [30, 60];
      },
      baseHour: (d) => (isWeekend(d) ? randInt(10, 11) : randInt(19, 21)),
      notes: [
        '單字小測驗 85 分',
        '文法練習卡住，明天再複習',
        '聽力進步了！',
        '今天狀態不好，先做簡單的',
        '模擬題錯很多，需要加強聽力',
        'N2 文法點整理完成',
        '跟日本朋友練習會話',
        '複習上週錯題',
      ],
      noteChance: 0.25,
      pickTaskId: () => pick(jpAllActiveTasks).id,
    }, SEED_START, SEED_END),
  );

  // --- LeetCode ---
  // 3-4 times/week, 30-60 min, some weeks skip entirely
  allEntries.push(
    ...generateEntries(leetcodeBoard.id, {
      dailyChance: (d) => {
        // Skip some entire weeks (~15% chance per week)
        const weekNum = Math.floor(
          (d.getTime() - SEED_START.getTime()) / (7 * 86400000),
        );
        if ((weekNum * 7 + 3) % 20 < 3) return 0; // deterministic skip weeks
        return isWeekend(d) ? 0.55 : 0.45;
      },
      durationRange: () => [30, 60],
      baseHour: () => randInt(20, 22),
      notes: [
        'Medium 解出來了！',
        '看了解答才想通',
        '用了兩種解法',
        'Time complexity 需要優化',
        'DFS 思路很清楚',
        '卡在 edge case',
        '面試常考題',
        'DP 還是不太熟',
      ],
      noteChance: 0.3,
      pickTaskId: () => pick(lcAllTasks).id,
    }, SEED_START, SEED_END),
  );

  // --- Guitar ---
  // 2-3 times/week, 20-45 min, very consistent
  allEntries.push(
    ...generateEntries(guitarBoard.id, {
      dailyChance: (d) => (isWeekend(d) ? 0.5 : 0.35),
      durationRange: (d) => (isWeekend(d) ? [30, 45] : [20, 35]),
      baseHour: () => randInt(17, 19),
      notes: [
        '練習新和弦 Bm7',
        '換和弦速度有進步',
        '練習指法 spider exercise',
        '學了一首新歌',
        '節拍器練習 120 BPM',
        '右手指法需要加強',
      ],
      noteChance: 0.2,
    }, SEED_START, SEED_END),
  );

  // --- Skiing (only Jan-Mar, weekends, 2-4 hours) ---
  allEntries.push(
    ...generateEntries(skiBoard.id, {
      dailyChance: (d) => {
        const m = getMonth(d);
        if (m > 3) return 0; // No skiing after March
        return isWeekend(d) ? 0.7 : 0;
      },
      durationRange: () => [120, 240],
      baseHour: () => randInt(9, 10),
      notes: [
        'Parallel turn 練習',
        '今天雪況超好',
        '挑戰了中級道',
        '膝蓋有點痛，注意姿勢',
        '速度控制有進步',
        '新雪場第一次來',
        'Carving turn 越來越穩了',
      ],
      noteChance: 0.4,
    }, SEED_START, SEED_END),
  );

  // --- Reading ---
  // 4-5 times/week, 20-60 min, evening
  allEntries.push(
    ...generateEntries(readingBoard.id, {
      dailyChance: (d) => (isWeekend(d) ? 0.75 : 0.65),
      durationRange: (d) => (isWeekend(d) ? [30, 60] : [20, 45]),
      baseHour: () => randInt(21, 23),
      notes: [
        '讀到很有啟發的段落',
        '今天只翻了幾頁',
        '做了筆記整理',
        'Clean Code 第 8 章心得很多',
        '讀到睡著...',
        '系統思考的反饋迴路概念很棒',
      ],
      noteChance: 0.2,
      pickTaskId: () => pick(readingAllActive).id,
    }, SEED_START, SEED_END),
  );

  // --- Running ---
  // 2-3 times/week, 20-50 min, less in winter more in spring
  allEntries.push(
    ...generateEntries(runningBoard.id, {
      dailyChance: (d) => {
        const m = getMonth(d);
        const base = m <= 2 ? 0.25 : 0.4; // Less in winter
        return isWeekend(d) ? base + 0.1 : base;
      },
      durationRange: (d) => {
        const m = getMonth(d);
        if (m >= 3) return isWeekend(d) ? [30, 50] : [20, 40];
        return [20, 35];
      },
      baseHour: (d) => (isWeekend(d) ? randInt(7, 9) : randInt(6, 7)),
      notes: [
        '5K 跑完！',
        '今天配速 6:30/km',
        '膝蓋有點不舒服，慢跑',
        '跑步機 - 外面下雨',
        '間歇跑訓練',
        '呼吸節奏越來越穩',
        '河濱跑步好舒服',
        'PB 更新！',
      ],
      noteChance: 0.25,
    }, SEED_START, SEED_END),
  );

  // =========================================================================
  // 7. Generate time entries for Alice
  // =========================================================================

  // Alice's English
  allEntries.push(
    ...generateEntries(aliceEnglishBoard.id, {
      dailyChance: () => 0.45,
      durationRange: () => [20, 50],
      baseHour: () => randInt(19, 21),
      notes: ['TOEIC 模擬測驗', '單字複習', '聽力練習'],
      noteChance: 0.2,
      pickTaskId: () => pick(aliceEnglishTasks).id,
    }, SEED_START, SEED_END),
  );

  // Alice's Drawing
  allEntries.push(
    ...generateEntries(aliceDrawingBoard.id, {
      dailyChance: (d) => (isWeekend(d) ? 0.6 : 0.3),
      durationRange: (d) => (isWeekend(d) ? [40, 90] : [20, 40]),
      baseHour: () => randInt(14, 17),
      notes: ['人物速寫', '水彩練習', '靜物素描', '臨摹練習'],
      noteChance: 0.25,
    }, SEED_START, SEED_END),
  );

  // Alice's Frontend
  allEntries.push(
    ...generateEntries(aliceFrontendBoard.id, {
      dailyChance: () => 0.4,
      durationRange: () => [30, 60],
      baseHour: () => randInt(20, 22),
      notes: ['React 官方文件', 'Next.js tutorial', 'TypeScript 練習'],
      noteChance: 0.2,
      pickTaskId: () => pick(aliceFrontendTasks).id,
    }, SEED_START, SEED_END),
  );

  // =========================================================================
  // 8. Bulk insert all time entries
  // =========================================================================
  console.log(`  Inserting ${allEntries.length} time entries...`);

  // Prisma createMany for performance
  await prisma.timeEntry.createMany({
    data: allEntries.map((e) => ({
      boardId: e.boardId,
      taskId: e.taskId ?? null,
      duration: e.duration,
      startTime: e.startTime,
      endTime: e.endTime,
      note: e.note ?? null,
      createdAt: e.createdAt,
    })),
  });

  // =========================================================================
  // 9. Summary
  // =========================================================================
  const demoEntryCount = allEntries.filter((e) =>
    [japaneseBoard.id, leetcodeBoard.id, guitarBoard.id, skiBoard.id, readingBoard.id, runningBoard.id].includes(e.boardId),
  ).length;
  const aliceEntryCount = allEntries.length - demoEntryCount;

  console.log('');
  console.log('Seeding completed!');
  console.log(`  Users: 2 (Demo User, Alice Chen)`);
  console.log(`  Boards: 9 (6 demo + 3 alice)`);
  console.log(`  Time entries: ${allEntries.length} (${demoEntryCount} demo + ${aliceEntryCount} alice)`);
  console.log(`  Friendship: 1 (ACCEPTED)`);
  console.log(`  Friend invite: 1 (PENDING)`);
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
