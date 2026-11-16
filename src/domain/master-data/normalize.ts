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
