import { InvalidMasterDataInputError } from './master-data.errors';

/** Trim and reject blank codes/names after trim. */
export function requireTrimmedNonEmpty(value: string, field: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new InvalidMasterDataInputError(`${field} must not be blank`);
  }
  return trimmed;
}

/** Treat undefined as omitted; empty/whitespace string as null. */
export function normalizeOptionalParentId(
  value: string | null | undefined,
): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

/** Optional string field: undefined omitted, blank → null. */
export function normalizeOptionalString(
  value: string | null | undefined,
): string | null | undefined {
  return normalizeOptionalParentId(value);
}

/** Non-negative decimal as string (no float). */
export function requireNonNegativeDecimal(
  value: string | number,
  field = 'reorderPoint',
): string {
  const raw = String(value).trim();
  if (!/^\d+(\.\d+)?$/.test(raw)) {
    throw new InvalidMasterDataInputError(
      `${field} must be a non-negative decimal`,
    );
  }
  return raw;
}
