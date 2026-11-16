import { Inject, Injectable } from '@nestjs/common';
import { SupplierNotFoundError } from '../../domain/master-data/master-data.errors';
import {
  normalizeOptionalString,
  requireTrimmedNonEmpty,
} from '../../domain/master-data/normalize';
import {
  SUPPLIER_REPOSITORY,
  type SupplierRepositoryPort,
} from './ports/supplier.repository.port';

export type UpdateSupplierInput = {
  id: string;
  name?: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  isActive?: boolean;
};

@Injectable()
export class UpdateSupplierUseCase {
  constructor(
    @Inject(SUPPLIER_REPOSITORY)
    private readonly suppliers: SupplierRepositoryPort,
  ) {}

  async execute(input: UpdateSupplierInput) {
    const existing = await this.suppliers.findById(input.id);
    if (!existing) {
      throw new SupplierNotFoundError();
    }

    const name =
      input.name !== undefined
        ? requireTrimmedNonEmpty(input.name, 'name')
        : undefined;

    return this.suppliers.update(input.id, {
      name,
      email: fieldOrUndefined(input.email),
      phone: fieldOrUndefined(input.phone),
      address: fieldOrUndefined(input.address),
      isActive: input.isActive,
    });
  }
}

function fieldOrUndefined(
  value: string | null | undefined,
): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }
  return normalizeOptionalString(value) ?? null;
}
