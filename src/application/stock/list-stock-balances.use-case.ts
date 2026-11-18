import { Inject, Injectable } from '@nestjs/common';
import {
  buildPageMeta,
  normalizePageQuery,
  type PagedResult,
} from '../../domain/master-data/pagination';
import {
  availableQuantity,
  type StockBalance,
} from '../../domain/stock/stock-balance';
import {
  STOCK_LEDGER_REPOSITORY,
  type StockLedgerRepositoryPort,
} from './ports/stock-ledger.repository.port';

export type StockBalanceView = StockBalance & { available: string };

@Injectable()
export class ListStockBalancesUseCase {
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
    lowStock?: boolean;
    sort?: string;
  }): Promise<PagedResult<StockBalanceView>> {
    const { page, pageSize } = normalizePageQuery(input.page, input.pageSize);
    const { items, total } = await this.ledger.listBalances({
      page,
      pageSize,
      productId: input.productId?.trim() || undefined,
      locationId: input.locationId?.trim() || undefined,
      warehouseId: input.warehouseId?.trim() || undefined,
      lowStock: input.lowStock,
      sort: input.sort,
    });
    return {
      data: items.map((row) => ({
        ...row,
        available: availableQuantity(row.onHand, row.reserved),
      })),
      meta: buildPageMeta(page, pageSize, total),
    };
  }
}
