import { Inject, Injectable } from '@nestjs/common';
import { wouldCreateLocationCycle } from '../../domain/master-data/location-tree';
import {
  LocationCycleError,
  LocationNotFoundError,
  LocationParentInvalidError,
} from '../../domain/master-data/master-data.errors';
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
    const existing = await this.locations.findById(input.id);
    if (!existing) {
      throw new LocationNotFoundError();
    }

    const parentLocationId = input.parentLocationId;
    if (parentLocationId !== undefined) {
      if (parentLocationId === null) {
        // clear parent
      } else {
        const parent = await this.locations.findById(parentLocationId);
        if (!parent || parent.warehouseId !== existing.warehouseId) {
          throw new LocationParentInvalidError();
        }
        const parentMap = await this.locations.parentMapForWarehouse(
          existing.warehouseId,
        );
        if (
          wouldCreateLocationCycle(existing.id, parentLocationId, parentMap)
        ) {
          throw new LocationCycleError();
        }
      }
    }

    return this.locations.update(input.id, {
      name: input.name?.trim(),
      parentLocationId,
      isActive: input.isActive,
    });
  }
}
