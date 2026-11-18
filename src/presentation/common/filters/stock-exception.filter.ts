import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { StockError } from '../../../domain/stock/stock.errors';

const STATUS_BY_CODE: Record<string, number> = {
  STOCK_INVALID_INPUT: HttpStatus.BAD_REQUEST,
  STOCK_INSUFFICIENT: HttpStatus.CONFLICT,
  STOCK_BALANCE_NOT_FOUND: HttpStatus.NOT_FOUND,
  PRODUCT_INACTIVE: HttpStatus.CONFLICT,
  LOCATION_INACTIVE: HttpStatus.CONFLICT,
  STOCK_MOVEMENT_IMMUTABLE: HttpStatus.INTERNAL_SERVER_ERROR,
};

@Catch(StockError)
export class StockExceptionFilter implements ExceptionFilter {
  catch(exception: StockError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status =
      STATUS_BY_CODE[exception.code] ?? HttpStatus.INTERNAL_SERVER_ERROR;
    response.status(status).json({
      code: exception.code,
      message: exception.message,
    });
  }
}
