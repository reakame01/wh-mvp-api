import {
  LocationNotFoundError,
  ProductNotFoundError,
} from '../../domain/master-data/master-data.errors';
import {
  InvalidStockInputError,
  LocationInactiveForStockError,
  ProductInactiveForStockError,
  StockInsufficientError,
} from '../../domain/stock/stock.errors';
import { StockLedgerRepositoryPort } from './ports/stock-ledger.repository.port';
import { RecordAdjustmentUseCase } from './record-adjustment.use-case';

const movement = {
  id: 'm1',
  productId: 'p1',
  locationId: 'l1',
  type: 'ADJUSTMENT' as const,
  quantityDelta: '5.0000',
  reasonCode: 'MISCOUNT' as const,
  note: 'aisle',
  createdByUserId: 'u1',
  idempotencyKey: 'key-1',
  createdAt: new Date(),
};

describe('RecordAdjustmentUseCase', () => {
  const ledger: jest.Mocked<StockLedgerRepositoryPort> = {
    findMovementByIdempotency: jest.fn(),
    persistAdjustment: jest.fn(),
  };
  const useCase = new RecordAdjustmentUseCase(ledger);

  beforeEach(() => jest.clearAllMocks());

  it('replays existing idempotency key without persisting', async () => {
    ledger.findMovementByIdempotency.mockResolvedValue(movement);

    const actual = await useCase.execute({
      productId: 'p1',
      locationId: 'l1',
      quantityDelta: '5',
      reasonCode: 'MISCOUNT',
      createdByUserId: 'u1',
      idempotencyKey: ' key-1 ',
    });

    expect(actual).toEqual({ replayed: true, movement });
    expect(ledger.persistAdjustment).not.toHaveBeenCalled();
  });

  it('persists a new adjustment', async () => {
    ledger.findMovementByIdempotency.mockResolvedValue(null);
    ledger.persistAdjustment.mockResolvedValue({
      ok: true,
      replayed: false,
      movement,
    });

    const actual = await useCase.execute({
      productId: ' p1 ',
      locationId: 'l1',
      quantityDelta: '5.5',
      reasonCode: 'found',
      note: '  ',
      createdByUserId: 'u1',
      idempotencyKey: 'key-2',
    });

    expect(ledger.persistAdjustment).toHaveBeenCalledWith({
      productId: 'p1',
      locationId: 'l1',
      quantityDelta: '5.5000',
      reasonCode: 'FOUND',
      note: null,
      createdByUserId: 'u1',
      idempotencyKey: 'key-2',
    });
    expect(actual.replayed).toBe(false);
  });

  it('rejects blank idempotency key and zero delta', async () => {
    await expect(
      useCase.execute({
        productId: 'p1',
        locationId: 'l1',
        quantityDelta: '1',
        reasonCode: 'LOST',
        createdByUserId: 'u1',
        idempotencyKey: '  ',
      }),
    ).rejects.toBeInstanceOf(InvalidStockInputError);

    await expect(
      useCase.execute({
        productId: 'p1',
        locationId: 'l1',
        quantityDelta: '0',
        reasonCode: 'LOST',
        createdByUserId: 'u1',
        idempotencyKey: 'k',
      }),
    ).rejects.toBeInstanceOf(InvalidStockInputError);
  });

  it('maps persist failure reasons to domain errors', async () => {
    ledger.findMovementByIdempotency.mockResolvedValue(null);

    ledger.persistAdjustment.mockResolvedValue({
      ok: false,
      reason: 'product_not_found',
    });
    await expect(useCase.execute(baseInput())).rejects.toBeInstanceOf(
      ProductNotFoundError,
    );

    ledger.persistAdjustment.mockResolvedValue({
      ok: false,
      reason: 'location_not_found',
    });
    await expect(useCase.execute(baseInput())).rejects.toBeInstanceOf(
      LocationNotFoundError,
    );

    ledger.persistAdjustment.mockResolvedValue({
      ok: false,
      reason: 'product_inactive',
    });
    await expect(useCase.execute(baseInput())).rejects.toBeInstanceOf(
      ProductInactiveForStockError,
    );

    ledger.persistAdjustment.mockResolvedValue({
      ok: false,
      reason: 'location_inactive',
    });
    await expect(useCase.execute(baseInput())).rejects.toBeInstanceOf(
      LocationInactiveForStockError,
    );

    ledger.persistAdjustment.mockResolvedValue({
      ok: false,
      reason: 'insufficient',
    });
    await expect(useCase.execute(baseInput())).rejects.toBeInstanceOf(
      StockInsufficientError,
    );
  });
});

function baseInput() {
  return {
    productId: 'p1',
    locationId: 'l1',
    quantityDelta: '1',
    reasonCode: 'DAMAGED',
    createdByUserId: 'u1',
    idempotencyKey: 'k',
  };
}
