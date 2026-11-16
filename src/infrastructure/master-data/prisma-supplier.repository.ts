import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  SupplierCreateInput,
  SupplierListQuery,
  SupplierRepositoryPort,
  SupplierUpdateInput,
} from '../../application/master-data/ports/supplier.repository.port';
import { Supplier } from '../../domain/master-data/supplier';
import { PrismaService } from '../prisma/prisma.service';
import { CODE_SORT_FIELDS, parseSort } from './sort';

@Injectable()
export class PrismaSupplierRepository implements SupplierRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<Supplier | null> {
    return this.prisma.supplier.findUnique({ where: { id } });
  }

  findByCode(code: string): Promise<Supplier | null> {
    return this.prisma.supplier.findUnique({ where: { code } });
  }

  async list(
    query: SupplierListQuery,
  ): Promise<{ items: Supplier[]; total: number }> {
    const where: Prisma.SupplierWhereInput = {};
    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }
    if (query.search) {
      where.OR = [
        { code: { contains: query.search, mode: 'insensitive' } },
        { name: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const orderBy = parseSort(query.sort, CODE_SORT_FIELDS);
    const [items, total] = await this.prisma.$transaction([
      this.prisma.supplier.findMany({
        where,
        orderBy,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.supplier.count({ where }),
    ]);
    return { items, total };
  }

  create(input: SupplierCreateInput): Promise<Supplier> {
    return this.prisma.supplier.create({
      data: {
        code: input.code,
        name: input.name,
        email: input.email ?? null,
        phone: input.phone ?? null,
        address: input.address ?? null,
      },
    });
  }

  update(id: string, input: SupplierUpdateInput): Promise<Supplier> {
    return this.prisma.supplier.update({
      where: { id },
      data: {
        name: input.name,
        email: input.email,
        phone: input.phone,
        address: input.address,
        isActive: input.isActive,
      },
    });
  }
}
