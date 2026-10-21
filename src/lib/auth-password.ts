import { timingSafeEqual } from 'node:crypto';

const iterations = 100_000;

async function derive(password: string, salt: Uint8Array<ArrayBuffer>) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password.normalize('NFKC')),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  return Buffer.from(
    await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', iterations, salt }, key, 256)
  );
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const derived = await derive(password, salt);
  return `pbkdf2-sha256$${iterations}$${Buffer.from(salt).toString('hex')}$${derived.toString('hex')}`;
}

export async function verifyPassword({ password, hash }: { password: string; hash: string }) {
  const parts = /^pbkdf2-sha256\$100000\$([a-f0-9]{32})\$([a-f0-9]{64})$/.exec(hash);
  if (!parts) return false;
  const salt = Uint8Array.from(Buffer.from(parts[1], 'hex'));
  const derived = await derive(password, salt);
  return timingSafeEqual(derived, Buffer.from(parts[2], 'hex'));
}
