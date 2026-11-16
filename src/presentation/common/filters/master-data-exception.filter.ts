import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { MasterDataError } from '../../../domain/master-data/master-data.errors';

const STATUS_BY_CODE: Record<string, number> = {
  WAREHOUSE_NOT_FOUND: HttpStatus.NOT_FOUND,
  WAREHOUSE_CODE_TAKEN: HttpStatus.CONFLICT,
  WAREHOUSE_HAS_ACTIVE_LOCATIONS: HttpStatus.CONFLICT,
  WAREHOUSE_INACTIVE: HttpStatus.CONFLICT,
  MASTER_DATA_INVALID_INPUT: HttpStatus.BAD_REQUEST,
  LOCATION_NOT_FOUND: HttpStatus.NOT_FOUND,
  LOCATION_CODE_TAKEN: HttpStatus.CONFLICT,
  LOCATION_PARENT_INVALID: HttpStatus.BAD_REQUEST,
  LOCATION_CYCLE: HttpStatus.BAD_REQUEST,
};

@Catch(MasterDataError)
export class MasterDataExceptionFilter implements ExceptionFilter {
  catch(exception: MasterDataError, host: ArgumentsHost): void {
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
