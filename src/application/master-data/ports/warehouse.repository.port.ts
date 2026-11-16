import { Warehouse } from '../../../domain/master-data/warehouse';

export const WAREHOUSE_REPOSITORY = Symbol('WAREHOUSE_REPOSITORY');

export type WarehouseListQuery = {
  page: number;
  pageSize: number;
  search?: string;
  isActive?: boolean;
  sort?: string;
};

export type WarehouseCreateInput = {
  code: string;
  name: string;
  address?: string | null;
};

export type WarehouseUpdateInput = {
  name?: string;
  address?: string | null;
  isActive?: boolean;
};

export type DeactivateWarehouseResult =
  | { ok: true; warehouse: Warehouse }
  | { ok: false; reason: 'not_found' | 'has_active_locations' };

export interface WarehouseRepositoryPort {
  findById(id: string): Promise<Warehouse | null>;
  findByCode(code: string): Promise<Warehouse | null>;
  list(
    query: WarehouseListQuery,
  ): Promise<{ items: Warehouse[]; total: number }>;
  create(input: WarehouseCreateInput): Promise<Warehouse>;
  update(id: string, input: WarehouseUpdateInput): Promise<Warehouse>;
  countActiveLocations(warehouseId: string): Promise<number>;
  /**
   * Locks warehouse + all its locations (ordered), then sets isActive=false
   * and optional name/address in the same UPDATE.
   */
  deactivateIfNoActiveLocations(
    id: string,
    fields?: { name?: string; address?: string | null },
  ): Promise<DeactivateWarehouseResult>;
}
