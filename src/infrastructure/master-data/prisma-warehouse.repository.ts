import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  WarehouseCreateInput,
  WarehouseListQuery,
  WarehouseRepositoryPort,
  WarehouseUpdateInput,
} from '../../application/master-data/ports/warehouse.repository.port';
import { Warehouse } from '../../domain/master-data/warehouse';
import { PrismaService } from '../prisma/prisma.service';
import { parseSort } from './sort';

@Injectable()
export class PrismaWarehouseRepository implements WarehouseRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<Warehouse | null> {
    return this.prisma.warehouse.findUnique({ where: { id } });
  }

  findByCode(code: string): Promise<Warehouse | null> {
    return this.prisma.warehouse.findUnique({ where: { code } });
  }

  async list(
    query: WarehouseListQuery,
  ): Promise<{ items: Warehouse[]; total: number }> {
    const where: Prisma.WarehouseWhereInput = {};
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
      this.prisma.warehouse.findMany({
        where,
        orderBy,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.warehouse.count({ where }),
    ]);
    return { items, total };
  }

  create(input: WarehouseCreateInput): Promise<Warehouse> {
    return this.prisma.warehouse.create({
      data: {
        code: input.code,
        name: input.name,
        address: input.address ?? null,
      },
    });
  }

  update(id: string, input: WarehouseUpdateInput): Promise<Warehouse> {
    return this.prisma.warehouse.update({
      where: { id },
      data: {
        name: input.name,
        address: input.address,
        isActive: input.isActive,
      },
    });
  }

  countActiveLocations(warehouseId: string): Promise<number> {
    return this.prisma.location.count({
      where: { warehouseId, isActive: true },
    });
  }
}
