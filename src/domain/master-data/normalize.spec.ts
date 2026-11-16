import { InvalidMasterDataInputError } from './master-data.errors';
import {
  normalizeOptionalParentId,
  requireNonNegativeDecimal,
  requireTrimmedNonEmpty,
} from './normalize';

describe('normalize helpers', () => {
  it('rejects whitespace-only code', () => {
    expect(() => requireTrimmedNonEmpty('   ', 'code')).toThrow(
      InvalidMasterDataInputError,
    );
  });

  it('maps empty parent id to null', () => {
    expect(normalizeOptionalParentId('')).toBeNull();
    expect(normalizeOptionalParentId('  ')).toBeNull();
    expect(normalizeOptionalParentId(undefined)).toBeUndefined();
    expect(normalizeOptionalParentId('abc')).toBe('abc');
  });

  it('accepts non-negative decimals as string', () => {
    expect(requireNonNegativeDecimal('0')).toBe('0');
    expect(requireNonNegativeDecimal('10.5')).toBe('10.5');
    expect(requireNonNegativeDecimal(3)).toBe('3');
  });

  it('rejects negative or non-decimal reorderPoint', () => {
    expect(() => requireNonNegativeDecimal('-1')).toThrow(
      InvalidMasterDataInputError,
    );
    expect(() => requireNonNegativeDecimal('1e3')).toThrow(
      InvalidMasterDataInputError,
    );
  });
});
