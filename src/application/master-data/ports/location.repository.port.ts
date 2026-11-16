import { Location } from '../../../domain/master-data/location';

export const LOCATION_REPOSITORY = Symbol('LOCATION_REPOSITORY');

export type LocationListQuery = {
  page: number;
  pageSize: number;
  warehouseId?: string;
  search?: string;
  isActive?: boolean;
  sort?: string;
};

export type LocationCreateInput = {
  warehouseId: string;
  code: string;
  name: string;
  parentLocationId?: string | null;
};

export type LocationUpdateInput = {
  name?: string;
  parentLocationId?: string | null;
  isActive?: boolean;
};

export type CreateLocationResult =
  | { ok: true; location: Location }
  | {
      ok: false;
      reason: 'warehouse_not_found' | 'warehouse_inactive' | 'parent_invalid';
    };

export type UpdateLocationLockedResult =
  | { ok: true; location: Location }
  | {
      ok: false;
      reason: 'not_found' | 'warehouse_not_found' | 'warehouse_inactive';
    };

export type ReparentLocationResult =
  | { ok: true; location: Location }
  | {
      ok: false;
      reason:
        | 'not_found'
        | 'parent_invalid'
        | 'cycle'
        | 'warehouse_not_found'
        | 'warehouse_inactive';
    };

export interface LocationRepositoryPort {
  findById(id: string): Promise<Location | null>;
  findByWarehouseAndCode(
    warehouseId: string,
    code: string,
  ): Promise<Location | null>;
  list(query: LocationListQuery): Promise<{ items: Location[]; total: number }>;
  create(input: LocationCreateInput): Promise<Location>;
  update(id: string, input: LocationUpdateInput): Promise<Location>;
  parentMapForWarehouse(
    warehouseId: string,
  ): Promise<Map<string, string | null>>;
  /** Lock warehouse (and locations), re-check active, then insert. */
  createUnderActiveWarehouse(
    input: LocationCreateInput,
  ): Promise<CreateLocationResult>;
  /** Lock warehouse, re-check active when resulting row is active, then update. */
  updateWithWarehouseLock(
    id: string,
    fields: Omit<LocationUpdateInput, 'parentLocationId'>,
  ): Promise<UpdateLocationLockedResult>;
  /** Lock warehouse + all locations ordered by id, validate parent/cycle, update. */
  reparentWithLock(
    id: string,
    parentLocationId: string | null,
    fields?: Omit<LocationUpdateInput, 'parentLocationId'>,
  ): Promise<ReparentLocationResult>;
}
