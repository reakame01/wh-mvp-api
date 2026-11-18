import { parseBalanceSort, parseMovementSort } from './stock-sort';

describe('stock sort helpers', () => {
  it('defaults balance sort to updatedAt desc with composite tie-break', () => {
    expect(parseBalanceSort(undefined)).toEqual([
      { updatedAt: 'desc' },
      { productId: 'asc' },
      { locationId: 'asc' },
    ]);
  });

  it('falls back when balance sort field is unknown', () => {
    expect(parseBalanceSort('sku:asc')).toEqual([
      { updatedAt: 'desc' },
      { productId: 'asc' },
      { locationId: 'asc' },
    ]);
  });

  it('accepts onHand for balances', () => {
    expect(parseBalanceSort('onHand:asc')).toEqual([
      { onHand: 'asc' },
      { productId: 'asc' },
      { locationId: 'asc' },
    ]);
  });

  it('defaults movement sort to createdAt desc', () => {
    expect(parseMovementSort(undefined)).toEqual([
      { createdAt: 'desc' },
      { id: 'asc' },
    ]);
  });

  it('accepts quantityDelta for movements', () => {
    expect(parseMovementSort('quantityDelta:desc')).toEqual([
      { quantityDelta: 'desc' },
      { id: 'asc' },
    ]);
  });
});
