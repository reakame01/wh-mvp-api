import { Injectable } from '@nestjs/common';
import {
  Prisma,
  type StockBalance as PrismaStockBalance,
  type StockMovement as PrismaStockMovement,
} from '@prisma/client';
import {
  RecordAdjustmentPersistInput,
  RecordAdjustmentPersistResult,
  StockBalanceListQuery,
  StockLedgerRepositoryPort,
  StockMovementListQuery,
} from '../../application/stock/ports/stock-ledger.repository.port';
import {
  formatScaledToDecimalString,
  parseDecimalStringToScaled,
} from '../../domain/stock/quantity';
import type { StockBalance } from '../../domain/stock/stock-balance';
import type { StockMovement } from '../../domain/stock/stock-movement';
import { PrismaService } from '../prisma/prisma.service';
import { parseBalanceSort, parseMovementSort } from './stock-sort';

/** Thrown inside a txn so Prisma rolls back (including a just-inserted zero balance). */
class InsufficientStockTxnError extends Error {
  constructor() {
    super('STOCK_INSUFFICIENT');
    this.name = 'InsufficientStockTxnError';
  }
}

function mapMovement(row: PrismaStockMovement): StockMovement {
  return {
    id: row.id,
    productId: row.productId,
    locationId: row.locationId,
    type: row.type,
    quantityDelta: row.quantityDelta.toFixed(4),
    reasonCode: row.reasonCode,
    note: row.note,
    createdByUserId: row.createdByUserId,
    idempotencyKey: row.idempotencyKey,
    createdAt: row.createdAt,
  };
}

function mapBalance(row: PrismaStockBalance): StockBalance {
  return {
    productId: row.productId,
    locationId: row.locationId,
    onHand: row.onHand.toFixed(4),
    reserved: row.reserved.toFixed(4),
    updatedAt: row.updatedAt,
  };
}

function balanceOrderSql(sort: string | undefined): Prisma.Sql {
  const [field, dirRaw] = (sort ?? 'updatedAt:desc').split(':');
  const dir = dirRaw === 'asc' ? Prisma.sql`ASC` : Prisma.sql`DESC`;
  if (field === 'onHand') {
    return Prisma.sql`sb.on_hand ${dir}, sb.product_id ASC, sb.location_id ASC`;
  }
  return Prisma.sql`sb.updated_at ${dir}, sb.product_id ASC, sb.location_id ASC`;
}

