import type { StockLedgerRepositoryPort } from './ports/stock-ledger.repository.port';
import { ListStockMovementsUseCase } from './list-stock-movements.use-case';

describe('ListStockMovementsUseCase', () => {
  const ledger: jest.Mocked<StockLedgerRepositoryPort> = {
    findMovementByIdempotency: jest.fn(),
    persistAdjustment: jest.fn(),
    findBalance: jest.fn(),
    listBalances: jest.fn(),
    listMovements: jest.fn(),
  };
  const useCase = new ListStockMovementsUseCase(ledger);

  beforeEach(() => jest.clearAllMocks());

  it('returns paged movement history', async () => {
    const createdAt = new Date('2026-11-18T12:00:00.000Z');
    const movement = {
      id: 'm1',
      productId: 'p1',
      locationId: 'l1',
      type: 'ADJUSTMENT' as const,
      quantityDelta: '-2.0000',
      reasonCode: 'DAMAGED' as const,
      note: null,
      createdByUserId: 'u1',
      idempotencyKey: 'k1',
      createdAt,
    };
    ledger.listMovements.mockResolvedValue({ items: [movement], total: 1 });

    const actual = await useCase.execute({
      page: 1,
      pageSize: 20,
      productId: 'p1',
      type: 'ADJUSTMENT',
    });

    expect(ledger.listMovements).toHaveBeenCalledWith({
      page: 1,
      pageSize: 20,
      productId: 'p1',
      locationId: undefined,
      warehouseId: undefined,
      type: 'ADJUSTMENT',
      createdFrom: undefined,
      createdTo: undefined,
      sort: undefined,
    });
    expect(actual).toEqual({
      data: [movement],
      meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    });
  });

  it('returns empty data for empty history', async () => {
    ledger.listMovements.mockResolvedValue({ items: [], total: 0 });

    const actual = await useCase.execute({});

    expect(actual.data).toEqual([]);
    expect(actual.meta.total).toBe(0);
  });
});
