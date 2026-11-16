import { Inject, Injectable } from '@nestjs/common';
import {
  WarehouseHasActiveLocationsError,
  WarehouseNotFoundError,
} from '../../domain/master-data/master-data.errors';
import { requireTrimmedNonEmpty } from '../../domain/master-data/normalize';
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
    const name =
      input.name !== undefined
        ? requireTrimmedNonEmpty(input.name, 'name')
        : undefined;
    const address =
      input.address === undefined ? undefined : input.address?.trim() || null;

    if (input.isActive === false) {
      const result = await this.warehouses.deactivateIfNoActiveLocations(
        input.id,
        { name, address },
      );
      if (!result.ok) {
        if (result.reason === 'not_found') {
          throw new WarehouseNotFoundError();
        }
        throw new WarehouseHasActiveLocationsError();
      }
      return result.warehouse;
    }

    const existing = await this.warehouses.findById(input.id);
    if (!existing) {
      throw new WarehouseNotFoundError();
    }

    return this.warehouses.update(input.id, {
      name,
      address,
      isActive: input.isActive,
    });
  }
}
