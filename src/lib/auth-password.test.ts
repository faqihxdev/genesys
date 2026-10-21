import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from './auth-password';

describe('password credentials', () => {
  it('accepts the correct password and rejects a wrong password', async () => {
    const hash = await hashPassword('a long test password');
    expect(await verifyPassword({ hash, password: 'a long test password' })).toBe(true);
    expect(await verifyPassword({ hash, password: 'another test password' })).toBe(false);
  });
  it('uses a separate random salt for each credential', async () => {
    expect(await hashPassword('same password')).not.toBe(await hashPassword('same password'));
  });
  it('rejects malformed stored credentials', async () => {
    expect(await verifyPassword({ password: 'password', hash: 'not-a-password-hash' })).toBe(false);
  });
});
