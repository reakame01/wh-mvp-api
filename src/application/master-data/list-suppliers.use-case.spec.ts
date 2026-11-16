import { ListSuppliersUseCase } from './list-suppliers.use-case';
import { SupplierRepositoryPort } from './ports/supplier.repository.port';

describe('ListSuppliersUseCase', () => {
  const suppliers = {
    list: jest.fn(),
  } as unknown as jest.Mocked<SupplierRepositoryPort>;
  const useCase = new ListSuppliersUseCase(suppliers);

  beforeEach(() => jest.clearAllMocks());

  it('drops blank search', async () => {
    suppliers.list.mockResolvedValue({ items: [], total: 0 });
    await useCase.execute({ search: '   ' });
    expect(suppliers.list).toHaveBeenCalledWith(
      expect.objectContaining({ search: undefined }),
    );
  });
});
