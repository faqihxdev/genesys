import { describe, expect, it } from 'vitest';
import { generateId } from './_utils';

describe('generateId', () => {
  it('generates the requested prefixed format and length', () => {
    const id = generateId({ length: 13, prefix: 'prj-' });

    expect(id).toHaveLength(13);
    expect(id).toMatch(/^prj-[a-km-z2-9]{4}-[a-km-z2-9]{4}$/);
  });

  it('rejects invalid lengths and prefixes', () => {
    expect(() => generateId({ length: 4, prefix: 'prj-' })).toThrow(
      'ID length or prefix is invalid'
    );
    expect(() => generateId({ length: 12, prefix: 'PRJ-' })).toThrow(
      'ID length or prefix is invalid'
    );
  });
});
