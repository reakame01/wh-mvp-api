import { normalizeAdjustmentReason } from './adjustment-reason';
import { InvalidStockInputError } from './stock.errors';

describe('normalizeAdjustmentReason', () => {
  it('accepts known codes and trims note', () => {
    expect(normalizeAdjustmentReason('miscount', '  aisle B  ')).toEqual({
      reasonCode: 'MISCOUNT',
      note: 'aisle B',
    });
  });

  it('allows null note for non-OTHER codes', () => {
    expect(normalizeAdjustmentReason('DAMAGED', '  ')).toEqual({
      reasonCode: 'DAMAGED',
      note: null,
    });
  });

  it('requires note when reasonCode is OTHER', () => {
    expect(() => normalizeAdjustmentReason('OTHER', null)).toThrow(
      InvalidStockInputError,
    );
    expect(() => normalizeAdjustmentReason('OTHER', '  ')).toThrow(
      InvalidStockInputError,
    );
    expect(normalizeAdjustmentReason('OTHER', 'manual fix')).toEqual({
      reasonCode: 'OTHER',
      note: 'manual fix',
    });
  });

  it('rejects unknown reasonCode', () => {
    expect(() => normalizeAdjustmentReason('BROKEN')).toThrow(
      InvalidStockInputError,
    );
  });
});
