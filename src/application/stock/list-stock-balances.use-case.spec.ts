import { availableQuantity } from '../../domain/stock/stock-balance';
import type { StockLedgerRepositoryPort } from './ports/stock-ledger.repository.port';
import { ListStockBalancesUseCase } from './list-stock-balances.use-case';

describe('ListStockBalancesUseCase', () => {
  const ledger: jest.Mocked<StockLedgerRepositoryPort> = {
    findMovementByIdempotency: jest.fn(),
    persistAdjustment: jest.fn(),
    findBalance: jest.fn(),
    listBalances: jest.fn(),
    listMovements: jest.fn(),
  };
  const useCase = new ListStockBalancesUseCase(ledger);

  beforeEach(() => jest.clearAllMocks());

  it('returns paged balances with available derived', async () => {
    const updatedAt = new Date('2026-11-18T00:00:00.000Z');
    ledger.listBalances.mockResolvedValue({
      items: [
        {
          productId: 'p1',
          locationId: 'l1',
          onHand: '10.0000',
          reserved: '0.0000',
          updatedAt,
        },
      ],
      total: 1,
    });

    const actual = await useCase.execute({
      page: 1,
      pageSize: 20,
      productId: 'p1',
    });

    expect(ledger.listBalances).toHaveBeenCalledWith({
      page: 1,
      pageSize: 20,
      productId: 'p1',
      locationId: undefined,
      warehouseId: undefined,
      lowStock: undefined,
      sort: undefined,
    });
    expect(actual).toEqual({
      data: [
        {
          productId: 'p1',
          locationId: 'l1',
          onHand: '10.0000',
          reserved: '0.0000',
          available: availableQuantity('10.0000', '0.0000'),
          updatedAt,
        },
      ],
      meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    });
  });

  it('returns empty data when no balances match', async () => {
    ledger.listBalances.mockResolvedValue({ items: [], total: 0 });

    const actual = await useCase.execute({ lowStock: true });

    expect(actual.data).toEqual([]);
    expect(actual.meta.total).toBe(0);
    expect(ledger.listBalances).toHaveBeenCalledWith(
      expect.objectContaining({ lowStock: true }),
    );
  });
});
