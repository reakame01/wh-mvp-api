import {
  formatScaledToDecimalString,
  parseDecimalStringToScaled,
} from './quantity';

export type StockBalance = {
  productId: string;
  locationId: string;
  /** Exact decimal as string (4dp in API responses). */
  onHand: string;
  reserved: string;
  updatedAt: Date;
};

/** available = onHand - reserved (never store as a mutable column). */
export function availableQuantity(onHand: string, reserved: string): string {
  const scaled =
    parseDecimalStringToScaled(onHand) - parseDecimalStringToScaled(reserved);
  return formatScaledToDecimalString(scaled);
}
