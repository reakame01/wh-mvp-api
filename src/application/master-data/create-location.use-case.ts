import { Inject, Injectable } from '@nestjs/common';
import {
  LocationCodeTakenError,
  LocationParentInvalidError,
  WarehouseInactiveError,
  WarehouseNotFoundError,
} from '../../domain/master-data/master-data.errors';
import {
  normalizeOptionalParentId,
  requireTrimmedNonEmpty,
} from '../../domain/master-data/normalize';
import {
  LOCATION_REPOSITORY,
  type LocationRepositoryPort,
} from './ports/location.repository.port';
import {
  WAREHOUSE_REPOSITORY,
  type WarehouseRepositoryPort,
} from './ports/warehouse.repository.port';

export type CreateLocationInput = {
  warehouseId: string;
  code: string;
  name: string;
  parentLocationId?: string | null;
};

@Injectable()
export class CreateLocationUseCase {
  constructor(
    @Inject(LOCATION_REPOSITORY)
    private readonly locations: LocationRepositoryPort,
    @Inject(WAREHOUSE_REPOSITORY)
    private readonly warehouses: WarehouseRepositoryPort,
  ) {}

  async execute(input: CreateLocationInput) {
    const warehouse = await this.warehouses.findById(input.warehouseId);
    if (!warehouse) {
      throw new WarehouseNotFoundError();
    }
    if (!warehouse.isActive) {
      throw new WarehouseInactiveError();
    }

    const code = requireTrimmedNonEmpty(input.code, 'code').toUpperCase();
    const name = requireTrimmedNonEmpty(input.name, 'name');
    const duplicate = await this.locations.findByWarehouseAndCode(
      input.warehouseId,
      code,
    );
    if (duplicate) {
      throw new LocationCodeTakenError();
    }

    const parentLocationId =
      normalizeOptionalParentId(input.parentLocationId) ?? null;
    if (parentLocationId) {
      const parent = await this.locations.findById(parentLocationId);
      if (
        !parent ||
        parent.warehouseId !== input.warehouseId ||
        !parent.isActive
      ) {
        throw new LocationParentInvalidError();
      }
    }

    return this.locations.create({
      warehouseId: input.warehouseId,
      code,
      name,
      parentLocationId,
    });
  }
}
