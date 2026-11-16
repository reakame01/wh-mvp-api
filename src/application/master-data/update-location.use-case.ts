import { Inject, Injectable } from '@nestjs/common';
import {
  LocationCycleError,
  LocationNotFoundError,
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

export type UpdateLocationInput = {
  id: string;
  name?: string;
  parentLocationId?: string | null;
  isActive?: boolean;
};

@Injectable()
export class UpdateLocationUseCase {
  constructor(
    @Inject(LOCATION_REPOSITORY)
    private readonly locations: LocationRepositoryPort,
    @Inject(WAREHOUSE_REPOSITORY)
    private readonly warehouses: WarehouseRepositoryPort,
  ) {}

  async execute(input: UpdateLocationInput) {
    const existing = await this.locations.findById(input.id);
    if (!existing) {
      throw new LocationNotFoundError();
    }

    const warehouse = await this.warehouses.findById(existing.warehouseId);
    if (!warehouse) {
      throw new WarehouseNotFoundError();
    }

    const willBeActive =
      input.isActive !== undefined ? input.isActive : existing.isActive;
    if (willBeActive && !warehouse.isActive) {
      throw new WarehouseInactiveError();
    }

    const fields = {
      name:
        input.name !== undefined
          ? requireTrimmedNonEmpty(input.name, 'name')
          : undefined,
      isActive: input.isActive,
    };

    if (input.parentLocationId !== undefined) {
      const parentLocationId =
        normalizeOptionalParentId(input.parentLocationId) ?? null;
      const result = await this.locations.reparentWithLock(
        input.id,
        parentLocationId,
        fields,
      );
      if (!result.ok) {
        if (result.reason === 'not_found') {
          throw new LocationNotFoundError();
        }
        if (result.reason === 'cycle') {
          throw new LocationCycleError();
        }
        throw new LocationParentInvalidError();
      }
      return result.location;
    }

    return this.locations.update(input.id, fields);
  }
}
