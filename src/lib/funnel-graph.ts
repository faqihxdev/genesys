export function getStartingStage(
  stageIds: readonly string[],
  links: ReadonlyArray<{ from: string; to: string }>
): string {
  const incoming = new Map(stageIds.map((id) => [id, 0]));
  const outgoing = new Map(stageIds.map((id) => [id, [] as string[]]));
  for (const link of links) {
    if (!incoming.has(link.from) || !incoming.has(link.to))
      throw new Error('A funnel connection references a missing stage.');
    incoming.set(link.to, incoming.get(link.to)! + 1);
    outgoing.get(link.from)!.push(link.to);
  }
  const roots = stageIds.filter((id) => incoming.get(id) === 0);
  if (roots.length !== 1) throw new Error('Connect the funnel into a single starting stage.');
  const queue = [...roots];
  let visited = 0;
  for (let index = 0; index < queue.length; index++) {
    const id = queue[index];
    visited++;
    for (const next of outgoing.get(id)!) {
      incoming.set(next, incoming.get(next)! - 1);
      if (incoming.get(next) === 0) queue.push(next);
    }
  }
  if (visited !== stageIds.length) throw new Error('Funnel connections must not contain a cycle.');
  return roots[0];
}
