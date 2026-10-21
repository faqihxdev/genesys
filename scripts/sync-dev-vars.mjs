import { readFileSync, writeFileSync } from 'node:fs';

const names = new Set(['OPENAI_API_KEY', 'INVITE_CODE', 'BETTER_AUTH_SECRET']);
const lines = readFileSync('.env', 'utf8')
  .split(/\r?\n/)
  .filter((line) => names.has(line.split('=')[0].trim()));
writeFileSync('.dev.vars', [...lines, 'APP_ORIGIN=http://localhost:3000', ''].join('\n'), {
  mode: 0o600,
});
