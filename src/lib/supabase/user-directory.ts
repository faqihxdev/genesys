import 'server-only';

import supabaseAdmin from '@/lib/supabase/admin-client';

export interface UserDirectoryEntry {
  id: string;
  email: string;
}

/**
 * @description Fetches public user directory fields for known user IDs.
 * @param userIds - Authorized user IDs to resolve
 * @returns User IDs and emails that could be resolved
 */
export async function getUserDirectoryEntries(
  userIds: readonly string[]
): Promise<UserDirectoryEntry[]> {
  const uniqueIds = [...new Set(userIds)];
  const batchSize = 10;
  const users: UserDirectoryEntry[] = [];

  for (let index = 0; index < uniqueIds.length; index += batchSize) {
    const batch = uniqueIds.slice(index, index + batchSize);

    try {
      const results = await Promise.all(
        batch.map((userId) => supabaseAdmin.auth.admin.getUserById(userId))
      );

      for (const { data, error } of results) {
        if (error) {
          console.error('[UserDirectory/getUserDirectoryEntries]: ', error);
          continue;
        }

        if (data.user?.email) {
          users.push({
            id: data.user.id,
            email: data.user.email,
          });
        }
      }
    } catch (error) {
      console.error('[UserDirectory/getUserDirectoryEntries]: ', error);
    }
  }

  return users;
}

/**
 * @description Finds an authentication user by exact normalized email through a server-only RPC.
 * @param email - Authorized email address to resolve
 * @returns Matching user directory entry or null
 */
export async function getUserDirectoryEntryByEmail(
  email: string
): Promise<UserDirectoryEntry | null> {
  const { data, error } = await supabaseAdmin.rpc('get_user_by_email', {
    p_email: email.toLowerCase(),
  });

  if (error) {
    console.error('[UserDirectory/getUserDirectoryEntryByEmail]: ', error);
    throw error;
  }

  const foundUser = Array.isArray(data) && data.length > 0 ? data[0] : null;

  return foundUser
    ? {
        id: foundUser.id,
        email: foundUser.email,
      }
    : null;
}
