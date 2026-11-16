import {
  CategoryInactiveError,
  InvalidMasterDataInputError,
  ProductBarcodeTakenError,
  ProductNotFoundError,
} from '../../domain/master-data/master-data.errors';
import { ProductRepositoryPort } from './ports/product.repository.port';
import { UpdateProductUseCase } from './update-product.use-case';

describe('UpdateProductUseCase', () => {
  const products: jest.Mocked<ProductRepositoryPort> = {
    findById: jest.fn(),
    findBySku: jest.fn(),
    findByBarcode: jest.fn(),
    list: jest.fn(),
    createUnderActiveCategory: jest.fn(),
    update: jest.fn(),
    updateGuardingCategory: jest.fn(),
  };
  const useCase = new UpdateProductUseCase(products);

  beforeEach(() => jest.clearAllMocks());

  it('rejects invalid reorderPoint', async () => {
    await expect(
      useCase.execute({ id: 'p1', reorderPoint: 'abc' }),
    ).rejects.toBeInstanceOf(InvalidMasterDataInputError);
  });

  it('rejects barcode taken by another product', async () => {
    products.findByBarcode.mockResolvedValue({
      id: 'other',
      sku: 'X',
      barcode: '999',
      name: 'X',
      categoryId: 'c1',
      unit: 'EA',
      reorderPoint: '0',
      imageUrl: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(
      useCase.execute({ id: 'p1', barcode: '999' }),
    ).rejects.toBeInstanceOf(ProductBarcodeTakenError);
  });

  it('guards activate against inactive category', async () => {
    products.updateGuardingCategory.mockResolvedValue({
      ok: false,
      reason: 'category_inactive',
    });

    await expect(
      useCase.execute({ id: 'p1', isActive: true }),
    ).rejects.toBeInstanceOf(CategoryInactiveError);
  });

  it('throws not found on soft deactivate of missing product', async () => {
    products.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ id: 'missing', isActive: false }),
    ).rejects.toBeInstanceOf(ProductNotFoundError);
  });
});
