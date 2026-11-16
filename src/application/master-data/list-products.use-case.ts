import { Inject, Injectable } from '@nestjs/common';
import {
  buildPageMeta,
  normalizePageQuery,
  type PagedResult,
} from '../../domain/master-data/pagination';
import type { Product } from '../../domain/master-data/product';
import {
  PRODUCT_REPOSITORY,
  type ProductRepositoryPort,
} from './ports/product.repository.port';

@Injectable()
export class ListProductsUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly products: ProductRepositoryPort,
  ) {}

  async execute(input: {
    page?: number;
    pageSize?: number;
    search?: string;
    isActive?: boolean;
    categoryId?: string;
    sort?: string;
  }): Promise<PagedResult<Product>> {
    const { page, pageSize } = normalizePageQuery(input.page, input.pageSize);
    const { items, total } = await this.products.list({
      page,
      pageSize,
      search: input.search?.trim() || undefined,
      isActive: input.isActive,
      categoryId: input.categoryId?.trim() || undefined,
      sort: input.sort,
    });
    return {
      data: items,
      meta: buildPageMeta(page, pageSize, total),
    };
  }
}
