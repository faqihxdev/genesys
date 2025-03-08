'use server';

import { db } from '@/db';
import type { NotificationCategory, NotificationMetadata, NotificationType } from '@/db/schema';
import { notifications } from '@/db/schema';
import { and, desc, eq, lt, sql } from 'drizzle-orm';
import { z } from 'zod';
import { createAction } from './_utils';

// ==================================================
// CREATE
// ==================================================

/**
 * @description Create a new notification
 * @param input - The notification data
 * @returns Promise with the created notification
 */
export const createNotification = createAction({
  name: 'createNotification',
  validator: z.object({
    userId: z.string().min(1, 'User ID is required'),
    category: z.string().min(1, 'Category is required'),
    type: z.string().min(1, 'Type is required'),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
    title: z.string().min(1, 'Title is required'),
    message: z.string().min(1, 'Message is required'),
    actionUrl: z.string().optional(),
    metadata: z.record(z.any()).optional(),
    expiresAt: z.date().optional(),
  }),
  requireAuth: true,
  actionFn: async ({ input }) => {
    const [notification] = await db
      .insert(notifications)
      .values({
        userId: input.userId,
        category: input.category as NotificationCategory,
        type: input.type as NotificationType,
        priority: input.priority || 'low',
        title: input.title,
        message: input.message,
        actionUrl: input.actionUrl,
        metadata: input.metadata as NotificationMetadata,
        expiresAt: input.expiresAt,
      })
      .returning();

    return notification;
  },
});

// ==================================================
// READ
// ==================================================

/**
 * @description Get user's notifications with pagination and filters
 * @param input - Query parameters
 * @returns Promise with notifications and count
 */
export const getUserNotifications = createAction({
  name: 'getUserNotifications',
  validator: z.object({
    limit: z.number().min(1).max(50).optional().default(20),
    offset: z.number().min(0).optional().default(0),
    includeRead: z.boolean().optional().default(false),
    includeArchived: z.boolean().optional().default(false),
    category: z.string().optional(),
    type: z.string().optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  }),
  requireAuth: true,
  actionFn: async ({ input, currentUser }) => {
    const limit = input.limit ?? 20;
    const offset = input.offset ?? 0;

    // Build where clause based on filters
    const whereClause = and(
      eq(notifications.userId, currentUser.id),
      // Only include non-expired notifications
      sql`(${notifications.expiresAt} IS NULL OR ${notifications.expiresAt} > NOW())`,
      // Apply optional filters
      input.includeRead ? undefined : eq(notifications.isRead, false),
      input.includeArchived ? undefined : eq(notifications.isArchived, false),
      input.category
        ? eq(notifications.category, input.category as NotificationCategory)
        : undefined,
      input.type ? eq(notifications.type, input.type as NotificationType) : undefined,
      input.priority ? eq(notifications.priority, input.priority) : undefined
    );

    // Get notifications with count
    const [notificationsList, [{ count }]] = await Promise.all([
      db
        .select()
        .from(notifications)
        .where(whereClause)
        .orderBy(desc(notifications.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(notifications)
        .where(whereClause),
    ]);

    return {
      notifications: notificationsList,
      count: Number(count),
    };
  },
});

/**
 * @description Get user's unread notification count
 * @returns Promise with unread count
 */
export const getUnreadCount = createAction({
  name: 'getUnreadCount',
  validator: null,
  requireAuth: true,
  actionFn: async ({ currentUser }) => {
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, currentUser.id),
          eq(notifications.isRead, false),
          eq(notifications.isArchived, false),
          sql`(${notifications.expiresAt} IS NULL OR ${notifications.expiresAt} > NOW())`
        )
      );

    return Number(count);
  },
});

// ==================================================
// UPDATE
// ==================================================

/**
 * @description Mark notifications as read
 * @param input - The notification IDs to mark as read
 * @returns Promise with success status
 */
