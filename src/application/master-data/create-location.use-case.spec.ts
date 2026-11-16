import {
  LocationCodeTakenError,
  LocationParentInvalidError,
  WarehouseInactiveError,
  WarehouseNotFoundError,
} from '../../domain/master-data/master-data.errors';
import { CreateLocationUseCase } from './create-location.use-case';
import { LocationRepositoryPort } from './ports/location.repository.port';

describe('CreateLocationUseCase', () => {
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
  const useCase = new CreateLocationUseCase(locations);

  beforeEach(() => jest.clearAllMocks());

  it('creates location under active warehouse', async () => {
    locations.findByWarehouseAndCode.mockResolvedValue(null);
    locations.createUnderActiveWarehouse.mockResolvedValue({
      ok: true,
      location: {
        id: 'l1',
        warehouseId: 'w1',
        parentLocationId: null,
        code: 'A-01',
        name: 'Aisle 01',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    const actual = await useCase.execute({
      warehouseId: 'w1',
      code: ' a-01 ',
      name: ' Aisle 01 ',
    });

    expect(locations.createUnderActiveWarehouse).toHaveBeenCalledWith({
      warehouseId: 'w1',
      code: 'A-01',
      name: 'Aisle 01',
      parentLocationId: null,
    });
    expect(actual.code).toBe('A-01');
  });

  it('treats empty parentLocationId as null', async () => {
    locations.findByWarehouseAndCode.mockResolvedValue(null);
    locations.createUnderActiveWarehouse.mockResolvedValue({
      ok: true,
      location: {
        id: 'l1',
        warehouseId: 'w1',
        parentLocationId: null,
        code: 'A-01',
        name: 'A',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    await useCase.execute({
      warehouseId: 'w1',
      code: 'A-01',
      name: 'A',
      parentLocationId: '',
    });

    expect(locations.createUnderActiveWarehouse).toHaveBeenCalledWith(
      expect.objectContaining({ parentLocationId: null }),
    );
  });

  it('rejects create under inactive warehouse', async () => {
    locations.findByWarehouseAndCode.mockResolvedValue(null);
    locations.createUnderActiveWarehouse.mockResolvedValue({
      ok: false,
      reason: 'warehouse_inactive',
    });

    await expect(
      useCase.execute({ warehouseId: 'w1', code: 'A-01', name: 'A' }),
    ).rejects.toBeInstanceOf(WarehouseInactiveError);
  });

  it('rejects parent invalid from locked create', async () => {
    locations.findByWarehouseAndCode.mockResolvedValue(null);
    locations.createUnderActiveWarehouse.mockResolvedValue({
      ok: false,
      reason: 'parent_invalid',
    });

    await expect(
      useCase.execute({
        warehouseId: 'w1',
        code: 'A-01',
        name: 'A',
        parentLocationId: 'l-other',
      }),
    ).rejects.toBeInstanceOf(LocationParentInvalidError);
  });

  it('rejects missing warehouse', async () => {
    locations.findByWarehouseAndCode.mockResolvedValue(null);
    locations.createUnderActiveWarehouse.mockResolvedValue({
      ok: false,
      reason: 'warehouse_not_found',
    });
    await expect(
      useCase.execute({ warehouseId: 'missing', code: 'A', name: 'A' }),
    ).rejects.toBeInstanceOf(WarehouseNotFoundError);
  });

  it('rejects duplicate code in warehouse', async () => {
    locations.findByWarehouseAndCode.mockResolvedValue({
      id: 'l1',
      warehouseId: 'w1',
      parentLocationId: null,
      code: 'A-01',
      name: 'Existing',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(
      useCase.execute({ warehouseId: 'w1', code: 'A-01', name: 'New' }),
    ).rejects.toBeInstanceOf(LocationCodeTakenError);
  });
});
