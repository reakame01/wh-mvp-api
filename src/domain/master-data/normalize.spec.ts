import { InvalidMasterDataInputError } from './master-data.errors';
import { normalizeOptionalParentId, requireTrimmedNonEmpty } from './normalize';

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
});
