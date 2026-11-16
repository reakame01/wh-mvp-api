import { Inject, Injectable } from '@nestjs/common';
import { SupplierNotFoundError } from '../../domain/master-data/master-data.errors';
import {
  SUPPLIER_REPOSITORY,
  type SupplierRepositoryPort,
} from './ports/supplier.repository.port';

@Injectable()
export class GetSupplierUseCase {
  constructor(
    @Inject(SUPPLIER_REPOSITORY)
    private readonly suppliers: SupplierRepositoryPort,
  ) {}

  async execute(id: string) {
    const supplier = await this.suppliers.findById(id);
    if (!supplier) {
      throw new SupplierNotFoundError();
    }
    return supplier;
  }
}
