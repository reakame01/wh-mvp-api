import { wouldCreateLocationCycle } from './location-tree';

describe('wouldCreateLocationCycle', () => {
  it('allows null parent', () => {
    expect(wouldCreateLocationCycle('a', null, new Map())).toBe(false);
  });

  it('detects direct self-parent', () => {
    expect(wouldCreateLocationCycle('a', 'a', new Map([['a', null]]))).toBe(
      true,
    );
  });

  it('detects cycle via ancestor', () => {
    const parents = new Map<string, string | null>([
      ['root', null],
      ['mid', 'root'],
      ['leaf', 'mid'],
    ]);
    // Move root under leaf → cycle
    expect(wouldCreateLocationCycle('root', 'leaf', parents)).toBe(true);
  });

  it('allows valid reparent within tree', () => {
    const parents = new Map<string, string | null>([
      ['root', null],
      ['a', 'root'],
      ['b', 'root'],
    ]);
    expect(wouldCreateLocationCycle('a', 'b', parents)).toBe(false);
  });
});
