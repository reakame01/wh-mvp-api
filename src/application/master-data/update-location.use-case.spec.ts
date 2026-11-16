import {
  LocationCycleError,
  LocationNotFoundError,
  LocationParentInvalidError,
  WarehouseInactiveError,
} from '../../domain/master-data/master-data.errors';
import { LocationRepositoryPort } from './ports/location.repository.port';
import { WarehouseRepositoryPort } from './ports/warehouse.repository.port';
import { UpdateLocationUseCase } from './update-location.use-case';

describe('UpdateLocationUseCase', () => {
  const locations: jest.Mocked<LocationRepositoryPort> = {
    findById: jest.fn(),
    findByWarehouseAndCode: jest.fn(),
    list: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    parentMapForWarehouse: jest.fn(),
    reparentWithLock: jest.fn(),
  };
  const warehouses: jest.Mocked<WarehouseRepositoryPort> = {
    findById: jest.fn(),
    findByCode: jest.fn(),
    list: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    countActiveLocations: jest.fn(),
    deactivateIfNoActiveLocations: jest.fn(),
  };
  const useCase = new UpdateLocationUseCase(locations, warehouses);

  beforeEach(() => jest.clearAllMocks());

  const warehouse = {
    id: 'w1',
    code: 'BKK',
    name: 'Bangkok',
    address: null as string | null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const root = {
    id: 'root',
    warehouseId: 'w1',
    parentLocationId: null as string | null,
    code: 'ROOT',
    name: 'Root',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const leaf = {
    ...root,
    id: 'leaf',
    parentLocationId: 'root',
    code: 'LEAF',
    name: 'Leaf',
  };

  it('rejects cycle when reparenting ancestor under descendant', async () => {
    locations.findById.mockResolvedValue(root);
    warehouses.findById.mockResolvedValue(warehouse);
    locations.reparentWithLock.mockResolvedValue({
      ok: false,
      reason: 'cycle',
    });

    await expect(
      useCase.execute({ id: 'root', parentLocationId: 'leaf' }),
    ).rejects.toBeInstanceOf(LocationCycleError);
  });

  it('rejects parent from other warehouse', async () => {
    locations.findById.mockResolvedValue(leaf);
    warehouses.findById.mockResolvedValue(warehouse);
    locations.reparentWithLock.mockResolvedValue({
      ok: false,
      reason: 'parent_invalid',
    });

    await expect(
      useCase.execute({ id: 'leaf', parentLocationId: 'other' }),
    ).rejects.toBeInstanceOf(LocationParentInvalidError);
  });

  it('clears parent with null via locked reparent', async () => {
    locations.findById.mockResolvedValue(leaf);
    warehouses.findById.mockResolvedValue(warehouse);
    locations.reparentWithLock.mockResolvedValue({
      ok: true,
      location: { ...leaf, parentLocationId: null },
    });

    const actual = await useCase.execute({
      id: 'leaf',
      parentLocationId: null,
    });
    expect(locations.reparentWithLock).toHaveBeenCalledWith('leaf', null, {
      name: undefined,
      isActive: undefined,
    });
    expect(actual.parentLocationId).toBeNull();
  });

  it('treats empty parentLocationId as clear parent', async () => {
    locations.findById.mockResolvedValue(leaf);
    warehouses.findById.mockResolvedValue(warehouse);
    locations.reparentWithLock.mockResolvedValue({
      ok: true,
      location: { ...leaf, parentLocationId: null },
    });

    await useCase.execute({ id: 'leaf', parentLocationId: '' });
    expect(locations.reparentWithLock).toHaveBeenCalledWith(
      'leaf',
      null,
      expect.any(Object),
    );
  });

  it('blocks reactivation under inactive warehouse', async () => {
    locations.findById.mockResolvedValue({ ...leaf, isActive: false });
    warehouses.findById.mockResolvedValue({ ...warehouse, isActive: false });

    await expect(
      useCase.execute({ id: 'leaf', isActive: true }),
    ).rejects.toBeInstanceOf(WarehouseInactiveError);
  });

  it('throws when location missing', async () => {
    locations.findById.mockResolvedValue(null);
    await expect(
      useCase.execute({ id: 'missing', name: 'X' }),
    ).rejects.toBeInstanceOf(LocationNotFoundError);
  });
});
