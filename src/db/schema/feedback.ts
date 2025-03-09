import { generateId } from '@/db/schema/_utils';
import { pgEnum, pgTable, text } from 'drizzle-orm/pg-core';
import { ID_LENGTH, timestamps } from './_utils';

/**
 * Feedback type enum
 */
export const feedbackTypeEnum = pgEnum('feedback_type', ['bug', 'feature', 'improvement', 'other']);

/**
 * Feedback satisfaction enum
 */
export const feedbackSatisfactionEnum = pgEnum('feedback_satisfaction', [
  'very-satisfied',
  'satisfied',
  'neutral',
  'dissatisfied',
  'very-dissatisfied',
]);

/**
 * Feedback status enum
 */
export const feedbackStatusEnum = pgEnum('feedback_status', [
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
export const feedback = pgTable('feedback', {
  id: text('id')
    .$defaultFn(() => generateId({ length: ID_LENGTH, prefix: 'fdb-' }))
    .primaryKey(),
  userId: text('user_id').notNull(), // FK: which user submitted this feedback? (Supabase auth user id)
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
