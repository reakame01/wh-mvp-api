import {
  CategoryInactiveError,
  CategoryNotFoundError,
  InvalidMasterDataInputError,
  ProductBarcodeTakenError,
  ProductNotFoundError,
} from '../../domain/master-data/master-data.errors';
import { ProductRepositoryPort } from './ports/product.repository.port';
import { UpdateProductUseCase } from './update-product.use-case';

const sample = {
  id: 'p1',
  sku: 'SKU-1',
  barcode: null as string | null,
  name: 'Widget',
  categoryId: 'c1',
  unit: 'EA',
  reorderPoint: '0.0000',
  imageUrl: null as string | null,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

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
    products.findByBarcode.mockResolvedValue({ ...sample, id: 'other' });

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

  it('maps guarded not_found and category_not_found', async () => {
    products.updateGuardingCategory.mockResolvedValueOnce({
      ok: false,
      reason: 'not_found',
    });
    await expect(
      useCase.execute({ id: 'p1', categoryId: 'c2' }),
    ).rejects.toBeInstanceOf(ProductNotFoundError);

    products.updateGuardingCategory.mockResolvedValueOnce({
      ok: false,
      reason: 'category_not_found',
    });
    await expect(
      useCase.execute({ id: 'p1', categoryId: 'missing' }),
    ).rejects.toBeInstanceOf(CategoryNotFoundError);
  });

  it('updates without category guard when only renaming', async () => {
    products.findById.mockResolvedValue(sample);
    products.update.mockResolvedValue({ ...sample, name: 'New' });
    await useCase.execute({ id: 'p1', name: ' New ', barcode: '' });
    expect(products.update).toHaveBeenCalledWith(
      'p1',
      expect.objectContaining({ name: 'New', barcode: null }),
    );
  });

  it('throws not found on soft deactivate of missing product', async () => {
    products.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ id: 'missing', isActive: false }),
    ).rejects.toBeInstanceOf(ProductNotFoundError);
  });
});
