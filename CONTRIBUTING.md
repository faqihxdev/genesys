# Contributing

Genesys originated as an NUS Guru Network AI Innovation Project. Focused bug fixes and documentation
improvements are welcome.

## Development

1. Create a branch from `main`.
2. Install dependencies with `pnpm install`.
3. Keep credentials in `.env`; never commit them.
4. Add or update tests for behavior changes.
5. Run `pnpm check`, `pnpm audit --prod --audit-level high`, and `pnpm build`.
6. Open a pull request that explains the change and how it was verified.

Follow the existing TypeScript, Next.js, accessibility, validation, and server-authorization patterns.
Keep pull requests small enough to review safely.
