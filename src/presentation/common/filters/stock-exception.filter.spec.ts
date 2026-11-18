import { ArgumentsHost, HttpStatus } from '@nestjs/common';
import {
  InvalidStockInputError,
  StockInsufficientError,
} from '../../../domain/stock/stock.errors';
import { StockExceptionFilter } from './stock-exception.filter';

describe('StockExceptionFilter', () => {
  const filter = new StockExceptionFilter();

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

  it('maps invalid input to 400 and insufficient to 409', () => {
    const { host, status, json } = hostWithResponse();
    filter.catch(new InvalidStockInputError('bad'), host);
    expect(status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'STOCK_INVALID_INPUT' }),
    );

    filter.catch(new StockInsufficientError(), host);
    expect(status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
  });
});
