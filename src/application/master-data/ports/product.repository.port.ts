import { Product } from '../../../domain/master-data/product';

export const PRODUCT_REPOSITORY = Symbol('PRODUCT_REPOSITORY');

export type ProductListQuery = {
  page: number;
  pageSize: number;
  search?: string;
  isActive?: boolean;
  categoryId?: string;
  sort?: string;
};

export type ProductCreateInput = {
  sku: string;
  barcode?: string | null;
  name: string;
  categoryId: string;
  unit: string;
  reorderPoint: string;
  imageUrl?: string | null;
};

export type ProductUpdateInput = {
  barcode?: string | null;
  name?: string;
  categoryId?: string;
  unit?: string;
  reorderPoint?: string;
  imageUrl?: string | null;
  isActive?: boolean;
};

export type CreateProductUnderCategoryResult =
  | { ok: true; product: Product }
  | { ok: false; reason: 'category_not_found' | 'category_inactive' };

export type ActivateOrMoveProductResult =
  | { ok: true; product: Product }
  | {
      ok: false;
      reason: 'not_found' | 'category_not_found' | 'category_inactive';
    };

export interface ProductRepositoryPort {
  findById(id: string): Promise<Product | null>;
  findBySku(sku: string): Promise<Product | null>;
  findByBarcode(barcode: string): Promise<Product | null>;
  list(query: ProductListQuery): Promise<{ items: Product[]; total: number }>;
  /**
   * Locks category row, rejects inactive/missing, then inserts product.
   */
  createUnderActiveCategory(
    input: ProductCreateInput,
  ): Promise<CreateProductUnderCategoryResult>;
  update(id: string, input: ProductUpdateInput): Promise<Product>;
  /**
   * When activating or changing categoryId, lock target category and enforce active.
   */
  updateGuardingCategory(
    id: string,
    input: ProductUpdateInput,
  ): Promise<ActivateOrMoveProductResult>;
}
