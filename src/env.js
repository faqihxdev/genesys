import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

/**
 * @description Environment variables
 * @returns {Object} Environment variables
 */
const env = createEnv({
  emptyStringAsUndefined: true,
  server: {
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    SUPABASE_DATABASE_URL: z.string(),
    SUPABASE_SERVICE_ROLE_KEY: z.string(),
    INVITE_CODE: z.string(),
    OPENAI_API_KEY: z.string(),
  },
  client: {
    NEXT_PUBLIC_UMAMI_WEBSITE_ID: z.string().uuid().optional(),
    NEXT_PUBLIC_UMAMI_DOMAINS: z.string().optional(),
  },
  shared: {
    NEXT_PUBLIC_SUPABASE_URL: z.string(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string(),
  },
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_UMAMI_WEBSITE_ID: process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID,
    NEXT_PUBLIC_UMAMI_DOMAINS: process.env.NEXT_PUBLIC_UMAMI_DOMAINS,
    SUPABASE_DATABASE_URL: process.env.SUPABASE_DATABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    INVITE_CODE: process.env.INVITE_CODE,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  },
});

export default env;
