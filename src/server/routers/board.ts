/**
 * Board router for LearnTrack
 * Handles CRUD operations for boards with task-based and time-only types
 */
import { router, protectedProcedure } from '../trpc';
import { z } from 'zod';
import { prisma } from '~/server/prisma';
import { TRPCError } from '@trpc/server';

export const boardRouter = router({
  /**
   * List all boards for a user, ordered by order field
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    return await prisma.board.findMany({
      where: {
        user_id: ctx.userId,
      },
      include: {
        lists: {
          include: {
            tasks: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
        timeEntries: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 10, // Latest 10 time entries
        },
      },
      orderBy: {
        order: 'asc',
      },
    });
  }),

  /**
   * Get a single board by ID with all related data
   */
  byId: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return await prisma.board.findFirst({
        where: {
          id: input.id,
          user_id: ctx.userId,
        },
        include: {
          lists: {
            include: {
              tasks: {
                include: {
                  // board 頁面只需要 duration 來算 totalMinutes，不撈其他欄位
                  timeEntries: { select: { duration: true } },
                },
                orderBy: {
                  order: 'asc',
                },
              },
            },
            orderBy: {
              order: 'asc',
            },
          },
          timeEntries: {
            include: {
              task: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      });
    }),

  /**
   * Create a new board
   */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, 'Board name is required'),
        type: z.enum(['TASK_BASED', 'TIME_ONLY']),
        icon: z.string().optional(),
        color: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Get the highest order number to place new board at the end
      const maxOrder = await prisma.board.findFirst({
        where: {
          user_id: ctx.userId,
        },
        orderBy: {
          order: 'desc',
        },
        select: {
          order: true,
        },
      });

      const defaultLists = input.type === 'TASK_BASED'
        ? [
            { name: 'To-do', order: 0 },
            { name: 'In Progress', order: 1 },
            { name: 'Complete', order: 2 },
          ]
        : [];

      return await prisma.board.create({
        data: {
          name: input.name,
          type: input.type,
          user_id: ctx.userId,
          icon: input.icon,
          color: input.color,
          order: (maxOrder?.order ?? -1) + 1,
          lists: {
            create: defaultLists,
          },
        },
      });
    }),

  /**
   * Update board properties
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        icon: z.string().optional(),
        color: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      return await prisma.board.update({
        where: {
          id,
          user_id: ctx.userId,
        },
        data,
      });
    }),

  /**
   * Delete a board (cascades to lists, tasks, and time entries)
   */
  delete: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await prisma.board.delete({
        where: {
          id: input.id,
          user_id: ctx.userId,
        },
      });
    }),

  /**
   * Reorder boards
   */
  reorder: protectedProcedure
    .input(
      z.object({
        boardIds: z.array(z.string()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Update order for all boards in the array
      const updatePromises = input.boardIds.map((boardId, index) =>
        prisma.board.update({
          where: {
            id: boardId,
            user_id: ctx.userId, // Ensure user owns this board
          },
          data: {
            order: index,
          },
        }),
      );

      return await prisma.$transaction(updatePromises);
    }),

  /**
   * Get board statistics
   */
  stats: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const board = await prisma.board.findFirst({
        where: { id: input.id, user_id: ctx.userId },
        select: { id: true },
      });
      if (!board) throw new TRPCError({ code: 'NOT_FOUND', message: 'Board not found' });

      const [totalLists, totalTasks, totalTimeMinutes] =
        await prisma.$transaction([
          // Count lists
          prisma.list.count({
            where: {
              boardId: input.id,
            },
          }),
          // Count tasks
          prisma.task.count({
            where: {
              list: {
                boardId: input.id,
              },
            },
          }),
          // Sum time entries
          prisma.timeEntry.aggregate({
            where: {
              boardId: input.id,
            },
            _sum: {
              duration: true,
            },
          }),
        ]);

      return {
        totalLists,
        totalTasks,
        totalTimeMinutes: totalTimeMinutes._sum.duration ?? 0,
        totalTimeHours: ((totalTimeMinutes._sum.duration ?? 0) / 60).toFixed(1),
      };
    }),
});
