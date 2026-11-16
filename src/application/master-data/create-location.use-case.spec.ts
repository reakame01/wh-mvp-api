import {
  LocationCodeTakenError,
  LocationParentInvalidError,
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
  };
  const warehouses: jest.Mocked<WarehouseRepositoryPort> = {
    findById: jest.fn(),
    findByCode: jest.fn(),
    list: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    countActiveLocations: jest.fn(),
  };
  const useCase = new CreateLocationUseCase(locations, warehouses);

  beforeEach(() => jest.clearAllMocks());

  it('creates location under warehouse', async () => {
    warehouses.findById.mockResolvedValue({
      id: 'w1',
      code: 'BKK',
      name: 'Bangkok',
      address: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
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

  it('rejects parent in another warehouse', async () => {
    warehouses.findById.mockResolvedValue({
      id: 'w1',
      code: 'BKK',
      name: 'Bangkok',
      address: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
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
    warehouses.findById.mockResolvedValue({
      id: 'w1',
      code: 'BKK',
      name: 'Bangkok',
      address: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
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
