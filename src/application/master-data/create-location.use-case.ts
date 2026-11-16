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
  ) {}

  async execute(input: CreateLocationInput) {
    const code = requireTrimmedNonEmpty(input.code, 'code').toUpperCase();
    const name = requireTrimmedNonEmpty(input.name, 'name');
    const parentLocationId =
      normalizeOptionalParentId(input.parentLocationId) ?? null;

    const duplicate = await this.locations.findByWarehouseAndCode(
      input.warehouseId,
      code,
    );
    if (duplicate) {
      throw new LocationCodeTakenError();
    }

    const result = await this.locations.createUnderActiveWarehouse({
      warehouseId: input.warehouseId,
      code,
      name,
      parentLocationId,
    });

    if (!result.ok) {
      if (result.reason === 'warehouse_not_found') {
        throw new WarehouseNotFoundError();
      }
      if (result.reason === 'warehouse_inactive') {
        throw new WarehouseInactiveError();
      }
      throw new LocationParentInvalidError();
    }
    return result.location;
  }
}
