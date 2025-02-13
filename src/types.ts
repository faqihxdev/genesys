// Used for easy type imports
// Most types are imported from the db schema

import { User as SupabaseUser } from '@supabase/supabase-js';

export * from '@/server/db/schema';

/**
 * @description Extended user type from Supabase with additional custom fields
 */
export type User = SupabaseUser;
