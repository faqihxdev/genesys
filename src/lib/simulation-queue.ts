import type { SimulationJob } from '@/types/simulation-job';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import 'server-only';

export async function enqueueSimulationJobs(jobs: SimulationJob[]) {
  await getCloudflareContext().env.SIMULATION_QUEUE.sendBatch(
    jobs.map((body) => ({ body, contentType: 'json' as const }))
  );
}
