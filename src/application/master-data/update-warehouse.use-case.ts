import { Inject, Injectable } from '@nestjs/common';
import {
  WarehouseHasActiveLocationsError,
  WarehouseNotFoundError,
} from '../../domain/master-data/master-data.errors';
import {
  WAREHOUSE_REPOSITORY,
  type WarehouseRepositoryPort,
} from './ports/warehouse.repository.port';

export type UpdateWarehouseInput = {
  id: string;
  name?: string;
  address?: string | null;
  isActive?: boolean;
};

@Injectable()
export class UpdateWarehouseUseCase {
  constructor(
    @Inject(WAREHOUSE_REPOSITORY)
    private readonly warehouses: WarehouseRepositoryPort,
  ) {}

  async execute(input: UpdateWarehouseInput) {
    const existing = await this.warehouses.findById(input.id);
    if (!existing) {
      throw new WarehouseNotFoundError();
    }

    if (input.isActive === false) {
      const activeLocations = await this.warehouses.countActiveLocations(
        input.id,
      );
      if (activeLocations > 0) {
        throw new WarehouseHasActiveLocationsError();
      }
    }

    return this.warehouses.update(input.id, {
      name: input.name?.trim(),
      address:
        input.address === undefined ? undefined : input.address?.trim() || null,
      isActive: input.isActive,
    });
  }
}
