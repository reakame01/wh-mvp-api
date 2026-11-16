import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  LocationCreateInput,
  LocationListQuery,
  LocationRepositoryPort,
  LocationUpdateInput,
} from '../../application/master-data/ports/location.repository.port';
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
}
