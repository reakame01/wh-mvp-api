-- CreateEnum
CREATE TYPE "StockMovementType" AS ENUM ('ADJUSTMENT');

-- CreateEnum
CREATE TYPE "AdjustmentReasonCode" AS ENUM ('DAMAGED', 'LOST', 'MISCOUNT', 'FOUND', 'OTHER');

-- CreateTable
CREATE TABLE "stock_balances" (
    "product_id" TEXT NOT NULL,
    "location_id" TEXT NOT NULL,
    "on_hand" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "reserved" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "stock_balances_pkey" PRIMARY KEY ("product_id","location_id")
);

-- CreateTable
CREATE TABLE "stock_movements" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "location_id" TEXT NOT NULL,
    "type" "StockMovementType" NOT NULL,
    "quantity_delta" DECIMAL(18,4) NOT NULL,
    "reason_code" "AdjustmentReasonCode" NOT NULL,
    "note" TEXT,
    "created_by_user_id" TEXT NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "stock_balances_location_id_idx" ON "stock_balances"("location_id");

-- CreateIndex
CREATE INDEX "stock_movements_product_id_idx" ON "stock_movements"("product_id");

-- CreateIndex
CREATE INDEX "stock_movements_location_id_idx" ON "stock_movements"("location_id");

-- CreateIndex
CREATE INDEX "stock_movements_created_at_idx" ON "stock_movements"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "stock_movements_created_by_user_id_idempotency_key_key" ON "stock_movements"("created_by_user_id", "idempotency_key");

-- AddForeignKey
ALTER TABLE "stock_balances" ADD CONSTRAINT "stock_balances_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_balances" ADD CONSTRAINT "stock_balances_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Never-negative / available invariant on balances
ALTER TABLE "stock_balances" ADD CONSTRAINT "stock_balances_qty_check" CHECK (
  "on_hand" >= 0
  AND "reserved" >= 0
  AND "reserved" <= "on_hand"
);

-- Movement delta must change quantity
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_delta_nonzero_check" CHECK (
  "quantity_delta" <> 0
);

-- Append-only ledger: reject UPDATE and DELETE at the database
CREATE OR REPLACE FUNCTION prevent_stock_movement_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'STOCK_MOVEMENT_IMMUTABLE: stock_movements are append-only'
    USING ERRCODE = 'integrity_constraint_violation';
END;
$$;

CREATE TRIGGER stock_movements_append_only
BEFORE UPDATE OR DELETE ON "stock_movements"
FOR EACH ROW
EXECUTE FUNCTION prevent_stock_movement_mutation();

-- Production hardening (document): grant the app role SELECT, INSERT only on stock_movements.
-- Local Docker often uses a superuser; privileges are enforced via the trigger above.
