import { getCloudflareContext } from '@opennextjs/cloudflare';
import 'server-only';

export function getRuntimeConfig() {
  const { env } = getCloudflareContext();
  return {
    origin: process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : env.APP_ORIGIN,
    authSecret: env.BETTER_AUTH_SECRET || process.env.BETTER_AUTH_SECRET,
    inviteCode: env.INVITE_CODE || process.env.INVITE_CODE,
    openaiKey: env.OPENAI_API_KEY || process.env.OPENAI_API_KEY,
  };
}
