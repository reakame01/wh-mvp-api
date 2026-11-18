import { Inject, Injectable } from '@nestjs/common';
import {
  LocationNotFoundError,
  ProductNotFoundError,
} from '../../domain/master-data/master-data.errors';
import { normalizeAdjustmentReason } from '../../domain/stock/adjustment-reason';
import { requireNonZeroDecimalString } from '../../domain/stock/quantity';
import type { StockMovement } from '../../domain/stock/stock-movement';
import {
  InvalidStockInputError,
  LocationInactiveForStockError,
  ProductInactiveForStockError,
  StockInsufficientError,
} from '../../domain/stock/stock.errors';
import {
  STOCK_LEDGER_REPOSITORY,
  type StockLedgerRepositoryPort,
} from './ports/stock-ledger.repository.port';

export type RecordAdjustmentInput = {
  productId: string;
  locationId: string;
  quantityDelta: string;
  reasonCode: string;
  note?: string | null;
  createdByUserId: string;
  idempotencyKey: string;
};

export type RecordAdjustmentOutput = {
  replayed: boolean;
  movement: StockMovement;
};

const IDEMPOTENCY_KEY_MAX = 128;

@Injectable()
export class RecordAdjustmentUseCase {
  constructor(
    @Inject(STOCK_LEDGER_REPOSITORY)
    private readonly ledger: StockLedgerRepositoryPort,
  ) {}

  async execute(input: RecordAdjustmentInput): Promise<RecordAdjustmentOutput> {
    const productId = requireId(input.productId, 'productId');
    const locationId = requireId(input.locationId, 'locationId');
    const idempotencyKey = requireIdempotencyKey(input.idempotencyKey);
    const quantityDelta = requireNonZeroDecimalString(input.quantityDelta);
    const { reasonCode, note } = normalizeAdjustmentReason(
      input.reasonCode,
      input.note,
    );

    const existing = await this.ledger.findMovementByIdempotency(
      input.createdByUserId,
      idempotencyKey,
    );
    if (existing) {
      return { replayed: true, movement: existing };
    }

    const result = await this.ledger.persistAdjustment({
      productId,
      locationId,
      quantityDelta,
      reasonCode,
      note,
      createdByUserId: input.createdByUserId,
      idempotencyKey,
    });

    if (!result.ok) {
      switch (result.reason) {
        case 'product_not_found':
          throw new ProductNotFoundError();
        case 'location_not_found':
          throw new LocationNotFoundError();
        case 'product_inactive':
          throw new ProductInactiveForStockError();
        case 'location_inactive':
          throw new LocationInactiveForStockError();
        case 'insufficient':
          throw new StockInsufficientError();
        default: {
          const _exhaustive: never = result.reason;
          void _exhaustive;
          throw new Error('Unhandled stock persist reason');
        }
      }
    }

    return { replayed: result.replayed, movement: result.movement };
  }
}

function requireId(value: string, field: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new InvalidStockInputError(`${field} must not be blank`);
  }
  return trimmed;
}

function requireIdempotencyKey(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new InvalidStockInputError('Idempotency-Key must not be blank');
  }
  if (trimmed.length > IDEMPOTENCY_KEY_MAX) {
    throw new InvalidStockInputError(
      `Idempotency-Key must be at most ${IDEMPOTENCY_KEY_MAX} characters`,
    );
  }
  return trimmed;
}
