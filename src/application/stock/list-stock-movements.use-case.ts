import { Inject, Injectable } from '@nestjs/common';
import {
  buildPageMeta,
  normalizePageQuery,
  type PagedResult,
} from '../../domain/master-data/pagination';
import type {
  StockMovement,
  StockMovementType,
} from '../../domain/stock/stock-movement';
import {
  STOCK_LEDGER_REPOSITORY,
  type StockLedgerRepositoryPort,
} from './ports/stock-ledger.repository.port';

@Injectable()
export class ListStockMovementsUseCase {
  constructor(
    @Inject(STOCK_LEDGER_REPOSITORY)
    private readonly ledger: StockLedgerRepositoryPort,
  ) {}

  async execute(input: {
    page?: number;
    pageSize?: number;
    productId?: string;
    locationId?: string;
    warehouseId?: string;
    type?: StockMovementType;
    createdFrom?: Date;
    createdTo?: Date;
    sort?: string;
  }): Promise<PagedResult<StockMovement>> {
    const { page, pageSize } = normalizePageQuery(input.page, input.pageSize);
    const { items, total } = await this.ledger.listMovements({
      page,
      pageSize,
      productId: input.productId?.trim() || undefined,
      locationId: input.locationId?.trim() || undefined,
      warehouseId: input.warehouseId?.trim() || undefined,
      type: input.type,
      createdFrom: input.createdFrom,
      createdTo: input.createdTo,
      sort: input.sort,
    });
    return {
      data: items,
      meta: buildPageMeta(page, pageSize, total),
    };
  }
}
