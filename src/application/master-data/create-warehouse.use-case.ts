import { Inject, Injectable } from '@nestjs/common';
import { WarehouseCodeTakenError } from '../../domain/master-data/master-data.errors';
import {
  WAREHOUSE_REPOSITORY,
  type WarehouseRepositoryPort,
} from './ports/warehouse.repository.port';

export type CreateWarehouseInput = {
  code: string;
  name: string;
  address?: string | null;
};

@Injectable()
export class CreateWarehouseUseCase {
  constructor(
    @Inject(WAREHOUSE_REPOSITORY)
    private readonly warehouses: WarehouseRepositoryPort,
  ) {}

  async execute(input: CreateWarehouseInput) {
    const code = input.code.trim().toUpperCase();
    const name = input.name.trim();
    const existing = await this.warehouses.findByCode(code);
    if (existing) {
      throw new WarehouseCodeTakenError();
    }
    return this.warehouses.create({
      code,
      name,
      address: input.address?.trim() || null,
    });
  }
}
