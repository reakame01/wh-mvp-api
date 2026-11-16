import {
  CategoryInactiveError,
  CategoryNotFoundError,
  InvalidMasterDataInputError,
  ProductBarcodeTakenError,
  ProductSkuTakenError,
} from '../../domain/master-data/master-data.errors';
import { CreateProductUseCase } from './create-product.use-case';
import { ProductRepositoryPort } from './ports/product.repository.port';

describe('CreateProductUseCase', () => {
  const products: jest.Mocked<ProductRepositoryPort> = {
    findById: jest.fn(),
    findBySku: jest.fn(),
    findByBarcode: jest.fn(),
    list: jest.fn(),
    createUnderActiveCategory: jest.fn(),
    update: jest.fn(),
    updateGuardingCategory: jest.fn(),
  };
  const useCase = new CreateProductUseCase(products);

  beforeEach(() => jest.clearAllMocks());

  it('creates product with normalized sku and blank barcode as null', async () => {
    products.findBySku.mockResolvedValue(null);
    products.createUnderActiveCategory.mockResolvedValue({
      ok: true,
      product: {
        id: 'p1',
        sku: 'SKU-1',
        barcode: null,
        name: 'Widget',
        categoryId: 'c1',
        unit: 'EA',
        reorderPoint: '0',
        imageUrl: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    await useCase.execute({
      sku: ' sku-1 ',
      barcode: '  ',
      name: ' Widget ',
      categoryId: 'c1',
      unit: ' ea ',
      reorderPoint: '0',
    });

    expect(products.createUnderActiveCategory).toHaveBeenCalledWith({
      sku: 'SKU-1',
      barcode: null,
      name: 'Widget',
      categoryId: 'c1',
      unit: 'EA',
      reorderPoint: '0',
      imageUrl: null,
    });
  });

  it('rejects negative reorderPoint', async () => {
    await expect(
      useCase.execute({
        sku: 'S1',
        name: 'X',
        categoryId: 'c1',
        unit: 'EA',
        reorderPoint: '-1',
      }),
    ).rejects.toBeInstanceOf(InvalidMasterDataInputError);
  });

  it('rejects duplicate sku', async () => {
    products.findBySku.mockResolvedValue({
      id: 'p1',
      sku: 'SKU-1',
      barcode: null,
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
      useCase.execute({
        sku: 'SKU-1',
        name: 'Y',
        categoryId: 'c1',
        unit: 'EA',
        reorderPoint: 0,
      }),
    ).rejects.toBeInstanceOf(ProductSkuTakenError);
  });

  it('rejects duplicate barcode', async () => {
    products.findBySku.mockResolvedValue(null);
    products.findByBarcode.mockResolvedValue({
      id: 'p2',
      sku: 'OTHER',
      barcode: '111',
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
      useCase.execute({
        sku: 'SKU-2',
        barcode: '111',
        name: 'Y',
        categoryId: 'c1',
        unit: 'EA',
        reorderPoint: '1',
      }),
    ).rejects.toBeInstanceOf(ProductBarcodeTakenError);
  });

  it('rejects missing category', async () => {
    products.findBySku.mockResolvedValue(null);
    products.createUnderActiveCategory.mockResolvedValue({
      ok: false,
      reason: 'category_not_found',
    });

    await expect(
      useCase.execute({
        sku: 'SKU-3',
        name: 'Y',
        categoryId: 'missing',
        unit: 'EA',
        reorderPoint: '0',
      }),
    ).rejects.toBeInstanceOf(CategoryNotFoundError);
  });

  it('rejects inactive category', async () => {
    products.findBySku.mockResolvedValue(null);
    products.createUnderActiveCategory.mockResolvedValue({
      ok: false,
      reason: 'category_inactive',
    });

    await expect(
      useCase.execute({
        sku: 'SKU-4',
        name: 'Y',
        categoryId: 'c1',
        unit: 'EA',
        reorderPoint: '0',
      }),
    ).rejects.toBeInstanceOf(CategoryInactiveError);
  });
});
