/**
 * @file Queue Schema
 * @description Custom queue system for processing background tasks
 */

import { generateId } from '@/db/schema/_utils';
import { relations } from 'drizzle-orm';
import { index, jsonb, pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { ID_LENGTH, timestamps } from './_utils';
import { simulations } from './simulation';

/**
 * Queue task status enum
 * Defines the possible states of a task in the queue
 */
export const queueTaskStatusEnum = pgEnum('queue_task_status', [
  'pending', // Ready to be processed
  'processing', // Currently being processed
  'completed', // Successfully completed
  'failed', // Failed with error
  'cancelled', // Cancelled by user or system
]);

/**
 * Queue tasks table schema
 * Represents tasks that need to be processed by background workers
 */
export const queueTasks = pgTable(
  'queue_tasks',
  {
    id: text()
      .$defaultFn(() => generateId({ length: ID_LENGTH, prefix: 'task-' }))
      .primaryKey(),
    queueName: text('queue_name').notNull(), // Name of the queue (e.g., simulation_tasks)
    status: queueTaskStatusEnum('status').notNull().default('pending'),
    payload: jsonb('payload').notNull(), // Task payload (depends on queue type)
    processingStartedAt: timestamp('processing_started_at'), // When task started processing
    processingCompletedAt: timestamp('processing_completed_at'), // When task finished processing
    errorMessage: text('error_message'), // Error message if task failed
    errorDetails: jsonb('error_details'), // Detailed error information
    retryCount: text('retry_count').default('0'), // Number of times this task has been retried
    visibleAfter: timestamp('visible_after').notNull().defaultNow(), // Task becomes visible for processing after this time
    ...timestamps,
  },
  (table) => [
    index('queue_tasks_queue_name_idx').on(table.queueName),
    index('queue_tasks_status_idx').on(table.status),
    index('queue_tasks_visible_after_idx').on(table.visibleAfter),
    index('queue_tasks_created_at_idx').on(table.createdAt),
  ]
);

/**
 * Relations between queue tasks and simulations
 */
export const queueTasksRelations = relations(queueTasks, ({ one }) => ({
  simulation: one(simulations, {
    fields: [queueTasks.id],
    references: [simulations.id],
    relationName: 'queueTaskSimulation',
  }),
}));

/**
 * Type definitions for the queue schema
 */
export type QueueTask = typeof queueTasks.$inferSelect;
export type NewQueueTask = typeof queueTasks.$inferInsert;
export type QueueTaskStatus = (typeof queueTaskStatusEnum.enumValues)[number];

/**
 * Simulation task payload interface
 * This is the structure of the payload for simulation tasks
 */
export interface SimulationTaskPayload {
  simulationId: string;
  personaId: string;
  stageId: string;
  chunkId: string;
  retry?: number;
}
