import 'server-only';

import env from '@/env';
import { createClient } from '@supabase/supabase-js';

/**
 * @description Supabase Admin client with service role permissions
 *
 * Using custom fetch implementation to ensure compatibility in both server
 * and edge runtime environments (local development and production).
 */
const supabaseAdmin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  global: {
    fetch: (url, init) => {
      return fetch(url, {
        ...init,
        cache: 'no-store',
      });
    },
  },
});

export default supabaseAdmin;
