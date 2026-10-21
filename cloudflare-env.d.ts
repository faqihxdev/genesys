interface CloudflareEnv {
  DB: import('@cloudflare/workers-types').D1Database;
  ASSETS: import('@cloudflare/workers-types').Fetcher;
  SIMULATION_QUEUE: import('@cloudflare/workers-types').Queue<
    import('./src/types/simulation-job').SimulationJob
  >;
  OPENAI_API_KEY?: string;
  INVITE_CODE: string;
  BETTER_AUTH_SECRET: string;
  APP_ORIGIN: string;
}
