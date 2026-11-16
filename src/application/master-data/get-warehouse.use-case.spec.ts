import { WarehouseNotFoundError } from '../../domain/master-data/master-data.errors';
import { GetWarehouseUseCase } from './get-warehouse.use-case';
import { WarehouseRepositoryPort } from './ports/warehouse.repository.port';

describe('GetWarehouseUseCase', () => {
  const warehouses = {
    findById: jest.fn(),
  } as unknown as jest.Mocked<WarehouseRepositoryPort>;
  const useCase = new GetWarehouseUseCase(warehouses);

  beforeEach(() => jest.clearAllMocks());

  it('returns warehouse when found', async () => {
    warehouses.findById.mockResolvedValue({
      id: 'w1',
      code: 'BKK',
      name: 'Bangkok',
      address: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await expect(useCase.execute('w1')).resolves.toMatchObject({ id: 'w1' });
  });

  it('throws when missing', async () => {
    warehouses.findById.mockResolvedValue(null);
    await expect(useCase.execute('x')).rejects.toBeInstanceOf(
      WarehouseNotFoundError,
    );
  });
});
