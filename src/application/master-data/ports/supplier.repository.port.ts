import { Supplier } from '../../../domain/master-data/supplier';

export const SUPPLIER_REPOSITORY = Symbol('SUPPLIER_REPOSITORY');

export type SupplierListQuery = {
  page: number;
  pageSize: number;
  search?: string;
  isActive?: boolean;
  sort?: string;
};

export type SupplierCreateInput = {
  code: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
};

export type SupplierUpdateInput = {
  name?: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  isActive?: boolean;
};

export interface SupplierRepositoryPort {
  findById(id: string): Promise<Supplier | null>;
  findByCode(code: string): Promise<Supplier | null>;
  list(query: SupplierListQuery): Promise<{ items: Supplier[]; total: number }>;
  create(input: SupplierCreateInput): Promise<Supplier>;
  update(id: string, input: SupplierUpdateInput): Promise<Supplier>;
}
