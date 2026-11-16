import { ListWarehousesUseCase } from './list-warehouses.use-case';
import { WarehouseRepositoryPort } from './ports/warehouse.repository.port';

describe('ListWarehousesUseCase', () => {
  const warehouses = {
    list: jest.fn(),
  } as unknown as jest.Mocked<WarehouseRepositoryPort>;
  const useCase = new ListWarehousesUseCase(warehouses);

  beforeEach(() => jest.clearAllMocks());

  it('normalizes page query and trims search', async () => {
    warehouses.list.mockResolvedValue({ items: [], total: 0 });
    const actual = await useCase.execute({
      page: 0,
      pageSize: 500,
      search: '  bkk  ',
      isActive: true,
      sort: 'code:asc',
    });
    expect(warehouses.list).toHaveBeenCalledWith({
      page: 1,
      pageSize: 100,
      search: 'bkk',
      isActive: true,
      sort: 'code:asc',
    });
    expect(actual.meta).toEqual({
      page: 1,
      pageSize: 100,
      total: 0,
      totalPages: 0,
    });
  });
});
