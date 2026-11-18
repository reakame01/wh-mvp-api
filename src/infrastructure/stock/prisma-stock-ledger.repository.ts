import { Injectable } from '@nestjs/common';
import {
  Prisma,
  type StockMovement as PrismaStockMovement,
} from '@prisma/client';
import {
  RecordAdjustmentPersistInput,
  RecordAdjustmentPersistResult,
  StockLedgerRepositoryPort,
} from '../../application/stock/ports/stock-ledger.repository.port';
import {
  formatScaledToDecimalString,
  parseDecimalStringToScaled,
} from '../../domain/stock/quantity';
import type { StockMovement } from '../../domain/stock/stock-movement';
import { PrismaService } from '../prisma/prisma.service';

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
          return { ok: false, reason: 'insufficient' };
        }

        const nextOnHandScaled =
          parseDecimalStringToScaled(balance.on_hand.toFixed(4)) +
          parseDecimalStringToScaled(input.quantityDelta);
        if (nextOnHandScaled < 0n) {
          return { ok: false, reason: 'insufficient' };
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
}
