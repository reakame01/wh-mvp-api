import { Category } from '../../../domain/master-data/category';

export const CATEGORY_REPOSITORY = Symbol('CATEGORY_REPOSITORY');

export type CategoryListQuery = {
  page: number;
  pageSize: number;
  search?: string;
  isActive?: boolean;
  sort?: string;
};

export type CategoryCreateInput = {
  code: string;
  name: string;
  description?: string | null;
};

export type CategoryUpdateInput = {
  name?: string;
  description?: string | null;
  isActive?: boolean;
};

export type DeactivateCategoryResult =
  | { ok: true; category: Category }
  | { ok: false; reason: 'not_found' | 'has_active_products' };

export interface CategoryRepositoryPort {
  findById(id: string): Promise<Category | null>;
  findByCode(code: string): Promise<Category | null>;
  list(query: CategoryListQuery): Promise<{ items: Category[]; total: number }>;
  create(input: CategoryCreateInput): Promise<Category>;
  update(id: string, input: CategoryUpdateInput): Promise<Category>;
  countActiveProducts(categoryId: string): Promise<number>;
  /**
   * Locks category + all its products (ordered), then soft-deactivates
   * when no active products remain.
   */
  deactivateIfNoActiveProducts(
    id: string,
    fields?: { name?: string; description?: string | null },
  ): Promise<DeactivateCategoryResult>;
}
