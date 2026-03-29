/**
 * Board router for Learning Dashboard
 * Handles CRUD operations for boards with task-based and time-only types
 */
import { router, publicProcedure } from '../trpc';
import { z } from 'zod';
import { prisma } from '~/server/prisma';

export const boardRouter = router({
  /**
   * List all boards for a user, ordered by order field
   */
  list: publicProcedure
    .input(
      z.object({
        userId: z.string(),
      }),
    )
    .query(async ({ input }) => {
      return await prisma.board.findMany({
        where: {
          user_id: input.userId,
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
  byId: publicProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .query(async ({ input }) => {
      return await prisma.board.findUnique({
        where: {
          id: input.id,
        },
        include: {
          lists: {
            include: {
              tasks: {
                include: {
                  timeEntries: true,
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
  create: publicProcedure
    .input(
      z.object({
        name: z.string().min(1, 'Board name is required'),
        type: z.enum(['TASK_BASED', 'TIME_ONLY']),
        userId: z.string(),
        icon: z.string().optional(),
        color: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      // Get the highest order number to place new board at the end
      const maxOrder = await prisma.board.findFirst({
        where: {
          user_id: input.userId,
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
          user_id: input.userId,
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
  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        type: z.enum(['TASK_BASED', 'TIME_ONLY']).optional(),
        icon: z.string().optional(),
        color: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;

      return await prisma.board.update({
        where: {
          id,
        },
        data,
      });
    }),

  /**
   * Delete a board (cascades to lists, tasks, and time entries)
   */
  delete: publicProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      return await prisma.board.delete({
        where: {
          id: input.id,
        },
      });
    }),

  /**
   * Reorder boards
   */
  reorder: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        boardIds: z.array(z.string()),
      }),
    )
    .mutation(async ({ input }) => {
      // Update order for all boards in the array
      const updatePromises = input.boardIds.map((boardId, index) =>
        prisma.board.update({
          where: {
            id: boardId,
            user_id: input.userId, // Ensure user owns this board
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
  stats: publicProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .query(async ({ input }) => {
      const [totalLists, totalTasks, totalTimeMinutes, completedTasks] =
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
          // This is a placeholder - you might want to add a 'completed' field to Task model
          prisma.task.count({
            where: {
              list: {
                boardId: input.id,
              },
              // completed: true, // Uncomment when you add this field
            },
          }),
        ]);

      return {
        totalLists,
        totalTasks,
        completedTasks,
        totalTimeMinutes: totalTimeMinutes._sum.duration ?? 0,
        totalTimeHours: ((totalTimeMinutes._sum.duration ?? 0) / 60).toFixed(1),
      };
    }),
});
