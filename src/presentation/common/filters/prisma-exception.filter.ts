import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(
    exception: Prisma.PrismaClientKnownRequestError,
    host: ArgumentsHost,
  ): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception.code === 'P2002') {
      const target =
        (exception.meta?.target as string[] | string | undefined) ?? [];
      const fields = Array.isArray(target) ? target.join(',') : String(target);
      const code = fields.includes('warehouse_id')
        ? 'LOCATION_CODE_TAKEN'
        : fields.includes('code')
          ? 'WAREHOUSE_CODE_TAKEN'
          : 'CONFLICT';
      response.status(HttpStatus.CONFLICT).json({
        code,
        message:
          code === 'LOCATION_CODE_TAKEN'
            ? 'Location code is already in use in this warehouse'
            : code === 'WAREHOUSE_CODE_TAKEN'
              ? 'Warehouse code is already in use'
              : 'Unique constraint violated',
      });
      return;
    }

    if (exception.code === 'P2003') {
      response.status(HttpStatus.BAD_REQUEST).json({
        code: 'LOCATION_PARENT_INVALID',
        message: 'Parent location is invalid for this warehouse',
      });
      return;
    }

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_ERROR',
      message: 'Unexpected database error',
    });
  }
}
