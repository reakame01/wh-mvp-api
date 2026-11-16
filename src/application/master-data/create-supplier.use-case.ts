import { Inject, Injectable } from '@nestjs/common';
import { SupplierCodeTakenError } from '../../domain/master-data/master-data.errors';
import {
  normalizeOptionalString,
  requireTrimmedNonEmpty,
} from '../../domain/master-data/normalize';
import {
  SUPPLIER_REPOSITORY,
  type SupplierRepositoryPort,
} from './ports/supplier.repository.port';

export type CreateSupplierInput = {
  code: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
};

@Injectable()
export class CreateSupplierUseCase {
  constructor(
    @Inject(SUPPLIER_REPOSITORY)
    private readonly suppliers: SupplierRepositoryPort,
  ) {}

  async execute(input: CreateSupplierInput) {
    const code = requireTrimmedNonEmpty(input.code, 'code').toUpperCase();
    const name = requireTrimmedNonEmpty(input.name, 'name');
    const existing = await this.suppliers.findByCode(code);
    if (existing) {
      throw new SupplierCodeTakenError();
    }
    return this.suppliers.create({
      code,
      name,
      email: optionalField(input.email),
      phone: optionalField(input.phone),
      address: optionalField(input.address),
    });
  }
}

function optionalField(value: string | null | undefined): string | null {
  const normalized = normalizeOptionalString(value);
  return normalized === undefined ? null : normalized;
}
