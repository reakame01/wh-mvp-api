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
