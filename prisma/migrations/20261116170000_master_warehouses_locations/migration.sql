-- CreateTable
CREATE TABLE "warehouses" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "warehouses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "locations" (
    "id" TEXT NOT NULL,
    "warehouse_id" TEXT NOT NULL,
    "parent_location_id" TEXT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "warehouses_code_key" ON "warehouses"("code");

-- CreateIndex
CREATE INDEX "locations_warehouse_id_idx" ON "locations"("warehouse_id");

-- CreateIndex
CREATE INDEX "locations_parent_location_id_idx" ON "locations"("parent_location_id");

-- CreateIndex
CREATE UNIQUE INDEX "locations_warehouse_id_code_key" ON "locations"("warehouse_id", "code");

-- AddForeignKey
ALTER TABLE "locations" ADD CONSTRAINT "locations_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "locations" ADD CONSTRAINT "locations_parent_location_id_fkey" FOREIGN KEY ("parent_location_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
