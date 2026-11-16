import { Injectable } from '@nestjs/common';
import { Prisma, type Product as PrismaProduct } from '@prisma/client';
import {
  ActivateOrMoveProductResult,
  CreateProductUnderCategoryResult,
  ProductCreateInput,
  ProductListQuery,
  ProductRepositoryPort,
  ProductUpdateInput,
} from '../../application/master-data/ports/product.repository.port';
import { Product } from '../../domain/master-data/product';
import { PrismaService } from '../prisma/prisma.service';
import { PRODUCT_SORT_FIELDS, parseSort } from './sort';

function mapProduct(row: PrismaProduct): Product {
  return {
    id: row.id,
    sku: row.sku,
    barcode: row.barcode,
    name: row.name,
    categoryId: row.categoryId,
    unit: row.unit,
    reorderPoint: row.reorderPoint.toFixed(4),
    imageUrl: row.imageUrl,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

@Injectable()
export class PrismaProductRepository implements ProductRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Product | null> {
    const row = await this.prisma.product.findUnique({ where: { id } });
    return row ? mapProduct(row) : null;
  }

  async findBySku(sku: string): Promise<Product | null> {
    const row = await this.prisma.product.findUnique({ where: { sku } });
    return row ? mapProduct(row) : null;
  }

  async findByBarcode(barcode: string): Promise<Product | null> {
    const row = await this.prisma.product.findUnique({ where: { barcode } });
    return row ? mapProduct(row) : null;
  }

  async list(
    query: ProductListQuery,
  ): Promise<{ items: Product[]; total: number }> {
    const where: Prisma.ProductWhereInput = {};
    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }
    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }
    if (query.search) {
      where.OR = [
        { sku: { contains: query.search, mode: 'insensitive' } },
        { name: { contains: query.search, mode: 'insensitive' } },
        { barcode: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const orderBy = parseSort(query.sort, PRODUCT_SORT_FIELDS);
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        orderBy,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.product.count({ where }),
    ]);
    return { items: rows.map(mapProduct), total };
  }

  async createUnderActiveCategory(
    input: ProductCreateInput,
  ): Promise<CreateProductUnderCategoryResult> {
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`
        SELECT id FROM categories WHERE id = ${input.categoryId} FOR UPDATE
      `;
      const category = await tx.category.findUnique({
        where: { id: input.categoryId },
      });
      if (!category) {
        return { ok: false, reason: 'category_not_found' };
      }
      if (!category.isActive) {
        return { ok: false, reason: 'category_inactive' };
      }

      const created = await tx.product.create({
        data: {
          sku: input.sku,
          barcode: input.barcode ?? null,
          name: input.name,
          categoryId: input.categoryId,
          unit: input.unit,
          reorderPoint: new Prisma.Decimal(input.reorderPoint),
          imageUrl: input.imageUrl ?? null,
        },
      });
      return { ok: true, product: mapProduct(created) };
    });
  }

  async update(id: string, input: ProductUpdateInput): Promise<Product> {
    const updated = await this.prisma.product.update({
      where: { id },
      data: {
        barcode: input.barcode,
        name: input.name,
        categoryId: input.categoryId,
        unit: input.unit,
        reorderPoint:
          input.reorderPoint !== undefined
            ? new Prisma.Decimal(input.reorderPoint)
            : undefined,
        imageUrl: input.imageUrl,
        isActive: input.isActive,
      },
    });
    return mapProduct(updated);
  }

  async updateGuardingCategory(
    id: string,
    input: ProductUpdateInput,
  ): Promise<ActivateOrMoveProductResult> {
    return this.prisma.$transaction(async (tx) => {
      // Read without lock first so we can take locks in category → product order
      // (same order as category deactivate) and avoid AB-BA deadlocks.
      const existing = await tx.product.findUnique({ where: { id } });
      if (!existing) {
        return { ok: false, reason: 'not_found' };
      }

      const targetCategoryId = input.categoryId ?? existing.categoryId;
      await tx.$queryRaw`
        SELECT id FROM categories WHERE id = ${targetCategoryId} FOR UPDATE
      `;
      const category = await tx.category.findUnique({
        where: { id: targetCategoryId },
      });
      if (!category) {
        return { ok: false, reason: 'category_not_found' };
      }
      if (!category.isActive) {
        return { ok: false, reason: 'category_inactive' };
      }

      await tx.$queryRaw`
        SELECT id FROM products WHERE id = ${id} FOR UPDATE
      `;
      const product = await tx.product.findUnique({ where: { id } });
      if (!product) {
        return { ok: false, reason: 'not_found' };
      }

      const updated = await tx.product.update({
        where: { id },
        data: {
          barcode: input.barcode,
          name: input.name,
          categoryId: input.categoryId,
          unit: input.unit,
          reorderPoint:
            input.reorderPoint !== undefined
              ? new Prisma.Decimal(input.reorderPoint)
              : undefined,
          imageUrl: input.imageUrl,
          isActive: input.isActive,
        },
      });
      return { ok: true, product: mapProduct(updated) };
    });
  }
}
