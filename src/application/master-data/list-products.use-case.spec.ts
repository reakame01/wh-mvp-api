import { ListProductsUseCase } from './list-products.use-case';
import { ProductRepositoryPort } from './ports/product.repository.port';

describe('ListProductsUseCase', () => {
  const products = {
    list: jest.fn(),
  } as unknown as jest.Mocked<ProductRepositoryPort>;
  const useCase = new ListProductsUseCase(products);

  beforeEach(() => jest.clearAllMocks());

  it('passes categoryId filter', async () => {
    products.list.mockResolvedValue({ items: [], total: 0 });
    await useCase.execute({ categoryId: ' c1 ', sort: 'sku:asc' });
    expect(products.list).toHaveBeenCalledWith(
      expect.objectContaining({
        categoryId: 'c1',
        sort: 'sku:asc',
      }),
    );
  });
});
