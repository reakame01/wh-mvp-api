import {
  WarehouseHasActiveLocationsError,
  WarehouseNotFoundError,
} from '../../domain/master-data/master-data.errors';
import { WarehouseRepositoryPort } from './ports/warehouse.repository.port';
import { UpdateWarehouseUseCase } from './update-warehouse.use-case';

describe('UpdateWarehouseUseCase', () => {
  const warehouses: jest.Mocked<WarehouseRepositoryPort> = {
    findById: jest.fn(),
    findByCode: jest.fn(),
    list: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    countActiveLocations: jest.fn(),
    deactivateIfNoActiveLocations: jest.fn(),
  };
  const useCase = new UpdateWarehouseUseCase(warehouses);

  beforeEach(() => jest.clearAllMocks());

  const warehouse = {
    id: 'w1',
    code: 'BKK-01',
    name: 'Bangkok',
    address: null as string | null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('blocks deactivate when active locations exist', async () => {
    warehouses.deactivateIfNoActiveLocations.mockResolvedValue({
      ok: false,
      reason: 'has_active_locations',
    });

    await expect(
      useCase.execute({ id: 'w1', isActive: false }),
    ).rejects.toBeInstanceOf(WarehouseHasActiveLocationsError);
  });

  it('allows deactivate when no active locations', async () => {
    warehouses.deactivateIfNoActiveLocations.mockResolvedValue({
      ok: true,
      warehouse: { ...warehouse, isActive: false },
    });

    const actual = await useCase.execute({ id: 'w1', isActive: false });
    expect(actual.isActive).toBe(false);
  });

  it('throws when warehouse missing on deactivate', async () => {
    warehouses.deactivateIfNoActiveLocations.mockResolvedValue({
      ok: false,
      reason: 'not_found',
    });
    await expect(
      useCase.execute({ id: 'missing', isActive: false }),
    ).rejects.toBeInstanceOf(WarehouseNotFoundError);
  });

  it('throws when warehouse missing on normal update', async () => {
    warehouses.findById.mockResolvedValue(null);
    await expect(
      useCase.execute({ id: 'missing', name: 'X' }),
    ).rejects.toBeInstanceOf(WarehouseNotFoundError);
  });
});
