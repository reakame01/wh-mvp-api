import { Inject, Injectable } from '@nestjs/common';
import {
  buildPageMeta,
  normalizePageQuery,
  type PagedResult,
} from '../../domain/master-data/pagination';
import type { Supplier } from '../../domain/master-data/supplier';
import {
  SUPPLIER_REPOSITORY,
  type SupplierRepositoryPort,
} from './ports/supplier.repository.port';

@Injectable()
export class ListSuppliersUseCase {
  constructor(
    @Inject(SUPPLIER_REPOSITORY)
    private readonly suppliers: SupplierRepositoryPort,
  ) {}

  async execute(input: {
    page?: number;
    pageSize?: number;
    search?: string;
    isActive?: boolean;
    sort?: string;
  }): Promise<PagedResult<Supplier>> {
    const { page, pageSize } = normalizePageQuery(input.page, input.pageSize);
    const { items, total } = await this.suppliers.list({
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
