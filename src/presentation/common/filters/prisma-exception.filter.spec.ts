import { ArgumentsHost, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaExceptionFilter } from './prisma-exception.filter';

describe('PrismaExceptionFilter', () => {
  const filter = new PrismaExceptionFilter();

  function hostWithResponse() {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const host = {
      switchToHttp: () => ({
        getResponse: () => ({ status }),
      }),
    } as unknown as ArgumentsHost;
    return { host, status, json };
  }

  it('maps P2002 warehouse code to 409 WAREHOUSE_CODE_TAKEN', () => {
    const { host, status, json } = hostWithResponse();
    const error = new Prisma.PrismaClientKnownRequestError('Unique', {
      code: 'P2002',
      clientVersion: 'test',
      meta: { target: ['code'] },
    });
    filter.catch(error, host);
    expect(status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'WAREHOUSE_CODE_TAKEN' }),
    );
  });

  it('maps P2002 camelCase warehouseId+code to LOCATION_CODE_TAKEN', () => {
    const { host, status, json } = hostWithResponse();
    const error = new Prisma.PrismaClientKnownRequestError('Unique', {
      code: 'P2002',
      clientVersion: 'test',
      meta: { target: ['warehouseId', 'code'] },
    });
    filter.catch(error, host);
    expect(status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'LOCATION_CODE_TAKEN' }),
    );
  });

  it('maps P2002 snake_case warehouse_id+code to LOCATION_CODE_TAKEN', () => {
    const { host, json } = hostWithResponse();
    const error = new Prisma.PrismaClientKnownRequestError('Unique', {
      code: 'P2002',
      clientVersion: 'test',
      meta: { target: ['warehouse_id', 'code'] },
    });
    filter.catch(error, host);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'LOCATION_CODE_TAKEN' }),
    );
  });

  it('maps parent FK P2003 to LOCATION_PARENT_INVALID', () => {
    const { host, status, json } = hostWithResponse();
    const error = new Prisma.PrismaClientKnownRequestError('FK', {
      code: 'P2003',
      clientVersion: 'test',
      meta: { field_name: 'parent_location_id' },
    });
    filter.catch(error, host);
    expect(status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'LOCATION_PARENT_INVALID' }),
    );
  });

  it('maps deadlock P2034 to CONCURRENCY_CONFLICT', () => {
    const { host, status, json } = hostWithResponse();
    const error = new Prisma.PrismaClientKnownRequestError('Deadlock', {
      code: 'P2034',
      clientVersion: 'test',
    });
    filter.catch(error, host);
    expect(status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'CONCURRENCY_CONFLICT' }),
    );
  });

  it('maps P2002 category code via modelName', () => {
    const { host, json } = hostWithResponse();
    const error = new Prisma.PrismaClientKnownRequestError('Unique', {
      code: 'P2002',
      clientVersion: 'test',
      meta: { modelName: 'Category', target: ['code'] },
    });
    filter.catch(error, host);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'CATEGORY_CODE_TAKEN' }),
    );
  });

  it('maps P2002 product sku to PRODUCT_SKU_TAKEN', () => {
    const { host, json } = hostWithResponse();
    const error = new Prisma.PrismaClientKnownRequestError('Unique', {
      code: 'P2002',
      clientVersion: 'test',
      meta: { modelName: 'Product', target: ['sku'] },
    });
    filter.catch(error, host);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'PRODUCT_SKU_TAKEN' }),
    );
  });

  it('maps category FK P2003 to CATEGORY_NOT_FOUND', () => {
    const { host, status, json } = hostWithResponse();
    const error = new Prisma.PrismaClientKnownRequestError('FK', {
      code: 'P2003',
      clientVersion: 'test',
      meta: { field_name: 'products_category_id_fkey (index)' },
    });
    filter.catch(error, host);
    expect(status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'CATEGORY_NOT_FOUND' }),
    );
  });

  it('maps P2002 barcode and supplier code', () => {
    const { host, json } = hostWithResponse();
    filter.catch(
      new Prisma.PrismaClientKnownRequestError('Unique', {
        code: 'P2002',
        clientVersion: 'test',
        meta: { modelName: 'Product', target: ['barcode'] },
      }),
      host,
    );
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'PRODUCT_BARCODE_TAKEN' }),
    );

    filter.catch(
      new Prisma.PrismaClientKnownRequestError('Unique', {
        code: 'P2002',
        clientVersion: 'test',
        meta: { modelName: 'Supplier', target: ['code'] },
      }),
      host,
    );
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'SUPPLIER_CODE_TAKEN' }),
    );
  });

  it('maps warehouse FK P2003 and generic FK / unknown codes', () => {
    const { host, status, json } = hostWithResponse();
    filter.catch(
      new Prisma.PrismaClientKnownRequestError('FK', {
        code: 'P2003',
        clientVersion: 'test',
        meta: { fieldName: 'warehouseId' },
      }),
      host,
    );
    expect(status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'WAREHOUSE_NOT_FOUND' }),
    );

    filter.catch(
      new Prisma.PrismaClientKnownRequestError('FK', {
        code: 'P2003',
        clientVersion: 'test',
        meta: { field_name: 'some_other_fk' },
      }),
      host,
    );
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'MASTER_DATA_INVALID_INPUT' }),
    );

    filter.catch(
      new Prisma.PrismaClientKnownRequestError('Other', {
        code: 'P9999',
        clientVersion: 'test',
      }),
      host,
    );
    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
  });
});
