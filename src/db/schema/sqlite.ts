import { integer, numeric, text } from 'drizzle-orm/sqlite-core';

export { index, integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const timestamp = (name: string, _options?: { mode: 'date' }) =>
  integer(name, { mode: 'timestamp_ms' });
export const boolean = (name: string) => integer(name, { mode: 'boolean' });
export const jsonColumn = (name: string) => text(name, { mode: 'json' });
export const decimal = (name: string, _options: { precision: number; scale: number }) =>
  numeric(name);

export function enumColumn<const T extends readonly [string, ...string[]]>(
  name: string,
  values: T
) {
  const column = (columnName = name) => text(columnName, { enum: values });
  return Object.assign(column, { enumValues: values });
}
