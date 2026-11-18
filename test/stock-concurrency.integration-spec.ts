import { Prisma } from '@prisma/client';
import { RecordAdjustmentUseCase } from '../src/application/stock/record-adjustment.use-case';
import { PrismaStockLedgerRepository } from '../src/infrastructure/stock/prisma-stock-ledger.repository';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';
import { StockInsufficientError } from '../src/domain/stock/stock.errors';

/**
 * Proves Stage 3 locking (ADR 0003): many parallel negative adjustments on a
 * scarce balance serialize on `SELECT … FOR UPDATE`, so on-hand never goes
 * negative and exactly `initialOnHand` attempts succeed.
 *
 * Requires a reachable DATABASE_URL (CI Postgres service or local Compose).
 */
describe('stock adjustment concurrency (integration)', () => {
  const prisma = new PrismaService();
  const ledger = new PrismaStockLedgerRepository(prisma);
  const useCase = new RecordAdjustmentUseCase(ledger);

  const runId = `conc-${Date.now()}`;
  let userId = '';
  let productId = '';
  let locationId = '';

  const initialOnHand = 10;
  const parallelAttempts = 40;

  beforeAll(async () => {
    await prisma.$connect();

    const user = await prisma.user.create({
      data: {
        email: `${runId}@concurrency.test`,
        passwordHash: 'unused-for-concurrency-test',
        fullName: 'Concurrency Tester',
        role: 'Admin',
        isActive: true,
      },
    });
    userId = user.id;

    const category = await prisma.category.create({
      data: {
        code: `CAT-${runId}`.slice(0, 32),
        name: 'Concurrency Category',
      },
    });
    const product = await prisma.product.create({
      data: {
        sku: `SKU-${runId}`.slice(0, 32),
        name: 'Concurrency Widget',
        categoryId: category.id,
        unit: 'EA',
        reorderPoint: new Prisma.Decimal('1'),
      },
    });
    productId = product.id;

    const warehouse = await prisma.warehouse.create({
      data: {
        code: `WH-${runId}`.slice(0, 32),
        name: 'Concurrency WH',
      },
    });
    const location = await prisma.location.create({
      data: {
        warehouseId: warehouse.id,
        code: 'BIN-C1',
        name: 'Concurrency Bin',
      },
    });
    locationId = location.id;

    await useCase.execute({
      productId,
      locationId,
      quantityDelta: String(initialOnHand),
      reasonCode: 'FOUND',
      note: 'seed for concurrency',
      createdByUserId: userId,
      idempotencyKey: `${runId}-seed`,
    });
  });

  afterAll(async () => {
    // Movements are append-only (DB trigger); leave unique runId fixtures behind.
    await prisma.$disconnect();
  });

  it('allows exactly initialOnHand successes and never leaves negative on-hand', async () => {
    const outcomes = await Promise.all(
      Array.from({ length: parallelAttempts }, (_, index) =>
        useCase
          .execute({
            productId,
            locationId,
            quantityDelta: '-1',
            reasonCode: 'LOST',
            createdByUserId: userId,
            idempotencyKey: `${runId}-try-${index}`,
          })
          .then(() => 'ok' as const)
          .catch((error: unknown) => {
            if (error instanceof StockInsufficientError) {
              return 'insufficient' as const;
            }
            throw error;
          }),
      ),
    );

    const successes = outcomes.filter((o) => o === 'ok').length;
    const rejected = outcomes.filter((o) => o === 'insufficient').length;

    expect(successes).toBe(initialOnHand);
    expect(rejected).toBe(parallelAttempts - initialOnHand);

    const balance = await prisma.stockBalance.findUniqueOrThrow({
      where: {
        productId_locationId: { productId, locationId },
      },
    });
    expect(balance.onHand.toFixed(4)).toBe('0.0000');
    expect(balance.onHand.gte(0)).toBe(true);

    const lostCount = await prisma.stockMovement.count({
      where: {
        productId,
        locationId,
        reasonCode: 'LOST',
        quantityDelta: new Prisma.Decimal('-1'),
      },
    });
    expect(lostCount).toBe(initialOnHand);
  });
});
