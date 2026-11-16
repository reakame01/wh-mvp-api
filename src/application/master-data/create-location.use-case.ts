import { Inject, Injectable } from '@nestjs/common';
import {
  LocationCodeTakenError,
  LocationParentInvalidError,
  WarehouseNotFoundError,
} from '../../domain/master-data/master-data.errors';
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

    const code = input.code.trim().toUpperCase();
    const name = input.name.trim();
    const duplicate = await this.locations.findByWarehouseAndCode(
      input.warehouseId,
      code,
    );
    if (duplicate) {
      throw new LocationCodeTakenError();
    }

    const parentLocationId = input.parentLocationId ?? null;
    if (parentLocationId) {
      const parent = await this.locations.findById(parentLocationId);
      if (!parent || parent.warehouseId !== input.warehouseId) {
        throw new LocationParentInvalidError();
      }
      // New node cannot cycle yet (no self id), but parent must exist — OK
    }

    return this.locations.create({
      warehouseId: input.warehouseId,
      code,
      name,
      parentLocationId,
    });
  }
}
