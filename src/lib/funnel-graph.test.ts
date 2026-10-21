import { describe, expect, it } from 'vitest';
import { getStartingStage } from './funnel-graph';

describe('simulation entry and traversal', () => {
  it('accepts branching funnels with a shared entry', () => {
    expect(
      getStartingStage(
        ['a', 'b', 'c', 'd'],
        [
          { from: 'a', to: 'b' },
          { from: 'a', to: 'c' },
          { from: 'b', to: 'd' },
          { from: 'c', to: 'd' },
        ]
      )
    ).toBe('a');
  });
  it('rejects a disconnected entry', () => {
    expect(() => getStartingStage(['a', 'b'], [])).toThrow('single starting stage');
  });
  it('rejects cycles beyond an otherwise valid entry', () => {
    expect(() =>
      getStartingStage(
        ['a', 'b', 'c'],
        [
          { from: 'a', to: 'b' },
          { from: 'b', to: 'c' },
          { from: 'c', to: 'b' },
        ]
      )
    ).toThrow('cycle');
  });
});
