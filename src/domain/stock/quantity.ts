import { InvalidStockInputError } from './stock.errors';

const FIXED_SCALE = 4;
const SCALE_FACTOR = 10n ** BigInt(FIXED_SCALE);
/** Matches PostgreSQL `DECIMAL(18,4)`: 18 digits total, 4 after the decimal. */
const MAX_ABS_SCALED = 10n ** 18n;

/** Parse a non-negative or signed decimal string into a fixed-4 scaled bigint. */
export function parseDecimalStringToScaled(raw: string): bigint {
  const value = raw.trim();
  if (!/^-?\d+(\.\d+)?$/.test(value)) {
    throw new InvalidStockInputError('quantity must be a decimal string');
  }
  const negative = value.startsWith('-');
  const unsigned = negative ? value.slice(1) : value;
  const [wholePart, fracPart = ''] = unsigned.split('.');
  if (fracPart.length > FIXED_SCALE) {
    throw new InvalidStockInputError(
      `quantity supports at most ${FIXED_SCALE} decimal places`,
    );
  }
  const fracPadded = fracPart.padEnd(FIXED_SCALE, '0');
  const scaled = BigInt(wholePart) * SCALE_FACTOR + BigInt(fracPadded || '0');
  if (scaled >= MAX_ABS_SCALED) {
    throw new InvalidStockInputError(
      'quantity exceeds Decimal(18,4) precision',
    );
  }
  return negative ? -scaled : scaled;
}

export function formatScaledToDecimalString(scaled: bigint): string {
  const negative = scaled < 0n;
  const abs = negative ? -scaled : scaled;
  const whole = abs / SCALE_FACTOR;
  const frac = (abs % SCALE_FACTOR).toString().padStart(FIXED_SCALE, '0');
  const body = `${whole.toString()}.${frac}`;
  return negative ? `-${body}` : body;
}

export function requireNonZeroDecimalString(raw: string): string {
  const scaled = parseDecimalStringToScaled(raw);
  if (scaled === 0n) {
    throw new InvalidStockInputError('quantityDelta must not be zero');
  }
  return formatScaledToDecimalString(scaled);
}
