import {
  Body,
  Controller,
  Headers,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { RecordAdjustmentUseCase } from '../../application/stock/record-adjustment.use-case';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { RequestUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { CreateAdjustmentDto } from './dto/create-adjustment.dto';

@Controller('stock')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class StockController {
  constructor(private readonly recordAdjustment: RecordAdjustmentUseCase) {}

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
