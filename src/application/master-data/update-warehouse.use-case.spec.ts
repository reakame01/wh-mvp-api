import {
  InvalidMasterDataInputError,
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

  it('validates blank name before deactivate so no partial commit', async () => {
    await expect(
      useCase.execute({ id: 'w1', isActive: false, name: '   ' }),
    ).rejects.toBeInstanceOf(InvalidMasterDataInputError);
    expect(warehouses.deactivateIfNoActiveLocations).not.toHaveBeenCalled();
  });

  it('passes name/address into single deactivate transaction', async () => {
    warehouses.deactivateIfNoActiveLocations.mockResolvedValue({
      ok: true,
      warehouse: { ...warehouse, isActive: false, name: 'Closed' },
    });

    await useCase.execute({
      id: 'w1',
      isActive: false,
      name: 'Closed',
      address: 'x',
    });

    expect(warehouses.deactivateIfNoActiveLocations).toHaveBeenCalledWith(
      'w1',
      { name: 'Closed', address: 'x' },
    );
  });

  it('blocks deactivate when active locations exist', async () => {
    warehouses.deactivateIfNoActiveLocations.mockResolvedValue({
      ok: false,
      reason: 'has_active_locations',
    });

    await expect(
      useCase.execute({ id: 'w1', isActive: false }),
    ).rejects.toBeInstanceOf(WarehouseHasActiveLocationsError);
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
