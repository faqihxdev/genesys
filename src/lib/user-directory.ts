import 'server-only';

import { db } from '@/db';
import { authUsers } from '@/db/schema/auth';
import { eq, inArray } from 'drizzle-orm';

export interface UserDirectoryEntry {
  id: string;
  email: string;
}

export async function getUserDirectoryEntries(
  userIds: readonly string[]
): Promise<UserDirectoryEntry[]> {
  if (!userIds.length) return [];
  return db
    .select({ id: authUsers.id, email: authUsers.email })
    .from(authUsers)
    .where(inArray(authUsers.id, [...new Set(userIds)]));
}

export async function getUserDirectoryEntryByEmail(
  email: string
): Promise<UserDirectoryEntry | null> {
  const [user] = await db
    .select({ id: authUsers.id, email: authUsers.email })
    .from(authUsers)
    .where(eq(authUsers.email, email.trim().toLowerCase()))
    .limit(1);
  return user ?? null;
}
