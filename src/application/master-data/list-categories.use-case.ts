import { Inject, Injectable } from '@nestjs/common';
import type { Category } from '../../domain/master-data/category';
import {
  buildPageMeta,
  normalizePageQuery,
  type PagedResult,
} from '../../domain/master-data/pagination';
import {
  CATEGORY_REPOSITORY,
  type CategoryRepositoryPort,
} from './ports/category.repository.port';

@Injectable()
export class ListCategoriesUseCase {
  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly categories: CategoryRepositoryPort,
  ) {}

  async execute(input: {
    page?: number;
    pageSize?: number;
    search?: string;
    isActive?: boolean;
    sort?: string;
  }): Promise<PagedResult<Category>> {
    const { page, pageSize } = normalizePageQuery(input.page, input.pageSize);
    const { items, total } = await this.categories.list({
      page,
      pageSize,
      search: input.search?.trim() || undefined,
      isActive: input.isActive,
      sort: input.sort,
    });
    return {
      data: items,
      meta: buildPageMeta(page, pageSize, total),
    };
  }
}
