import env from '@/env';
import { createBrowserClient } from '@supabase/ssr';

/**
 * @description Create a browser client for interacting with the database
 * @returns Browser client
 */
export function createClient() {
  return createBrowserClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
