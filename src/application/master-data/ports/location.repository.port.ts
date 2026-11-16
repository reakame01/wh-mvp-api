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

export type ReparentLocationResult =
  | { ok: true; location: Location }
  | {
      ok: false;
      reason: 'not_found' | 'parent_invalid' | 'cycle';
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
  /** Map of locationId → parentLocationId for one warehouse (cycle checks). */
  parentMapForWarehouse(
    warehouseId: string,
  ): Promise<Map<string, string | null>>;
  /**
   * Locks all locations in the warehouse, validates parent/cycle, then updates.
   * `fields` may also include name / isActive applied in the same transaction.
   */
  reparentWithLock(
    id: string,
    parentLocationId: string | null,
    fields?: Omit<LocationUpdateInput, 'parentLocationId'>,
  ): Promise<ReparentLocationResult>;
}
