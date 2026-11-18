import type { AdjustmentReasonCode } from './adjustment-reason';

export type StockMovementType = 'ADJUSTMENT';

export type StockMovement = {
  id: string;
  productId: string;
  locationId: string;
  type: StockMovementType;
  /** Signed exact decimal as string. */
  quantityDelta: string;
  reasonCode: AdjustmentReasonCode;
  note: string | null;
  createdByUserId: string;
  idempotencyKey: string;
  createdAt: Date;
};
