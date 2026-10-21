import 'server-only';

import { db } from '@/db';
import {
  authAccounts,
  authRateLimits,
  authSessions,
  authUsers,
  authVerifications,
} from '@/db/schema/auth';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { nextCookies } from 'better-auth/next-js';
import { hashPassword, verifyPassword } from './auth-password';
import { getRuntimeConfig } from './runtime';

export function getAuth(options: { allowSignUp?: boolean } = {}) {
  const config = getRuntimeConfig();
  if (!config.authSecret) throw new Error('Authentication secret is not configured');
  return betterAuth({
    appName: 'Genesys',
    baseURL: config.origin,
    secret: config.authSecret,
    database: drizzleAdapter(db, {
      provider: 'sqlite',
      schema: {
        user: authUsers,
        session: authSessions,
        account: authAccounts,
        verification: authVerifications,
        rateLimit: authRateLimits,
      },
      transaction: false,
    }),
    emailAndPassword: {
      enabled: true,
      // Only the invite-code-validated server action can enable registration.
      disableSignUp: !options.allowSignUp,
      minPasswordLength: 10,
      password: { hash: hashPassword, verify: verifyPassword },
    },
    rateLimit: { enabled: true, storage: 'database', window: 60, max: 30 },
    session: { expiresIn: 60 * 60 * 24 * 7, updateAge: 60 * 60 * 24 },
    plugins: [nextCookies()],
  });
}
