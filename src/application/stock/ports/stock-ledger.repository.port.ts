import type { AdjustmentReasonCode } from '../../../domain/stock/adjustment-reason';
import type { StockBalance } from '../../../domain/stock/stock-balance';
import type {
  StockMovement,
  StockMovementType,
} from '../../../domain/stock/stock-movement';

export const STOCK_LEDGER_REPOSITORY = Symbol('STOCK_LEDGER_REPOSITORY');

export type RecordAdjustmentPersistInput = {
  productId: string;
  locationId: string;
  quantityDelta: string;
  reasonCode: AdjustmentReasonCode;
  note: string | null;
  createdByUserId: string;
  idempotencyKey: string;
};

export type RecordAdjustmentPersistResult =
  | { ok: true; replayed: boolean; movement: StockMovement }
  | {
      ok: false;
      reason:
        | 'product_not_found'
        | 'location_not_found'
        | 'product_inactive'
        | 'location_inactive'
        | 'insufficient';
    };

export type StockBalanceListQuery = {
  page: number;
  pageSize: number;
  productId?: string;
  locationId?: string;
  warehouseId?: string;
  lowStock?: boolean;
  sort?: string;
};

export type StockMovementListQuery = {
  page: number;
  pageSize: number;
  productId?: string;
  locationId?: string;
  warehouseId?: string;
  type?: StockMovementType;
  createdFrom?: Date;
  createdTo?: Date;
  sort?: string;
};

export interface StockLedgerRepositoryPort {
  findMovementByIdempotency(
    createdByUserId: string,
    idempotencyKey: string,
  ): Promise<StockMovement | null>;

  /**
   * Lock balance, append movement, update on_hand in one transaction.
   * On unique idempotency race, re-fetch and return replayed=true.
   */
  persistAdjustment(
    input: RecordAdjustmentPersistInput,
  ): Promise<RecordAdjustmentPersistResult>;

  findBalance(
    productId: string,
    locationId: string,
  ): Promise<StockBalance | null>;

  listBalances(
    query: StockBalanceListQuery,
  ): Promise<{ items: StockBalance[]; total: number }>;

  listMovements(
    query: StockMovementListQuery,
  ): Promise<{ items: StockMovement[]; total: number }>;
}
