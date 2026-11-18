import { StockBalanceNotFoundError } from '../../domain/stock/stock.errors';
import { availableQuantity } from '../../domain/stock/stock-balance';
import type { StockLedgerRepositoryPort } from './ports/stock-ledger.repository.port';
import { GetStockBalanceUseCase } from './get-stock-balance.use-case';

describe('GetStockBalanceUseCase', () => {
  const ledger: jest.Mocked<StockLedgerRepositoryPort> = {
    findMovementByIdempotency: jest.fn(),
    persistAdjustment: jest.fn(),
    findBalance: jest.fn(),
    listBalances: jest.fn(),
    listMovements: jest.fn(),
  };
  const useCase = new GetStockBalanceUseCase(ledger);

  beforeEach(() => jest.clearAllMocks());

  it('returns balance with available when row exists', async () => {
    const updatedAt = new Date('2026-11-18T00:00:00.000Z');
    ledger.findBalance.mockResolvedValue({
      productId: 'p1',
      locationId: 'l1',
      onHand: '3.5000',
      reserved: '0.0000',
      updatedAt,
    });

    const actual = await useCase.execute('p1', 'l1');

    expect(actual).toEqual({
      productId: 'p1',
      locationId: 'l1',
      onHand: '3.5000',
      reserved: '0.0000',
      available: availableQuantity('3.5000', '0.0000'),
      updatedAt,
    });
  });

  it('throws STOCK_BALANCE_NOT_FOUND when missing', async () => {
    ledger.findBalance.mockResolvedValue(null);

    await expect(useCase.execute('p1', 'l1')).rejects.toBeInstanceOf(
      StockBalanceNotFoundError,
    );
  });
});
