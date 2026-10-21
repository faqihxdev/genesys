import 'server-only';

import { getCloudflareContext } from '@opennextjs/cloudflare';
import { createDatabase } from './client';

function getDatabase() {
  return createDatabase(getCloudflareContext().env.DB);
}

export type DbClient = ReturnType<typeof getDatabase>;

// Bind each query to its request rather than retaining another request's handle.
export const db = new Proxy({} as DbClient, {
  get(_target, property) {
    const database = getDatabase();
    const value = Reflect.get(database, property);
    return typeof value === 'function' ? value.bind(database) : value;
  },
});
