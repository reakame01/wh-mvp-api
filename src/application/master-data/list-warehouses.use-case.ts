import { Inject, Injectable } from '@nestjs/common';
import {
  buildPageMeta,
  normalizePageQuery,
  type PagedResult,
} from '../../domain/master-data/pagination';
import type { Warehouse } from '../../domain/master-data/warehouse';
import {
  WAREHOUSE_REPOSITORY,
  type WarehouseRepositoryPort,
} from './ports/warehouse.repository.port';

@Injectable()
export class ListWarehousesUseCase {
  constructor(
    @Inject(WAREHOUSE_REPOSITORY)
    private readonly warehouses: WarehouseRepositoryPort,
  ) {}

  async execute(input: {
    page?: number;
    pageSize?: number;
    search?: string;
    isActive?: boolean;
    sort?: string;
  }): Promise<PagedResult<Warehouse>> {
    const { page, pageSize } = normalizePageQuery(input.page, input.pageSize);
    const { items, total } = await this.warehouses.list({
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