export const markNotificationsAsRead = createAction({
  name: 'markNotificationsAsRead',
  validator: z.object({
    notificationIds: z.array(z.string()).min(1, 'At least one notification ID is required'),
  }),
  requireAuth: true,
  actionFn: async ({ input, currentUser }) => {
    const result = await db
      .update(notifications)
      .set({ isRead: true, updatedAt: new Date() })
      .where(
        and(
          eq(notifications.userId, currentUser.id),
          sql`${notifications.id} = ANY(${sql`ARRAY[${sql.join(input.notificationIds)}]`})`
        )
      )
      .returning();

    return result.length > 0;
  },
});

/**
 * @description Mark all notifications as read
 * @returns Promise with success status
 */
export const markAllNotificationsAsRead = createAction({
  name: 'markAllNotificationsAsRead',
  validator: null,
  requireAuth: true,
  actionFn: async ({ currentUser }) => {
    const result = await db
      .update(notifications)
      .set({ isRead: true, updatedAt: new Date() })
      .where(
        and(
          eq(notifications.userId, currentUser.id),
          eq(notifications.isRead, false),
          eq(notifications.isArchived, false)
        )
      )
      .returning();

    return result.length > 0;
  },
});

/**
 * @description Archive notifications
 * @param input - The notification IDs to archive
 * @returns Promise with success status
 */
export const archiveNotifications = createAction({
  name: 'archiveNotifications',
  validator: z.object({
    notificationIds: z.array(z.string()).min(1, 'At least one notification ID is required'),
  }),
  requireAuth: true,
  actionFn: async ({ input, currentUser }) => {
    const result = await db
      .update(notifications)
      .set({ isArchived: true, updatedAt: new Date() })
      .where(
        and(
          eq(notifications.userId, currentUser.id),
          sql`${notifications.id} = ANY(${sql`ARRAY[${sql.join(input.notificationIds)}]`})`
        )
      )
      .returning();

    return result.length > 0;
  },
});

/**
 * @description Mark notifications as unread
 * @param input - The notification IDs to mark as unread
 * @returns Promise with success status
 */
export const markNotificationsAsUnread = createAction({
  name: 'markNotificationsAsUnread',
  validator: z.object({
    notificationIds: z.array(z.string()).min(1, 'At least one notification ID is required'),
  }),
  requireAuth: true,
  actionFn: async ({ input, currentUser }) => {
    const result = await db
      .update(notifications)
      .set({ isRead: false, updatedAt: new Date() })
      .where(
        and(
          eq(notifications.userId, currentUser.id),
          sql`${notifications.id} = ANY(${sql`ARRAY[${sql.join(input.notificationIds)}]`})`
        )
      )
      .returning();

    return result.length > 0;
  },
});

// ==================================================
// DELETE
// ==================================================

/**
 * @description Delete expired notifications
 * @returns Promise with number of deleted notifications
 */
export const deleteExpiredNotifications = createAction({
  name: 'deleteExpiredNotifications',
  validator: null,
  requireAuth: false,
  actionFn: async () => {
    const result = await db
      .delete(notifications)
      .where(
        and(lt(notifications.expiresAt!, new Date()), sql`${notifications.expiresAt} IS NOT NULL`)
      )
      .returning();

    return result.length;
  },
});

/**
 * @description Delete archived notifications older than the specified days
 * @param input - Days to keep archived notifications
 * @returns Promise with number of deleted notifications
 */
export const deleteOldArchivedNotifications = createAction({
  name: 'deleteOldArchivedNotifications',
  validator: z.object({
    daysToKeep: z.number().min(1).max(365).default(30),
  }),
  requireAuth: false,
  actionFn: async ({ input }) => {
    const daysToKeep = input.daysToKeep ?? 30;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await db
      .delete(notifications)
      .where(and(eq(notifications.isArchived, true), lt(notifications.createdAt, cutoffDate)))
      .returning();

    return result.length;
  },
});