@Injectable()
export class PrismaStockLedgerRepository implements StockLedgerRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findMovementByIdempotency(
    createdByUserId: string,
    idempotencyKey: string,
  ): Promise<StockMovement | null> {
    const row = await this.prisma.stockMovement.findUnique({
      where: {
        createdByUserId_idempotencyKey: { createdByUserId, idempotencyKey },
      },
    });
    return row ? mapMovement(row) : null;
  }

  async persistAdjustment(
    input: RecordAdjustmentPersistInput,
  ): Promise<RecordAdjustmentPersistResult> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const product = await tx.product.findUnique({
          where: { id: input.productId },
        });
        if (!product) {
          return { ok: false, reason: 'product_not_found' };
        }
        if (!product.isActive) {
          return { ok: false, reason: 'product_inactive' };
        }

        const location = await tx.location.findUnique({
          where: { id: input.locationId },
        });
        if (!location) {
          return { ok: false, reason: 'location_not_found' };
        }
        if (!location.isActive) {
          return { ok: false, reason: 'location_inactive' };
        }

        await tx.$executeRaw`
          INSERT INTO stock_balances (product_id, location_id, on_hand, reserved, updated_at)
          VALUES (${input.productId}, ${input.locationId}, 0, 0, NOW())
          ON CONFLICT (product_id, location_id) DO NOTHING
        `;

        const locked = await tx.$queryRaw<
          Array<{ on_hand: Prisma.Decimal; reserved: Prisma.Decimal }>
        >`
          SELECT on_hand, reserved
          FROM stock_balances
          WHERE product_id = ${input.productId}
            AND location_id = ${input.locationId}
          FOR UPDATE
        `;
        const balance = locked[0];
        if (!balance) {
          // Rollback any INSERT … ON CONFLICT balance row from this txn.
          throw new InsufficientStockTxnError();
        }

        const nextOnHandScaled =
          parseDecimalStringToScaled(balance.on_hand.toFixed(4)) +
          parseDecimalStringToScaled(input.quantityDelta);
        if (nextOnHandScaled < 0n) {
          // Rollback any INSERT … ON CONFLICT balance row from this txn.
          throw new InsufficientStockTxnError();
        }
        const nextOnHand = formatScaledToDecimalString(nextOnHandScaled);

        const created = await tx.stockMovement.create({
          data: {
            productId: input.productId,
            locationId: input.locationId,
            type: 'ADJUSTMENT',
            quantityDelta: new Prisma.Decimal(input.quantityDelta),
            reasonCode: input.reasonCode,
            note: input.note,
            createdByUserId: input.createdByUserId,
            idempotencyKey: input.idempotencyKey,
          },
        });

        await tx.stockBalance.update({
          where: {
            productId_locationId: {
              productId: input.productId,
              locationId: input.locationId,
            },
          },
          data: {
            onHand: new Prisma.Decimal(nextOnHand),
          },
        });

        return { ok: true, replayed: false, movement: mapMovement(created) };
      });
    } catch (error) {
      if (error instanceof InsufficientStockTxnError) {
        return { ok: false, reason: 'insufficient' };
      }
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const existing = await this.findMovementByIdempotency(
          input.createdByUserId,
          input.idempotencyKey,
        );
        if (existing) {
          return { ok: true, replayed: true, movement: existing };
        }
      }
      throw error;
    }
  }

  async findBalance(
    productId: string,
    locationId: string,
  ): Promise<StockBalance | null> {
    const row = await this.prisma.stockBalance.findUnique({
      where: { productId_locationId: { productId, locationId } },
    });
    return row ? mapBalance(row) : null;
  }

  async listBalances(
    query: StockBalanceListQuery,
  ): Promise<{ items: StockBalance[]; total: number }> {
    if (query.lowStock) {
      return this.listBalancesWithLowStock(query);
    }

    const where: Prisma.StockBalanceWhereInput = {};
    if (query.productId) {
      where.productId = query.productId;
    }
    if (query.locationId) {
      where.locationId = query.locationId;
    }
    if (query.warehouseId) {
      where.location = { warehouseId: query.warehouseId };
    }

    const orderBy = parseBalanceSort(query.sort);
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.stockBalance.findMany({
        where,
        orderBy,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.stockBalance.count({ where }),
    ]);
    return { items: rows.map(mapBalance), total };
  }

  async listMovements(
    query: StockMovementListQuery,
  ): Promise<{ items: StockMovement[]; total: number }> {
    const where: Prisma.StockMovementWhereInput = {};
    if (query.productId) {
      where.productId = query.productId;
    }
    if (query.locationId) {
      where.locationId = query.locationId;
    }
    if (query.warehouseId) {
      where.location = { warehouseId: query.warehouseId };
    }
    if (query.type) {
      where.type = query.type;
    }
    if (query.createdFrom || query.createdTo) {
      where.createdAt = {};
      if (query.createdFrom) {
        where.createdAt.gte = query.createdFrom;
      }
      if (query.createdTo) {
        where.createdAt.lte = query.createdTo;
      }
    }

    const orderBy = parseMovementSort(query.sort);
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.stockMovement.findMany({
        where,
        orderBy,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.stockMovement.count({ where }),
    ]);
    return { items: rows.map(mapMovement), total };
  }

  private async listBalancesWithLowStock(
    query: StockBalanceListQuery,
  ): Promise<{ items: StockBalance[]; total: number }> {
    const filters: Prisma.Sql[] = [Prisma.sql`sb.on_hand <= p.reorder_point`];
    if (query.productId) {
      filters.push(Prisma.sql`sb.product_id = ${query.productId}`);
    }
    if (query.locationId) {
      filters.push(Prisma.sql`sb.location_id = ${query.locationId}`);
    }
    if (query.warehouseId) {
      filters.push(Prisma.sql`l.warehouse_id = ${query.warehouseId}`);
    }
    const whereSql = Prisma.join(filters, ' AND ');
    const orderSql = balanceOrderSql(query.sort);
    const skip = (query.page - 1) * query.pageSize;

    const [rows, countRows] = await this.prisma.$transaction([
      this.prisma.$queryRaw<
        Array<{
          product_id: string;
          location_id: string;
          on_hand: Prisma.Decimal;
          reserved: Prisma.Decimal;
          updated_at: Date;
        }>
      >`
        SELECT sb.product_id, sb.location_id, sb.on_hand, sb.reserved, sb.updated_at
        FROM stock_balances sb
        INNER JOIN products p ON p.id = sb.product_id
        INNER JOIN locations l ON l.id = sb.location_id
        WHERE ${whereSql}
        ORDER BY ${orderSql}
        LIMIT ${query.pageSize} OFFSET ${skip}
      `,
      this.prisma.$queryRaw<Array<{ total: bigint }>>`
        SELECT COUNT(*)::bigint AS total
        FROM stock_balances sb
        INNER JOIN products p ON p.id = sb.product_id
        INNER JOIN locations l ON l.id = sb.location_id
        WHERE ${whereSql}
      `,
    ]);

    return {
      items: rows.map((row) =>
        mapBalance({
          productId: row.product_id,
          locationId: row.location_id,
          onHand: row.on_hand,
          reserved: row.reserved,
          updatedAt: row.updated_at,
        }),
      ),
      total: Number(countRows[0]?.total ?? 0n),
    };
  }
}
