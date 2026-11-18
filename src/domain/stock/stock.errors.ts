export class StockError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'StockError';
  }
}

export class InvalidStockInputError extends StockError {
  constructor(message = 'Invalid stock input') {
    super('STOCK_INVALID_INPUT', message);
  }
}

export class StockInsufficientError extends StockError {
  constructor() {
    super(
      'STOCK_INSUFFICIENT',
      'Adjustment would make on-hand quantity negative',
    );
  }
}

export class StockBalanceNotFoundError extends StockError {
  constructor() {
    super('STOCK_BALANCE_NOT_FOUND', 'Stock balance not found');
  }
}

export class ProductInactiveForStockError extends StockError {
  constructor() {
    super('PRODUCT_INACTIVE', 'Cannot adjust stock for an inactive product');
  }
}

export class LocationInactiveForStockError extends StockError {
  constructor() {
    super('LOCATION_INACTIVE', 'Cannot adjust stock for an inactive location');
  }
}
