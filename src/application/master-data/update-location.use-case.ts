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
  ) {}

  async execute(input: UpdateLocationInput) {
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
        if (result.reason === 'warehouse_not_found') {
          throw new WarehouseNotFoundError();
        }
        if (result.reason === 'warehouse_inactive') {
          throw new WarehouseInactiveError();
        }
        if (result.reason === 'cycle') {
          throw new LocationCycleError();
        }
        throw new LocationParentInvalidError();
      }
      return result.location;
    }

    const result = await this.locations.updateWithWarehouseLock(
      input.id,
      fields,
    );
    if (!result.ok) {
      if (result.reason === 'not_found') {
        throw new LocationNotFoundError();
      }
      if (result.reason === 'warehouse_not_found') {
        throw new WarehouseNotFoundError();
      }
      throw new WarehouseInactiveError();
    }
    return result.location;
  }
}
