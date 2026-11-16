import { Inject, Injectable } from '@nestjs/common';
import {
  CategoryInactiveError,
  CategoryNotFoundError,
  ProductBarcodeTakenError,
  ProductSkuTakenError,
} from '../../domain/master-data/master-data.errors';
import {
  normalizeOptionalString,
  requireNonNegativeDecimal,
  requireTrimmedNonEmpty,
} from '../../domain/master-data/normalize';
import {
  PRODUCT_REPOSITORY,
  type ProductRepositoryPort,
} from './ports/product.repository.port';

export type CreateProductInput = {
  sku: string;
  barcode?: string | null;
  name: string;
  categoryId: string;
  unit: string;
  reorderPoint: string | number;
  imageUrl?: string | null;
};

@Injectable()
export class CreateProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly products: ProductRepositoryPort,
  ) {}

  async execute(input: CreateProductInput) {
    const sku = requireTrimmedNonEmpty(input.sku, 'sku').toUpperCase();
    const name = requireTrimmedNonEmpty(input.name, 'name');
    const unit = requireTrimmedNonEmpty(input.unit, 'unit').toUpperCase();
    const categoryId = requireTrimmedNonEmpty(input.categoryId, 'categoryId');
    const reorderPoint = requireNonNegativeDecimal(input.reorderPoint);
    const barcode = normalizeOptionalString(input.barcode);
    const imageUrl = normalizeOptionalString(input.imageUrl);

    const existingSku = await this.products.findBySku(sku);
    if (existingSku) {
      throw new ProductSkuTakenError();
    }
    if (barcode) {
      const existingBarcode = await this.products.findByBarcode(barcode);
      if (existingBarcode) {
        throw new ProductBarcodeTakenError();
      }
    }

    const result = await this.products.createUnderActiveCategory({
      sku,
      name,
      unit,
      categoryId,
      reorderPoint,
      barcode: barcode === undefined ? null : barcode,
      imageUrl: imageUrl === undefined ? null : imageUrl,
    });

    if (!result.ok) {
      if (result.reason === 'category_not_found') {
        throw new CategoryNotFoundError();
      }
      throw new CategoryInactiveError();
    }
    return result.product;
  }
}
