import { Prisma } from '@prisma/client';
import { RecordAdjustmentUseCase } from '../src/application/stock/record-adjustment.use-case';
import { PrismaStockLedgerRepository } from '../src/infrastructure/stock/prisma-stock-ledger.repository';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';
import { StockInsufficientError } from '../src/domain/stock/stock.errors';

/**
 * Stage 3 adjustment invariants against real PostgreSQL:
 * - rejected negative delta on an empty slot must not leave a zero balance row
 * - stock_movements UPDATE/DELETE are blocked by STOCK_MOVEMENT_IMMUTABLE
 */
describe('stock adjustment invariants (integration)', () => {
  const prisma = new PrismaService();
  const ledger = new PrismaStockLedgerRepository(prisma);
  const useCase = new RecordAdjustmentUseCase(ledger);

  const runId = `adj-${Date.now()}`;
  let userId = '';
  let productId = '';
  let locationId = '';
  let seedMovementId = '';

  beforeAll(async () => {
    await prisma.$connect();

    const user = await prisma.user.create({
      data: {
        email: `${runId}@adjustment.test`,
        passwordHash: 'unused-for-adjustment-test',
        fullName: 'Adjustment Tester',
        role: 'Admin',
        isActive: true,
      },
    });
    userId = user.id;

    const category = await prisma.category.create({
      data: {
        code: `CAT-${runId}`.slice(0, 32),
        name: 'Adjustment Category',
      },
    });
    const product = await prisma.product.create({
      data: {
        sku: `SKU-${runId}`.slice(0, 32),
        name: 'Adjustment Widget',
        categoryId: category.id,
        unit: 'EA',
        reorderPoint: new Prisma.Decimal('1'),
      },
    });
    productId = product.id;

    const warehouse = await prisma.warehouse.create({
      data: {
        code: `WH-${runId}`.slice(0, 32),
        name: 'Adjustment WH',
      },
    });
    const location = await prisma.location.create({
      data: {
        warehouseId: warehouse.id,
        code: 'BIN-A1',
        name: 'Adjustment Bin',
      },
    });
    locationId = location.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('does not create a zero balance when negative delta is rejected on empty slot', async () => {
    await expect(
      useCase.execute({
        productId,
        locationId,
        quantityDelta: '-1',
        reasonCode: 'LOST',
        createdByUserId: userId,
        idempotencyKey: `${runId}-neg-empty`,
      }),
    ).rejects.toBeInstanceOf(StockInsufficientError);

    const balance = await prisma.stockBalance.findUnique({
      where: {
        productId_locationId: { productId, locationId },
      },
    });
    expect(balance).toBeNull();

    const movementCount = await prisma.stockMovement.count({
      where: { productId, locationId },
    });
    expect(movementCount).toBe(0);
  });

  it('rejects UPDATE and DELETE on stock_movements via immutability trigger', async () => {
    const seeded = await useCase.execute({
      productId,
      locationId,
      quantityDelta: '3',
      reasonCode: 'FOUND',
      note: 'seed for immutability',
      createdByUserId: userId,
      idempotencyKey: `${runId}-seed`,
    });
    seedMovementId = seeded.movement.id;

    await expect(
      prisma.stockMovement.update({
        where: { id: seedMovementId },
        data: { note: 'tampered' },
      }),
    ).rejects.toThrow(/STOCK_MOVEMENT_IMMUTABLE/);

    await expect(
      prisma.stockMovement.delete({
        where: { id: seedMovementId },
      }),
    ).rejects.toThrow(/STOCK_MOVEMENT_IMMUTABLE/);

    const stillThere = await prisma.stockMovement.findUniqueOrThrow({
      where: { id: seedMovementId },
    });
    expect(stillThere.note).toBe('seed for immutability');
    expect(stillThere.quantityDelta.toFixed(4)).toBe('3.0000');
  });
});
