import { Inject, Injectable } from '@nestjs/common';
import { WarehouseNotFoundError } from '../../domain/master-data/master-data.errors';
import {
  WAREHOUSE_REPOSITORY,
  type WarehouseRepositoryPort,
} from './ports/warehouse.repository.port';

@Injectable()
export class GetWarehouseUseCase {
  constructor(
    @Inject(WAREHOUSE_REPOSITORY)
    private readonly warehouses: WarehouseRepositoryPort,
  ) {}

  async execute(id: string) {
    const warehouse = await this.warehouses.findById(id);
    if (!warehouse) {
      throw new WarehouseNotFoundError();
    }
    return warehouse;
  }
}
