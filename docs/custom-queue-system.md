# Simulation queue

Updated 2026-10-21.

Genesys uses Cloudflare Queues and D1. The web Worker produces messages; the private
`genesys-simulations` Worker consumes them. The consumer has no public HTTP endpoint.

## Processing

1. The creation action checks access to the funnel and persona configuration. Both must belong to
   the same project.
2. It creates simulation and progress records, then sends one message per persona to the starting
   stage.
3. The consumer reads the persona, stage, content, and allowed outgoing links from D1.
4. GPT-5 nano returns structured reactions, sentiment, a proceed decision, and an allowed next stage.
5. A D1 batch saves the decision, item responses, and progress together.
6. The consumer queues the next stage or completes that persona. When every persona finishes, it
   completes the simulation and marks unvisited stages skipped.

Messages contain `simulationId`, `personaId`, `stageId`, and visited stage IDs. Saved decisions
have a unique simulation/persona/stage key. Redelivery reuses a decision and avoids repeating its
AI call. Queue delivery can produce repeated child messages, so completion counts come from
persisted persona progress rather than increments.

The consumer processes one message at a time. Transient failures receive up to two retries with a
30-second delay. OpenAI client errors stop the simulation immediately. Cancelled, completed, and
failed simulations ignore subsequent messages. A visited-stage check rejects cycles.

## Configuration and operations

- Web Worker: `wrangler.jsonc`, producer binding `SIMULATION_QUEUE`
- Consumer: `wrangler.simulations.jsonc`, queue `genesys-simulations`
- Shared D1 binding: `DB`, database `genesys`
- Consumer secret: `OPENAI_API_KEY`
- Implementation: `workers/simulations.ts`

```bash
pnpm exec wrangler deploy --config wrangler.simulations.jsonc
pnpm exec wrangler tail --config wrangler.simulations.jsonc
pnpm exec wrangler queues list
```

Inspect `simulations`, `simulation_personas`, `simulation_stages`, `response_stages`, and `responses`
in D1 to investigate progress. Errors live on simulation and persona-progress records. Cloudflare's
dashboard shows queue backlog, retries, and Worker errors.
