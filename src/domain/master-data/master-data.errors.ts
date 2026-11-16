export class MasterDataError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'MasterDataError';
  }
}

export class WarehouseNotFoundError extends MasterDataError {
  constructor() {
    super('WAREHOUSE_NOT_FOUND', 'Warehouse not found');
  }
}

export class WarehouseCodeTakenError extends MasterDataError {
  constructor() {
    super('WAREHOUSE_CODE_TAKEN', 'Warehouse code is already in use');
  }
}

export class WarehouseHasActiveLocationsError extends MasterDataError {
  constructor() {
    super(
      'WAREHOUSE_HAS_ACTIVE_LOCATIONS',
      'Cannot deactivate warehouse while active locations exist',
    );
  }
}

export class WarehouseInactiveError extends MasterDataError {
  constructor() {
    super(
      'WAREHOUSE_INACTIVE',
      'Cannot create or activate locations under an inactive warehouse',
    );
  }
}

export class InvalidMasterDataInputError extends MasterDataError {
  constructor(message = 'Invalid master data input') {
    super('MASTER_DATA_INVALID_INPUT', message);
  }
}

export class LocationNotFoundError extends MasterDataError {
  constructor() {
    super('LOCATION_NOT_FOUND', 'Location not found');
  }
}

export class LocationCodeTakenError extends MasterDataError {
  constructor() {
    super(
      'LOCATION_CODE_TAKEN',
      'Location code is already in use in this warehouse',
    );
  }
}

export class LocationParentInvalidError extends MasterDataError {
  constructor(message = 'Parent location is invalid for this warehouse') {
    super('LOCATION_PARENT_INVALID', message);
  }
}

export class LocationCycleError extends MasterDataError {
  constructor() {
    super('LOCATION_CYCLE', 'Location parent would create a cycle');
  }
}

export class CategoryNotFoundError extends MasterDataError {
  constructor() {
    super('CATEGORY_NOT_FOUND', 'Category not found');
  }
}

export class CategoryCodeTakenError extends MasterDataError {
  constructor() {
    super('CATEGORY_CODE_TAKEN', 'Category code is already in use');
  }
}

export class CategoryHasActiveProductsError extends MasterDataError {
  constructor() {
    super(
      'CATEGORY_HAS_ACTIVE_PRODUCTS',
      'Cannot deactivate category while active products exist',
    );
  }
}

export class CategoryInactiveError extends MasterDataError {
  constructor() {
    super(
      'CATEGORY_INACTIVE',
      'Cannot create or activate products under an inactive category',
    );
  }
}

export class SupplierNotFoundError extends MasterDataError {
  constructor() {
    super('SUPPLIER_NOT_FOUND', 'Supplier not found');
  }
}

export class SupplierCodeTakenError extends MasterDataError {
  constructor() {
    super('SUPPLIER_CODE_TAKEN', 'Supplier code is already in use');
  }
}

export class ProductNotFoundError extends MasterDataError {
  constructor() {
    super('PRODUCT_NOT_FOUND', 'Product not found');
  }
}

export class ProductSkuTakenError extends MasterDataError {
  constructor() {
    super('PRODUCT_SKU_TAKEN', 'Product SKU is already in use');
  }
}

export class ProductBarcodeTakenError extends MasterDataError {
  constructor() {
    super('PRODUCT_BARCODE_TAKEN', 'Product barcode is already in use');
  }
}
