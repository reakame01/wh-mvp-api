import { ArgumentsHost, HttpStatus } from '@nestjs/common';
import {
  CategoryHasActiveProductsError,
  MasterDataError,
  ProductSkuTakenError,
  WarehouseNotFoundError,
} from '../../../domain/master-data/master-data.errors';
import { MasterDataExceptionFilter } from './master-data-exception.filter';

describe('MasterDataExceptionFilter', () => {
  const filter = new MasterDataExceptionFilter();

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

  it('maps known codes to HTTP status', () => {
    const { host, status, json } = hostWithResponse();
    filter.catch(new WarehouseNotFoundError(), host);
    expect(status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'WAREHOUSE_NOT_FOUND' }),
    );

    filter.catch(new ProductSkuTakenError(), host);
    expect(status).toHaveBeenCalledWith(HttpStatus.CONFLICT);

    filter.catch(new CategoryHasActiveProductsError(), host);
    expect(status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
  });

  it('falls back to 500 for unknown master-data codes', () => {
    const { host, status } = hostWithResponse();
    filter.catch(new MasterDataError('WEIRD', 'weird'), host);
    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
  });
});
