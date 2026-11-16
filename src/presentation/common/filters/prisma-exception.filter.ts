import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

type UniqueConflictCode =
  | 'LOCATION_CODE_TAKEN'
  | 'WAREHOUSE_CODE_TAKEN'
  | 'CATEGORY_CODE_TAKEN'
  | 'SUPPLIER_CODE_TAKEN'
  | 'PRODUCT_SKU_TAKEN'
  | 'PRODUCT_BARCODE_TAKEN'
  | 'CONFLICT';

const UNIQUE_MESSAGES: Record<UniqueConflictCode, string> = {
  LOCATION_CODE_TAKEN: 'Location code is already in use in this warehouse',
  WAREHOUSE_CODE_TAKEN: 'Warehouse code is already in use',
  CATEGORY_CODE_TAKEN: 'Category code is already in use',
  SUPPLIER_CODE_TAKEN: 'Supplier code is already in use',
  PRODUCT_SKU_TAKEN: 'Product SKU is already in use',
  PRODUCT_BARCODE_TAKEN: 'Product barcode is already in use',
  CONFLICT: 'Unique constraint violated',
};

function uniqueConflictCode(
  target: string[] | string | undefined,
  modelName: unknown,
): UniqueConflictCode {
  const parts = Array.isArray(target)
    ? target
    : typeof target === 'string'
      ? [target]
      : [];
  const joined = parts.join(',').toLowerCase();
  const model =
    typeof modelName === 'string' ? modelName.toLowerCase() : undefined;

  // Prisma may report camelCase (warehouseId) or snake_case (warehouse_id).
  if (
    parts.some((p) => /warehouse[_]?id/i.test(p)) ||
    /warehouse[_]?id/.test(joined)
  ) {
    return 'LOCATION_CODE_TAKEN';
  }

  if (parts.includes('sku') || /(^|,)sku(,|$)/.test(joined)) {
    return 'PRODUCT_SKU_TAKEN';
  }
  if (parts.includes('barcode') || /(^|,)barcode(,|$)/.test(joined)) {
    return 'PRODUCT_BARCODE_TAKEN';
  }

  if (parts.includes('code') || /(^|,)code(,|$)/.test(joined)) {
    if (model === 'category') {
      return 'CATEGORY_CODE_TAKEN';
    }
    if (model === 'supplier') {
      return 'SUPPLIER_CODE_TAKEN';
    }
    if (model === 'warehouse' || model === undefined) {
      return 'WAREHOUSE_CODE_TAKEN';
    }
    if (model === 'location') {
      return 'LOCATION_CODE_TAKEN';
    }
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
        exception.meta?.modelName,
      );
      response.status(HttpStatus.CONFLICT).json({
        code,
        message: UNIQUE_MESSAGES[code],
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
      if (field.includes('category')) {
        response.status(HttpStatus.NOT_FOUND).json({
          code: 'CATEGORY_NOT_FOUND',
          message: 'Category not found',
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
