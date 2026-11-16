import { Inject, Injectable } from '@nestjs/common';
import type { Location } from '../../domain/master-data/location';
import {
  buildPageMeta,
  normalizePageQuery,
  type PagedResult,
} from '../../domain/master-data/pagination';
import {
  LOCATION_REPOSITORY,
  type LocationRepositoryPort,
} from './ports/location.repository.port';

@Injectable()
export class ListLocationsUseCase {
  constructor(
    @Inject(LOCATION_REPOSITORY)
    private readonly locations: LocationRepositoryPort,
  ) {}

  async execute(input: {
    page?: number;
    pageSize?: number;
    warehouseId?: string;
    search?: string;
    isActive?: boolean;
    sort?: string;
  }): Promise<PagedResult<Location>> {
    const { page, pageSize } = normalizePageQuery(input.page, input.pageSize);
    const { items, total } = await this.locations.list({
      page,
      pageSize,
      warehouseId: input.warehouseId,
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
