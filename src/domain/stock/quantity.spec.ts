import {
  formatScaledToDecimalString,
  parseDecimalStringToScaled,
  requireNonZeroDecimalString,
} from './quantity';
import { availableQuantity } from './stock-balance';
import { InvalidStockInputError } from './stock.errors';

describe('quantity helpers', () => {
  it('parses and formats fixed 4dp without float drift', () => {
    expect(parseDecimalStringToScaled('10.5')).toBe(105000n);
    expect(formatScaledToDecimalString(105000n)).toBe('10.5000');
    expect(requireNonZeroDecimalString('-2')).toBe('-2.0000');
  });

  it('rejects zero delta', () => {
    expect(() => requireNonZeroDecimalString('0')).toThrow(
      InvalidStockInputError,
    );
    expect(() => requireNonZeroDecimalString('0.0000')).toThrow(
      InvalidStockInputError,
    );
  });

  it('computes available = onHand - reserved', () => {
    expect(availableQuantity('10.0000', '2.5000')).toBe('7.5000');
    expect(availableQuantity('1.0000', '0.0000')).toBe('1.0000');
  });
});
