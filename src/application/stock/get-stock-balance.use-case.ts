import { Inject, Injectable } from '@nestjs/common';
import {
  availableQuantity,
  type StockBalance,
} from '../../domain/stock/stock-balance';
import { StockBalanceNotFoundError } from '../../domain/stock/stock.errors';
import {
  STOCK_LEDGER_REPOSITORY,
  type StockLedgerRepositoryPort,
} from './ports/stock-ledger.repository.port';

export type StockBalanceView = StockBalance & { available: string };

@Injectable()
export class GetStockBalanceUseCase {
  constructor(
    @Inject(STOCK_LEDGER_REPOSITORY)
    private readonly ledger: StockLedgerRepositoryPort,
  ) {}

  async execute(
    productId: string,
    locationId: string,
  ): Promise<StockBalanceView> {
    const balance = await this.ledger.findBalance(productId, locationId);
    if (!balance) {
      throw new StockBalanceNotFoundError();
    }
    return {
      ...balance,
      available: availableQuantity(balance.onHand, balance.reserved),
    };
  }
}
