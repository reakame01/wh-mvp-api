import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { GetStockBalanceUseCase } from '../../application/stock/get-stock-balance.use-case';
import { ListStockBalancesUseCase } from '../../application/stock/list-stock-balances.use-case';
import { ListStockMovementsUseCase } from '../../application/stock/list-stock-movements.use-case';
import { RecordAdjustmentUseCase } from '../../application/stock/record-adjustment.use-case';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { RequestUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { CreateAdjustmentDto } from './dto/create-adjustment.dto';
import { ListStockBalancesQueryDto } from './dto/list-stock-balances-query.dto';
import { ListStockMovementsQueryDto } from './dto/list-stock-movements-query.dto';

@Controller('stock')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class StockController {
  constructor(
    private readonly recordAdjustment: RecordAdjustmentUseCase,
    private readonly listStockBalances: ListStockBalancesUseCase,
    private readonly getStockBalance: GetStockBalanceUseCase,
    private readonly listStockMovements: ListStockMovementsUseCase,
  ) {}

  @Get('balances')
  @RequirePermissions('stock:read')
  listBalances(@Query() query: ListStockBalancesQueryDto) {
    return this.listStockBalances.execute(query);
  }

  @Get('balances/:productId/:locationId')
  @RequirePermissions('stock:read')
  getBalance(
    @Param('productId') productId: string,
    @Param('locationId') locationId: string,
  ) {
    return this.getStockBalance.execute(productId, locationId);
  }

  @Get('movements')
  @RequirePermissions('stock:read')
  listMovements(@Query() query: ListStockMovementsQueryDto) {
    return this.listStockMovements.execute(query);
  }

  @Post('adjustments')
  @RequirePermissions('stock:write')
  async createAdjustment(
    @Body() dto: CreateAdjustmentDto,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @CurrentUser() user: RequestUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.recordAdjustment.execute({
      productId: dto.productId,
      locationId: dto.locationId,
      quantityDelta: dto.quantityDelta,
      reasonCode: dto.reasonCode,
      note: dto.note,
      createdByUserId: user.userId,
      idempotencyKey: idempotencyKey ?? '',
    });
    res.status(result.replayed ? 200 : 201);
    return result.movement;
  }
}
