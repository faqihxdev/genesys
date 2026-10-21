import { generateId } from '@/db/schema/_utils';
import { ID_LENGTH, timestamps } from './_utils';
import { enumColumn, sqliteTable, text } from './sqlite';

/**
 * Feedback type enum
 */
export const feedbackTypeEnum = enumColumn('feedback_type', [
  'bug',
  'feature',
  'improvement',
  'other',
]);

/**
 * Feedback satisfaction enum
 */
export const feedbackSatisfactionEnum = enumColumn('feedback_satisfaction', [
  'very-satisfied',
  'satisfied',
  'neutral',
  'dissatisfied',
  'very-dissatisfied',
]);

/**
 * Feedback status enum
 */
export const feedbackStatusEnum = enumColumn('feedback_status', [
  'pending',
  'in-review',
  'planned',
  'in-progress',
  'completed',
  'declined',
]);

/**
 * Feedback table schema
 */
export const feedback = sqliteTable('feedback', {
  id: text('id')
    .$defaultFn(() => generateId({ length: ID_LENGTH, prefix: 'fdb-' }))
    .primaryKey(),
  userId: text('user_id').notNull(), // auth_users identifier
  title: text('title').notNull(),
  type: feedbackTypeEnum('feedback_type').notNull(),
  description: text('description').notNull(),
  satisfaction: feedbackSatisfactionEnum('feedback_satisfaction').notNull(),
  status: feedbackStatusEnum('feedback_status').notNull().default('pending'),
  adminResponse: text('admin_response'), // Optional response from admin
  ...timestamps,
});

// Inferred types
export type Feedback = typeof feedback.$inferSelect;
export type NewFeedback = typeof feedback.$inferInsert;
export type FeedbackType = (typeof feedbackTypeEnum.enumValues)[number];
export type FeedbackSatisfaction = (typeof feedbackSatisfactionEnum.enumValues)[number];
export type FeedbackStatus = (typeof feedbackStatusEnum.enumValues)[number];
