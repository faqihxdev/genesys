import OpenAI from 'openai';
import 'server-only';
import { getRuntimeConfig } from './runtime';

export const AI_MODEL = 'gpt-5-nano';

export function getAI() {
  const apiKey = getRuntimeConfig().openaiKey;
  if (!apiKey) throw new Error('AI generation is not configured');
  return new OpenAI({ apiKey, maxRetries: 0, timeout: 60_000 });
}
