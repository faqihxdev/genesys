'use server';

import { db } from '@/db';
import type { NotificationCategory, NotificationType } from '@/db/schema';
import { notifications } from '@/db/schema';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { z } from 'zod';
import { createAction } from './_utils';

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
      sql`(${notifications.expiresAt} IS NULL OR ${notifications.expiresAt} > (unixepoch('subsec') * 1000))`,
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
          sql`(${notifications.expiresAt} IS NULL OR ${notifications.expiresAt} > (unixepoch('subsec') * 1000))`
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
          inArray(notifications.id, input.notificationIds)
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
          inArray(notifications.id, input.notificationIds)
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
          inArray(notifications.id, input.notificationIds)
        )
      )
      .returning();

    return result.length > 0;
  },
});
