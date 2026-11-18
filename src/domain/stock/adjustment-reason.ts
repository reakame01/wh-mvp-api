import { InvalidStockInputError } from './stock.errors';

export const ADJUSTMENT_REASON_CODES = [
  'DAMAGED',
  'LOST',
  'MISCOUNT',
  'FOUND',
  'OTHER',
] as const;

export type AdjustmentReasonCode = (typeof ADJUSTMENT_REASON_CODES)[number];

export type NormalizedAdjustmentReason = {
  reasonCode: AdjustmentReasonCode;
  note: string | null;
};

function isReasonCode(value: string): value is AdjustmentReasonCode {
  return (ADJUSTMENT_REASON_CODES as readonly string[]).includes(value);
}

/**
 * Validate reasonCode (+ note required for OTHER).
 * Empty/whitespace note becomes null for non-OTHER codes.
 */
export function normalizeAdjustmentReason(
  reasonCode: string,
  note?: string | null,
): NormalizedAdjustmentReason {
  const code = reasonCode.trim().toUpperCase();
  if (!isReasonCode(code)) {
    throw new InvalidStockInputError(
      `reasonCode must be one of: ${ADJUSTMENT_REASON_CODES.join(', ')}`,
    );
  }

  const trimmedNote =
    note === undefined || note === null ? null : note.trim() || null;

  if (code === 'OTHER' && !trimmedNote) {
    throw new InvalidStockInputError(
      'note is required when reasonCode is OTHER',
    );
  }

  return { reasonCode: code, note: trimmedNote };
}
