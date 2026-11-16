import { WarehouseCodeTakenError } from '../../domain/master-data/master-data.errors';
import { CreateWarehouseUseCase } from './create-warehouse.use-case';
import { WarehouseRepositoryPort } from './ports/warehouse.repository.port';

describe('CreateWarehouseUseCase', () => {
  const warehouses: jest.Mocked<WarehouseRepositoryPort> = {
    findById: jest.fn(),
    findByCode: jest.fn(),
    list: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    countActiveLocations: jest.fn(),
  };
  const useCase = new CreateWarehouseUseCase(warehouses);

  beforeEach(() => jest.clearAllMocks());

  it('creates warehouse with normalized code', async () => {
    warehouses.findByCode.mockResolvedValue(null);
    warehouses.create.mockResolvedValue({
      id: 'w1',
      code: 'BKK-01',
      name: 'Bangkok',
      address: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const actual = await useCase.execute({
      code: ' bkk-01 ',
      name: ' Bangkok ',
    });

    expect(warehouses.create).toHaveBeenCalledWith({
      code: 'BKK-01',
      name: 'Bangkok',
      address: null,
    });
    expect(actual.code).toBe('BKK-01');
  });

  it('rejects duplicate code', async () => {
    warehouses.findByCode.mockResolvedValue({
      id: 'w1',
      code: 'BKK-01',
      name: 'X',
      address: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(
      useCase.execute({ code: 'BKK-01', name: 'Y' }),
    ).rejects.toBeInstanceOf(WarehouseCodeTakenError);
  });
});
