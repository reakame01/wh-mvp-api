import {
  LocationCycleError,
  LocationNotFoundError,
  LocationParentInvalidError,
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
  };
  const useCase = new UpdateLocationUseCase(locations);

  beforeEach(() => jest.clearAllMocks());

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
    locations.findById.mockResolvedValueOnce(root).mockResolvedValueOnce(leaf);
    locations.parentMapForWarehouse.mockResolvedValue(
      new Map([
        ['root', null],
        ['leaf', 'root'],
      ]),
    );

    await expect(
      useCase.execute({ id: 'root', parentLocationId: 'leaf' }),
    ).rejects.toBeInstanceOf(LocationCycleError);
  });

  it('rejects parent from other warehouse', async () => {
    locations.findById.mockResolvedValueOnce(leaf).mockResolvedValueOnce({
      ...leaf,
      id: 'other',
      warehouseId: 'w2',
    });

    await expect(
      useCase.execute({ id: 'leaf', parentLocationId: 'other' }),
    ).rejects.toBeInstanceOf(LocationParentInvalidError);
  });

  it('throws when location missing', async () => {
    locations.findById.mockResolvedValue(null);
    await expect(
      useCase.execute({ id: 'missing', name: 'X' }),
    ).rejects.toBeInstanceOf(LocationNotFoundError);
  });
});
