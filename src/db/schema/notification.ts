import { generateId } from '@/db/schema/_utils';
import { relations } from 'drizzle-orm';
import { boolean, index, jsonb, pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { ID_LENGTH, timestamps } from './_utils';
import { feedback } from './feedback';
import { projectInvites } from './invite';
import { projects } from './project';
import { supportTickets } from './support';

/**
 * Notification category enum
 * Groups notifications into logical categories
 */
export const notificationCategoryEnum = pgEnum('notification_category', [
  'project', // Project related notifications
  'invite', // Invite related notifications
  'support', // Support ticket related notifications
  'feedback', // Feedback related notifications
  'simulation', // Simulation related notifications
  'system', // System notifications
]);

/**
 * Notification type enum
 * Specific types of notifications within each category
 */
export const notificationTypeEnum = pgEnum('notification_type', [
  // Project notifications
  'project_role_updated',
  'project_deleted',
  'project_updated',
  // Invite notifications
  'invite_received',
  'invite_accepted',
  'invite_rejected',
  // Support notifications
  'support_status_updated',
  'support_response_received',
  'support_priority_updated',
  // Feedback notifications
  'feedback_status_updated',
  'feedback_response_received',
  // Simulation notifications
  'simulation_completed',
  'funnel_analysis_ready',
  'performance_alert',
  // System notifications
  'system_maintenance',
  'system_update',
]);

/**
 * Notification priority enum
 */
export const notificationPriorityEnum = pgEnum('notification_priority', [
  'low',
  'medium',
  'high',
  'urgent',
]);

/**
 * Notifications table schema
 * Stores all user notifications
 */
export const notifications = pgTable(
  'notifications',
  {
    id: text('id')
      .$defaultFn(() => generateId({ length: ID_LENGTH, prefix: 'ntf-' }))
      .primaryKey(),
    userId: text('user_id').notNull(), // FK: which user is this notification for?
    category: notificationCategoryEnum('notification_category').notNull(), // category of notification
    type: notificationTypeEnum('notification_type').notNull(), // specific type of notification
    priority: notificationPriorityEnum('notification_priority').notNull().default('low'), // priority level
    title: text('title').notNull(), // notification title
    message: text('message').notNull(), // notification message
    isRead: boolean('is_read').notNull().default(false), // whether notification has been read
    isArchived: boolean('is_archived').notNull().default(false), // whether notification has been archived
    actionUrl: text('action_url'), // optional URL to navigate to when clicked
    metadata: jsonb('metadata'), // additional data specific to notification type
    expiresAt: timestamp('expires_at'), // optional expiration date
    ...timestamps,
  },
  (table) => [
    // Indexes for common queries
    index('notification_user_id_idx').on(table.userId),
    index('notification_category_idx').on(table.category),
    index('notification_type_idx').on(table.type),
    index('notification_priority_idx').on(table.priority),
    index('notification_is_read_idx').on(table.isRead),
    index('notification_is_archived_idx').on(table.isArchived),
    index('notification_created_at_idx').on(table.createdAt),
    // Compound indexes for common filtering scenarios
    index('notification_user_status_idx').on(table.userId, table.isRead, table.isArchived),
    index('notification_user_priority_idx').on(table.userId, table.priority),
  ]
);

/**
 * Relations for notifications
 */
export const notificationsRelations = relations(notifications, ({ one }) => ({
  project: one(projects, {
    fields: [notifications.metadata],
    references: [projects.id],
    relationName: 'notification_project',
  }),
  supportTicket: one(supportTickets, {
    fields: [notifications.metadata],
    references: [supportTickets.id],
    relationName: 'notification_support_ticket',
  }),
  feedback: one(feedback, {
    fields: [notifications.metadata],
    references: [feedback.id],
    relationName: 'notification_feedback',
  }),
  invite: one(projectInvites, {
    fields: [notifications.metadata],
    references: [projectInvites.id],
    relationName: 'notification_invite',
  }),
}));

// Inferred types
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
export type NotificationCategory = (typeof notificationCategoryEnum.enumValues)[number];
export type NotificationType = (typeof notificationTypeEnum.enumValues)[number];
export type NotificationPriority = (typeof notificationPriorityEnum.enumValues)[number];

// Type for notification metadata based on category
export type NotificationMetadata = {
  project?: {
    projectId: string;
    action?: string;
    changes?: Record<string, unknown>;
  };
  invite?: {
    inviteId: string;
    projectId: string;
    inviterUserId: string;
  };
  support?: {
    ticketId: string;
    oldStatus?: string;
    newStatus?: string;
    responseId?: string;
  };
  feedback?: {
    feedbackId: string;
    oldStatus?: string;
    newStatus?: string;
    responseId?: string;
  };
  simulation?: {
    simulationId: string;
    metrics?: Record<string, unknown>;
    insights?: string[];
  };
  system?: {
    code: string;
    details?: Record<string, unknown>;
  };
};
