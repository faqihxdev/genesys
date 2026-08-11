'use server';

import { db } from '@/db';
import { projectUsers } from '@/db/schema';
import {
  getUserDirectoryEntries,
  getUserDirectoryEntryByEmail,
} from '@/lib/supabase/user-directory';
import { and, eq, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { createAction, fail } from './_utils';
import { requireProjectAccess } from './authorization';

// ==================================================
// READ
// ==================================================

/**
 * @description Get user data by ID
 * @param userId - The user ID to get data for
 * @returns Promise with user data
 */
export const getUserById = createAction({
  name: 'getUserById',
  validator: z.object({
    userId: z.string().min(1, 'User ID is required'),
  }),
  requireAuth: true,
  actionFn: async ({ input, currentUser }) => {
    if (input.userId !== currentUser.id) {
      return fail({ message: 'Access denied', status: 403 });
    }

    const [user] = await getUserDirectoryEntries([input.userId]);

    if (!user) {
      return fail({ message: 'User not found', status: 404 });
    }

    return user;
  },
});

/**
 * @description Get user data for multiple users by their IDs
 * @param userIds - Array of user IDs to get data for
 * @returns Promise with array of user data
 */
export const getUsersByIds = createAction({
  name: 'getUsersByIds',
  validator: z.object({
    projectId: z.string().min(1, 'Project ID is required'),
    userIds: z.array(z.string().min(1, 'User ID is required')),
  }),
  requireAuth: true,
  actionFn: async ({ input, currentUser }) => {
    await requireProjectAccess({
      userId: currentUser.id,
      resource: { kind: 'project', id: input.projectId },
    });

    // Early return if no userIds provided
    if (input.userIds.length === 0) {
      return [];
    }

    const requestedUserIds = [...new Set(input.userIds)];
    const projectMemberIds = await db
      .select({ userId: projectUsers.userId })
      .from(projectUsers)
      .where(
        and(
          eq(projectUsers.projectId, input.projectId),
          inArray(projectUsers.userId, requestedUserIds)
        )
      );
    const uniqueIds = projectMemberIds.map(({ userId }) => userId);

    return getUserDirectoryEntries(uniqueIds);
  },
});

/**
 * @description Search for user by exact email match
 * @param email - The email to search for
 * @returns Promise with user data if found
 */
export const searchUsersByEmail = createAction({
  name: 'searchUsersByEmail',
  validator: z.object({
    projectId: z.string().min(1, 'Project ID is required'),
    email: z.string().email('Invalid email format'),
  }),
  requireAuth: true,
  actionFn: async ({ input, currentUser }) => {
    await requireProjectAccess({
      userId: currentUser.id,
      resource: { kind: 'project', id: input.projectId },
      allowedRoles: ['owner'],
    });

    try {
      return await getUserDirectoryEntryByEmail(input.email);
    } catch {
      return fail({ message: 'Failed to search users', status: 500 });
    }
  },
});
