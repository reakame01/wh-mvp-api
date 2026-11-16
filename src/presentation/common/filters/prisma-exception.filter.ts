import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

function uniqueConflictCode(
  target: string[] | string | undefined,
): 'LOCATION_CODE_TAKEN' | 'WAREHOUSE_CODE_TAKEN' | 'CONFLICT' {
  const parts = Array.isArray(target)
    ? target
    : typeof target === 'string'
      ? [target]
      : [];
  const joined = parts.join(',').toLowerCase();
  // Prisma may report camelCase (warehouseId) or snake_case (warehouse_id).
  if (
    parts.some((p) => /warehouse[_]?id/i.test(p)) ||
    /warehouse[_]?id/.test(joined)
  ) {
    return 'LOCATION_CODE_TAKEN';
  }
  if (parts.includes('code') || /(^|,)code(,|$)/.test(joined)) {
    return 'WAREHOUSE_CODE_TAKEN';
  }
  return 'CONFLICT';
}

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(
    exception: Prisma.PrismaClientKnownRequestError,
    host: ArgumentsHost,
  ): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception.code === 'P2002') {
      const code = uniqueConflictCode(
        exception.meta?.target as string[] | string | undefined,
      );
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
      const rawField = exception.meta?.field_name ?? exception.meta?.fieldName;
      const field = typeof rawField === 'string' ? rawField.toLowerCase() : '';
      if (field.includes('parent')) {
        response.status(HttpStatus.BAD_REQUEST).json({
          code: 'LOCATION_PARENT_INVALID',
          message: 'Parent location is invalid for this warehouse',
        });
        return;
      }
      if (field.includes('warehouse')) {
        response.status(HttpStatus.NOT_FOUND).json({
          code: 'WAREHOUSE_NOT_FOUND',
          message: 'Warehouse not found',
        });
        return;
      }
      response.status(HttpStatus.BAD_REQUEST).json({
        code: 'MASTER_DATA_INVALID_INPUT',
        message: 'Invalid foreign key reference',
      });
      return;
    }

    if (exception.code === 'P2034') {
      response.status(HttpStatus.CONFLICT).json({
        code: 'CONCURRENCY_CONFLICT',
        message: 'Concurrent update conflict; retry the request',
      });
      return;
    }

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_ERROR',
      message: 'Unexpected database error',
    });
  }
}
