import { ListLocationsUseCase } from './list-locations.use-case';
import { LocationRepositoryPort } from './ports/location.repository.port';

describe('ListLocationsUseCase', () => {
  const locations = {
    list: jest.fn(),
  } as unknown as jest.Mocked<LocationRepositoryPort>;
  const useCase = new ListLocationsUseCase(locations);

  beforeEach(() => jest.clearAllMocks());

  it('passes warehouseId and trims search', async () => {
    locations.list.mockResolvedValue({
      items: [
        {
          id: 'l1',
          warehouseId: 'w1',
          code: 'A',
          name: 'A',
          parentLocationId: null,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      total: 1,
    });
    const actual = await useCase.execute({
      warehouseId: 'w1',
      search: ' a ',
      page: 2,
      pageSize: 10,
    });
    expect(locations.list).toHaveBeenCalledWith(
      expect.objectContaining({
        warehouseId: 'w1',
        search: 'a',
        page: 2,
        pageSize: 10,
      }),
    );
    expect(actual.meta.total).toBe(1);
    expect(actual.meta.totalPages).toBe(1);
  });
});
