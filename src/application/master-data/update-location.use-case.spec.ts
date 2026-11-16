import {
  LocationCycleError,
  LocationNotFoundError,
  LocationParentInvalidError,
  WarehouseInactiveError,
} from '../../domain/master-data/master-data.errors';
import { LocationRepositoryPort } from './ports/location.repository.port';
import { UpdateLocationUseCase } from './update-location.use-case';

describe('UpdateLocationUseCase', () => {
  const locations: jest.Mocked<LocationRepositoryPort> = {
    findById: jest.fn(),
    findByWarehouseAndCode: jest.fn(),
    list: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    parentMapForWarehouse: jest.fn(),
    createUnderActiveWarehouse: jest.fn(),
    updateWithWarehouseLock: jest.fn(),
    reparentWithLock: jest.fn(),
  };
  const useCase = new UpdateLocationUseCase(locations);

  beforeEach(() => jest.clearAllMocks());

  const leaf = {
    id: 'leaf',
    warehouseId: 'w1',
    parentLocationId: 'root' as string | null,
    code: 'LEAF',
    name: 'Leaf',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('rejects cycle when reparenting', async () => {
    locations.reparentWithLock.mockResolvedValue({
      ok: false,
      reason: 'cycle',
    });

    await expect(
      useCase.execute({ id: 'root', parentLocationId: 'leaf' }),
    ).rejects.toBeInstanceOf(LocationCycleError);
  });

  it('rejects parent invalid', async () => {
    locations.reparentWithLock.mockResolvedValue({
      ok: false,
      reason: 'parent_invalid',
    });

    await expect(
      useCase.execute({ id: 'leaf', parentLocationId: 'other' }),
    ).rejects.toBeInstanceOf(LocationParentInvalidError);
  });

  it('clears parent with null via locked reparent', async () => {
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

  it('blocks reactivation under inactive warehouse via locked update', async () => {
    locations.updateWithWarehouseLock.mockResolvedValue({
      ok: false,
      reason: 'warehouse_inactive',
    });

    await expect(
      useCase.execute({ id: 'leaf', isActive: true }),
    ).rejects.toBeInstanceOf(WarehouseInactiveError);
  });

  it('throws when location missing', async () => {
    locations.updateWithWarehouseLock.mockResolvedValue({
      ok: false,
      reason: 'not_found',
    });
    await expect(
      useCase.execute({ id: 'missing', name: 'X' }),
    ).rejects.toBeInstanceOf(LocationNotFoundError);
  });
});
