import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

const env = createEnv({
  emptyStringAsUndefined: true,
  server: { NODE_ENV: z.enum(['development', 'production', 'test']).default('development') },
  client: {
    NEXT_PUBLIC_UMAMI_WEBSITE_ID: z.string().uuid().optional(),
    NEXT_PUBLIC_UMAMI_DOMAINS: z.string().optional(),
  },
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_UMAMI_WEBSITE_ID: process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID,
    NEXT_PUBLIC_UMAMI_DOMAINS: process.env.NEXT_PUBLIC_UMAMI_DOMAINS,
  },
});
export default env;
