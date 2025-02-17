'use server';

import supabaseAdmin from '@/lib/supabase/admin-client';
import { z } from 'zod';
import { createAction } from './_utils';

export interface UserData {
  id: string;
  email: string;
}

// ==================================================
// READ
// ==================================================

/**
 * @description Get user data by ID
 * @param userId - The user ID to get data for
 * @returns Promise with user data
 */
export const getUserById = createAction({
  validator: z.object({
    userId: z.string().min(1, 'User ID is required'),
  }),
  requireAuth: true,
  actionFn: async ({ input }) => {
    const { data: userData, error } = await supabaseAdmin.auth.admin.getUserById(input.userId);
    if (error) throw error;
    if (!userData.user || !userData.user.email) {
      throw new Error('User not found');
    }

    return {
      id: userData.user.id,
      email: userData.user.email,
    };
  },
});

/**
 * @description Get user data for multiple users by their IDs
 * @param userIds - Array of user IDs to get data for
 * @returns Promise with array of user data
 */
export const getUsersByIds = createAction({
  validator: z.object({
    userIds: z.array(z.string().min(1, 'User ID is required')),
  }),
  requireAuth: true,
  actionFn: async ({ input }) => {
    // Early return if no userIds provided
    if (input.userIds.length === 0) {
      return [];
    }

    // Remove duplicates
    const uniqueIds = [...new Set(input.userIds)];

    // Get users in batches of 10 to avoid rate limiting
    const batchSize = 10;
    const batches = [];
    for (let i = 0; i < uniqueIds.length; i += batchSize) {
      const batch = uniqueIds.slice(i, i + batchSize);
      batches.push(batch);
    }

    const users: UserData[] = [];
    for (const batch of batches) {
      const promises = batch.map((id: string) => supabaseAdmin.auth.admin.getUserById(id));
      const results = await Promise.all(promises);

      for (const { data, error } of results) {
        if (error) continue;
        if (data.user && data.user.email) {
          users.push({
            id: data.user.id,
            email: data.user.email,
          });
        }
      }
    }

    return users;
  },
});

/**
 * @description Search for user by exact email match
 * @param email - The email to search for
 * @returns Promise with user data if found
 */
export const searchUsersByEmail = createAction({
  validator: z.object({
    email: z.string().email('Invalid email format'),
  }),
  requireAuth: true,
  actionFn: async ({ input }) => {
    // Call the RPC function to search user by exact email match
    const { data, error } = await supabaseAdmin.rpc('get_user_by_email', {
      p_email: input.email.toLowerCase(),
    });

    if (error) throw error;

    // Since RPC returns a single row or nothing, we can simplify this
    const foundUser = Array.isArray(data) && data.length > 0 ? data[0] : null;

    return foundUser
      ? {
          id: foundUser.id,
          email: foundUser.email,
        }
      : null;
  },
});
