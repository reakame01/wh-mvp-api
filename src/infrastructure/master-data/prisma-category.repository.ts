import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  CategoryCreateInput,
  CategoryListQuery,
  CategoryRepositoryPort,
  CategoryUpdateInput,
  DeactivateCategoryResult,
} from '../../application/master-data/ports/category.repository.port';
import { Category } from '../../domain/master-data/category';
import { PrismaService } from '../prisma/prisma.service';
import { CODE_SORT_FIELDS, parseSort } from './sort';

@Injectable()
export class PrismaCategoryRepository implements CategoryRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<Category | null> {
    return this.prisma.category.findUnique({ where: { id } });
  }

  findByCode(code: string): Promise<Category | null> {
    return this.prisma.category.findUnique({ where: { code } });
  }

  async list(
    query: CategoryListQuery,
  ): Promise<{ items: Category[]; total: number }> {
    const where: Prisma.CategoryWhereInput = {};
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
      this.prisma.category.findMany({
        where,
        orderBy,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.category.count({ where }),
    ]);
    return { items, total };
  }

  create(input: CategoryCreateInput): Promise<Category> {
    return this.prisma.category.create({
      data: {
        code: input.code,
        name: input.name,
        description: input.description ?? null,
      },
    });
  }

  update(id: string, input: CategoryUpdateInput): Promise<Category> {
    return this.prisma.category.update({
      where: { id },
      data: {
        name: input.name,
        description: input.description,
        isActive: input.isActive,
      },
    });
  }

  countActiveProducts(categoryId: string): Promise<number> {
    return this.prisma.product.count({
      where: { categoryId, isActive: true },
    });
  }

  async deactivateIfNoActiveProducts(
    id: string,
    fields?: { name?: string; description?: string | null },
  ): Promise<DeactivateCategoryResult> {
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`
        SELECT id FROM categories WHERE id = ${id} FOR UPDATE
      `;
      const category = await tx.category.findUnique({ where: { id } });
      if (!category) {
        return { ok: false, reason: 'not_found' };
      }

      await tx.$queryRaw`
        SELECT id FROM products
        WHERE category_id = ${id}
        ORDER BY id
        FOR UPDATE
      `;
      const activeCount = await tx.product.count({
        where: { categoryId: id, isActive: true },
      });
      if (activeCount > 0) {
        return { ok: false, reason: 'has_active_products' };
      }

      const updated = await tx.category.update({
        where: { id },
        data: {
          isActive: false,
          name: fields?.name,
          description: fields?.description,
        },
      });
      return { ok: true, category: updated };
    });
  }
}
