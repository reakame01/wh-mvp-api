import { Module } from '@nestjs/common';
import { GetStockBalanceUseCase } from '../../application/stock/get-stock-balance.use-case';
import { ListStockBalancesUseCase } from '../../application/stock/list-stock-balances.use-case';
import { ListStockMovementsUseCase } from '../../application/stock/list-stock-movements.use-case';
import { STOCK_LEDGER_REPOSITORY } from '../../application/stock/ports/stock-ledger.repository.port';
import { RecordAdjustmentUseCase } from '../../application/stock/record-adjustment.use-case';
import { PrismaStockLedgerRepository } from '../../infrastructure/stock/prisma-stock-ledger.repository';
import { AuthModule } from '../auth/auth.module';
import { StockController } from './stock.controller';

@Module({
  imports: [AuthModule],
  controllers: [StockController],
  providers: [
    RecordAdjustmentUseCase,
    ListStockBalancesUseCase,
    GetStockBalanceUseCase,
    ListStockMovementsUseCase,
    { provide: STOCK_LEDGER_REPOSITORY, useClass: PrismaStockLedgerRepository },
  ],
})
export class StockModule {}
