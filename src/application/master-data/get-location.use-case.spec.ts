import { LocationNotFoundError } from '../../domain/master-data/master-data.errors';
import { GetLocationUseCase } from './get-location.use-case';
import { LocationRepositoryPort } from './ports/location.repository.port';

describe('GetLocationUseCase', () => {
  const locations = {
    findById: jest.fn(),
  } as unknown as jest.Mocked<LocationRepositoryPort>;
  const useCase = new GetLocationUseCase(locations);

  beforeEach(() => jest.clearAllMocks());

  it('returns location when found', async () => {
    locations.findById.mockResolvedValue({
      id: 'l1',
      warehouseId: 'w1',
      code: 'A1',
      name: 'Bin',
      parentLocationId: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await expect(useCase.execute('l1')).resolves.toMatchObject({ id: 'l1' });
  });

  it('throws when missing', async () => {
    locations.findById.mockResolvedValue(null);
    await expect(useCase.execute('x')).rejects.toBeInstanceOf(
      LocationNotFoundError,
    );
  });
});
