import { ProductNotFoundError } from '../../domain/master-data/master-data.errors';
import { GetProductUseCase } from './get-product.use-case';
import { ProductRepositoryPort } from './ports/product.repository.port';

describe('GetProductUseCase', () => {
  const products = {
    findById: jest.fn(),
  } as unknown as jest.Mocked<ProductRepositoryPort>;
  const useCase = new GetProductUseCase(products);

  beforeEach(() => jest.clearAllMocks());

  it('returns product when found', async () => {
    products.findById.mockResolvedValue({
      id: 'p1',
      sku: 'SKU-1',
      barcode: null,
      name: 'Widget',
      categoryId: 'c1',
      unit: 'EA',
      reorderPoint: '0.0000',
      imageUrl: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await expect(useCase.execute('p1')).resolves.toMatchObject({ id: 'p1' });
  });

  it('throws when missing', async () => {
    products.findById.mockResolvedValue(null);
    await expect(useCase.execute('x')).rejects.toBeInstanceOf(
      ProductNotFoundError,
    );
  });
});
