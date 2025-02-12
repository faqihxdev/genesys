'use server';

import type { ActionResponse } from '@/types/utils';
import supabaseAdmin from '@/utils/supabase/admin-client';
import { getCurrentUser } from './auth';

export interface UserData {
  id: string;
  email: string;
}

/**
 * @description Get user data by ID
 * @param userId - The user ID to get data for
 * @returns Promise with user data
 */
export async function getUserById(userId: string): Promise<ActionResponse<UserData>> {
  try {
    const { data: user, error: authError } = await getCurrentUser();
    if (authError) return { data: null, error: authError };
    if (!user) return { data: null, error: { message: 'Unauthorized', status: 401 } };

    const { data: userData, error } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (error) throw error;
    if (!userData.user) return { data: null, error: { message: 'User not found' } };

    return {
      data: {
        id: userData.user.id,
        email: userData.user.email || '',
      },
      error: null,
    };
  } catch (error) {
    console.error('[getUserById]: ', error);
    return { data: null, error: { message: 'Failed to get user data' } };
  }
}

/**
 * @description Get user data for multiple users by their IDs
 * @param userIds - Array of user IDs to get data for
 * @returns Promise with array of user data
 */
export async function getUsersByIds(userIds: string[]): Promise<ActionResponse<UserData[]>> {
  try {
    const { data: user, error: authError } = await getCurrentUser();
    if (authError) return { data: null, error: authError };
    if (!user) return { data: null, error: { message: 'Unauthorized', status: 401 } };

    // Remove duplicates
    const uniqueIds = [...new Set(userIds)];

    // Get users in batches of 10 to avoid rate limiting
    const batchSize = 10;
    const batches = [];
    for (let i = 0; i < uniqueIds.length; i += batchSize) {
      const batch = uniqueIds.slice(i, i + batchSize);
      batches.push(batch);
    }

    const users: UserData[] = [];
    for (const batch of batches) {
      const promises = batch.map((id) => supabaseAdmin.auth.admin.getUserById(id));
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

    return { data: users, error: null };
  } catch (error) {
    console.error('[getUsersByIds]: ', error);
    return { data: null, error: { message: 'Failed to get user data' } };
  }
}

/**
 * @description Search for user by exact email match
 * @param email - The email to search for
 * @returns Promise with user data if found
 */
export async function searchUsersByEmail(email: string): Promise<ActionResponse<UserData | null>> {
  try {
    const { data: user, error: authError } = await getCurrentUser();
    if (authError) return { data: null, error: authError };
    if (!user) return { data: null, error: { message: 'Unauthorized', status: 401 } };

    // Call the RPC function to search user by exact email match
    const { data, error } = await supabaseAdmin.rpc('get_user_by_email', {
      p_email: email.toLowerCase(),
    });

    if (error) throw error;

    // Since RPC returns a single row or nothing, we can simplify this
    const foundUser = Array.isArray(data) && data.length > 0 ? data[0] : null;

    return {
      data: foundUser
        ? {
            id: foundUser.id,
            email: foundUser.email,
          }
        : null,
      error: null,
    };
  } catch (error) {
    console.error('[searchUsersByEmail]: ', error);
    return { data: null, error: { message: 'Failed to search user' } };
  }
}
