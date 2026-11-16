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
});
