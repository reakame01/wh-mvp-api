import {
  LocationCodeTakenError,
  LocationParentInvalidError,
  WarehouseInactiveError,
  WarehouseNotFoundError,
} from '../../domain/master-data/master-data.errors';
import { CreateLocationUseCase } from './create-location.use-case';
import { LocationRepositoryPort } from './ports/location.repository.port';
import { WarehouseRepositoryPort } from './ports/warehouse.repository.port';

describe('CreateLocationUseCase', () => {
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
  const useCase = new CreateLocationUseCase(locations, warehouses);

  beforeEach(() => jest.clearAllMocks());

  const activeWarehouse = {
    id: 'w1',
    code: 'BKK',
    name: 'Bangkok',
    address: null as string | null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('creates location under warehouse', async () => {
    warehouses.findById.mockResolvedValue(activeWarehouse);
    locations.findByWarehouseAndCode.mockResolvedValue(null);
    locations.create.mockResolvedValue({
      id: 'l1',
      warehouseId: 'w1',
      parentLocationId: null,
      code: 'A-01',
      name: 'Aisle 01',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const actual = await useCase.execute({
      warehouseId: 'w1',
      code: ' a-01 ',
      name: ' Aisle 01 ',
    });

    expect(locations.create).toHaveBeenCalledWith({
      warehouseId: 'w1',
      code: 'A-01',
      name: 'Aisle 01',
      parentLocationId: null,
    });
    expect(actual.code).toBe('A-01');
  });

  it('treats empty parentLocationId as null', async () => {
    warehouses.findById.mockResolvedValue(activeWarehouse);
    locations.findByWarehouseAndCode.mockResolvedValue(null);
    locations.create.mockResolvedValue({
      id: 'l1',
      warehouseId: 'w1',
      parentLocationId: null,
      code: 'A-01',
      name: 'A',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await useCase.execute({
      warehouseId: 'w1',
      code: 'A-01',
      name: 'A',
      parentLocationId: '',
    });

    expect(locations.create).toHaveBeenCalledWith(
      expect.objectContaining({ parentLocationId: null }),
    );
  });

  it('rejects create under inactive warehouse', async () => {
    warehouses.findById.mockResolvedValue({
      ...activeWarehouse,
      isActive: false,
    });

    await expect(
      useCase.execute({ warehouseId: 'w1', code: 'A-01', name: 'A' }),
    ).rejects.toBeInstanceOf(WarehouseInactiveError);
  });

  it('rejects parent in another warehouse', async () => {
    warehouses.findById.mockResolvedValue(activeWarehouse);
    locations.findByWarehouseAndCode.mockResolvedValue(null);
    locations.findById.mockResolvedValue({
      id: 'l-other',
      warehouseId: 'w2',
      parentLocationId: null,
      code: 'X',
      name: 'X',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
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
    warehouses.findById.mockResolvedValue(null);
    await expect(
      useCase.execute({ warehouseId: 'missing', code: 'A', name: 'A' }),
    ).rejects.toBeInstanceOf(WarehouseNotFoundError);
  });

  it('rejects duplicate code in warehouse', async () => {
    warehouses.findById.mockResolvedValue(activeWarehouse);
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
