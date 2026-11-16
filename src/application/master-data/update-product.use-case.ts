import { Inject, Injectable } from '@nestjs/common';
import {
  CategoryInactiveError,
  CategoryNotFoundError,
  ProductBarcodeTakenError,
  ProductNotFoundError,
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

export type UpdateProductInput = {
  id: string;
  barcode?: string | null;
  name?: string;
  categoryId?: string;
  unit?: string;
  reorderPoint?: string | number;
  imageUrl?: string | null;
  isActive?: boolean;
};

@Injectable()
export class UpdateProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly products: ProductRepositoryPort,
  ) {}

  async execute(input: UpdateProductInput) {
    const name =
      input.name !== undefined
        ? requireTrimmedNonEmpty(input.name, 'name')
        : undefined;
    const unit =
      input.unit !== undefined
        ? requireTrimmedNonEmpty(input.unit, 'unit').toUpperCase()
        : undefined;
    const categoryId =
      input.categoryId !== undefined
        ? requireTrimmedNonEmpty(input.categoryId, 'categoryId')
        : undefined;
    const reorderPoint =
      input.reorderPoint !== undefined
        ? requireNonNegativeDecimal(input.reorderPoint)
        : undefined;
    const barcode =
      input.barcode === undefined
        ? undefined
        : (normalizeOptionalString(input.barcode) ?? null);
    const imageUrl =
      input.imageUrl === undefined
        ? undefined
        : (normalizeOptionalString(input.imageUrl) ?? null);

    if (barcode) {
      const existingBarcode = await this.products.findByBarcode(barcode);
      if (existingBarcode && existingBarcode.id !== input.id) {
        throw new ProductBarcodeTakenError();
      }
    }

    const needsCategoryGuard =
      input.isActive === true || categoryId !== undefined;

    if (needsCategoryGuard) {
      const result = await this.products.updateGuardingCategory(input.id, {
        barcode,
        name,
        categoryId,
        unit,
        reorderPoint,
        imageUrl,
        isActive: input.isActive,
      });
      if (!result.ok) {
        if (result.reason === 'not_found') {
          throw new ProductNotFoundError();
        }
        if (result.reason === 'category_not_found') {
          throw new CategoryNotFoundError();
        }
        throw new CategoryInactiveError();
      }
      return result.product;
    }

    const existing = await this.products.findById(input.id);
    if (!existing) {
      throw new ProductNotFoundError();
    }

    return this.products.update(input.id, {
      barcode,
      name,
      categoryId,
      unit,
      reorderPoint,
      imageUrl,
      isActive: input.isActive,
    });
  }
}
