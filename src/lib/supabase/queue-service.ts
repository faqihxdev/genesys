/**
 * @file Queue Service Utilities
 * @description Custom queue system that uses our database tables instead of pgmq
 */

import { db } from '@/db';
import { queueTasks, SimulationTaskPayload } from '@/db/schema/queue';
import { and, eq, lt } from 'drizzle-orm';

/**
 * Queue names used in the system
 */
export const QUEUE_NAMES = {
  SIMULATION_TASKS: 'simulation_tasks',
  FAILED_TASKS: 'failed_tasks',
} as const;

/**
 * Enqueue a simulation task
 * @param message - The simulation task payload
 * @returns The task ID if successful
 */
export async function enqueueSimulationTask(
  message: SimulationTaskPayload
): Promise<string | null> {
  try {
    const [task] = await db
      .insert(queueTasks)
      .values({
        queueName: QUEUE_NAMES.SIMULATION_TASKS,
        payload: message,
      })
      .returning();

    return task?.id || null;
  } catch (error) {
    console.error('[enqueueSimulationTask]:', error);
    return null;
  }
}

/**
 * Dequeue a simulation task
 * This marks a task as processing so other workers don't pick it up
 * @param visibilityTimeoutSeconds - How long the task should be invisible to other workers
 * @returns The task and its ID if one is available
 */
export async function dequeueSimulationTask(
  visibilityTimeoutSeconds = 300
): Promise<{ id: string; payload: SimulationTaskPayload } | null> {
  try {
    // Begin transaction
    return await db.transaction(async (tx) => {
      // Find a pending task that's ready to be processed
      const [pendingTask] = await tx
        .select()
        .from(queueTasks)
        .where(
          and(
            eq(queueTasks.queueName, QUEUE_NAMES.SIMULATION_TASKS),
            eq(queueTasks.status, 'pending'),
            lt(queueTasks.visibleAfter, new Date())
          )
        )
        .limit(1);

      if (!pendingTask) {
        return null;
      }

      // Mark task as processing with an exclusive check to avoid race conditions
      const visibleAfter = new Date();
      visibleAfter.setSeconds(visibleAfter.getSeconds() + visibilityTimeoutSeconds);

      const [updatedTask] = await tx
        .update(queueTasks)
        .set({
          status: 'processing',
          processingStartedAt: new Date(),
          visibleAfter,
        })
        .where(
          and(
            eq(queueTasks.id, pendingTask.id),
            eq(queueTasks.status, 'pending') // Ensure the status hasn't changed
          )
        )
        .returning();

      if (!updatedTask) {
        // Another process might have claimed this task already
        return null;
      }

      return {
        id: updatedTask.id,
        payload: updatedTask.payload as SimulationTaskPayload,
      };
    });
  } catch (error) {
    console.error('[dequeueSimulationTask]:', error);
    return null;
  }
}

/**
 * Mark a task as completed
 * @param taskId - The ID of the task to mark as completed
 * @returns True if successful
 */
export async function completeSimulationTask(taskId: string): Promise<boolean> {
  try {
    const [updatedTask] = await db
      .update(queueTasks)
      .set({
        status: 'completed',
        processingCompletedAt: new Date(),
      })
      .where(eq(queueTasks.id, taskId))
      .returning();

    return !!updatedTask;
  } catch (error) {
    console.error('[completeSimulationTask]:', error);
    return false;
  }
}

/**
 * Mark a simulation task as failed
 * @param taskId - The ID of the task that failed
 * @param error - The error that occurred
 * @returns True if successful
 */
export async function failSimulationTask(taskId: string, error: Error | string): Promise<boolean> {
  try {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const errorDetails =
      typeof error === 'string'
        ? undefined
        : {
            message: error.message,
            stack: error.stack,
            time: new Date().toISOString(),
          };

    // Get the original task to create a failure record
    const originalTask = await db.query.queueTasks.findFirst({
      where: eq(queueTasks.id, taskId),
    });

    if (!originalTask) {
      console.error(`[failSimulationTask]: Task ${taskId} not found`);
      return false;
    }

    // Create a failure record
    await db.insert(queueTasks).values({
      queueName: QUEUE_NAMES.FAILED_TASKS,
      status: 'failed',
      payload: originalTask.payload,
      errorMessage,
      errorDetails,
      retryCount: originalTask.retryCount,
    });

    // Update the original task
    const [updatedTask] = await db
      .update(queueTasks)
      .set({
        status: 'failed',
        processingCompletedAt: new Date(),
        errorMessage,
        errorDetails,
      })
      .where(eq(queueTasks.id, taskId))
      .returning();

    return !!updatedTask;
  } catch (error) {
    console.error('[failSimulationTask]:', error);
    return false;
  }
}

/**
 * Retry a failed simulation task
 * @param taskId - The ID of the failed task
 * @returns The new task ID if successful
 */
export async function retrySimulationTask(taskId: string): Promise<string | null> {
  try {
    // Get the original task
    const failedTask = await db.query.queueTasks.findFirst({
      where: and(eq(queueTasks.id, taskId), eq(queueTasks.status, 'failed')),
    });

    if (!failedTask) {
      console.error(`[retrySimulationTask]: Failed task ${taskId} not found`);
      return null;
    }

    // Parse the retry count or default to 0
    const currentRetryCount = parseInt(failedTask.retryCount || '0', 10);

    // Create a new task based on the failed one
    const [newTask] = await db
      .insert(queueTasks)
      .values({
        queueName: QUEUE_NAMES.SIMULATION_TASKS,
        status: 'pending',
        payload: failedTask.payload,
        retryCount: (currentRetryCount + 1).toString(),
      })
      .returning();

    return newTask?.id || null;
  } catch (error) {
    console.error('[retrySimulationTask]:', error);
    return null;
  }
}

/**
 * Clean up old completed tasks
 * @param olderThanDays - Delete tasks older than this many days
 * @returns Number of tasks deleted
 */
export async function cleanupCompletedTasks(olderThanDays = 7): Promise<number> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await db
      .delete(queueTasks)
      .where(and(eq(queueTasks.status, 'completed'), lt(queueTasks.updatedAt, cutoffDate)));

    return Number(result.count) || 0;
  } catch (error) {
    console.error('[cleanupCompletedTasks]:', error);
    return 0;
  }
}

/**
 * Get task statistics
 * @returns Queue statistics
 */
export async function getQueueStats(): Promise<{
  pendingCount: number;
  processingCount: number;
  completedCount: number;
  failedCount: number;
  totalCount: number;
}> {
  try {
    const pendingCount = await db
      .select({ count: queueTasks.id })
      .from(queueTasks)
      .where(eq(queueTasks.status, 'pending'))
      .then((result) => result.length);

    const processingCount = await db
      .select({ count: queueTasks.id })
      .from(queueTasks)
      .where(eq(queueTasks.status, 'processing'))
      .then((result) => result.length);

    const completedCount = await db
      .select({ count: queueTasks.id })
      .from(queueTasks)
      .where(eq(queueTasks.status, 'completed'))
      .then((result) => result.length);

    const failedCount = await db
      .select({ count: queueTasks.id })
      .from(queueTasks)
      .where(eq(queueTasks.status, 'failed'))
      .then((result) => result.length);

    return {
      pendingCount,
      processingCount,
      completedCount,
      failedCount,
      totalCount: pendingCount + processingCount + completedCount + failedCount,
    };
  } catch (error) {
    console.error('[getQueueStats]:', error);
    return {
      pendingCount: 0,
      processingCount: 0,
      completedCount: 0,
      failedCount: 0,
      totalCount: 0,
    };
  }
}
