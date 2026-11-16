import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  LocationCreateInput,
  LocationListQuery,
  LocationRepositoryPort,
  LocationUpdateInput,
  ReparentLocationResult,
} from '../../application/master-data/ports/location.repository.port';
import { wouldCreateLocationCycle } from '../../domain/master-data/location-tree';
import { Location } from '../../domain/master-data/location';
import { PrismaService } from '../prisma/prisma.service';
import { parseSort } from './sort';

@Injectable()
export class PrismaLocationRepository implements LocationRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<Location | null> {
    return this.prisma.location.findUnique({ where: { id } });
  }

  findByWarehouseAndCode(
    warehouseId: string,
    code: string,
  ): Promise<Location | null> {
    return this.prisma.location.findUnique({
      where: { warehouseId_code: { warehouseId, code } },
    });
  }

  async list(
    query: LocationListQuery,
  ): Promise<{ items: Location[]; total: number }> {
    const where: Prisma.LocationWhereInput = {};
    if (query.warehouseId) {
      where.warehouseId = query.warehouseId;
    }
    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }
    if (query.search) {
      where.OR = [
        { code: { contains: query.search, mode: 'insensitive' } },
        { name: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const orderBy = parseSort(query.sort);
    const [items, total] = await this.prisma.$transaction([
      this.prisma.location.findMany({
        where,
        orderBy,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.location.count({ where }),
    ]);
    return { items, total };
  }

  create(input: LocationCreateInput): Promise<Location> {
    return this.prisma.location.create({
      data: {
        warehouseId: input.warehouseId,
        code: input.code,
        name: input.name,
        parentLocationId: input.parentLocationId ?? null,
      },
    });
  }

  update(id: string, input: LocationUpdateInput): Promise<Location> {
    return this.prisma.location.update({
      where: { id },
      data: {
        name: input.name,
        parentLocationId: input.parentLocationId,
        isActive: input.isActive,
      },
    });
  }

  async parentMapForWarehouse(
    warehouseId: string,
  ): Promise<Map<string, string | null>> {
    const rows = await this.prisma.location.findMany({
      where: { warehouseId },
      select: { id: true, parentLocationId: true },
    });
    return new Map(rows.map((row) => [row.id, row.parentLocationId]));
  }

  async reparentWithLock(
    id: string,
    parentLocationId: string | null,
    fields?: Omit<LocationUpdateInput, 'parentLocationId'>,
  ): Promise<ReparentLocationResult> {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.location.findUnique({ where: { id } });
      if (!existing) {
        return { ok: false, reason: 'not_found' };
      }

      await tx.$queryRaw`
        SELECT id FROM locations
        WHERE warehouse_id = ${existing.warehouseId}
        FOR UPDATE
      `;

      const rows = await tx.location.findMany({
        where: { warehouseId: existing.warehouseId },
        select: { id: true, parentLocationId: true, isActive: true },
      });
      const parentMap = new Map(
        rows.map((row) => [row.id, row.parentLocationId]),
      );

      if (parentLocationId !== null) {
        const parent = rows.find((row) => row.id === parentLocationId);
        if (!parent || !parent.isActive || parentLocationId === id) {
          return { ok: false, reason: 'parent_invalid' };
        }
        if (wouldCreateLocationCycle(id, parentLocationId, parentMap)) {
          return { ok: false, reason: 'cycle' };
        }
      }

      const updated = await tx.location.update({
        where: { id },
        data: {
          parentLocationId,
          name: fields?.name,
          isActive: fields?.isActive,
        },
      });
      return { ok: true, location: updated };
    });
  }
}
