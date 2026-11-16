import { Inject, Injectable } from '@nestjs/common';
import {
  CategoryHasActiveProductsError,
  CategoryNotFoundError,
} from '../../domain/master-data/master-data.errors';
import {
  normalizeOptionalString,
  requireTrimmedNonEmpty,
} from '../../domain/master-data/normalize';
import {
  CATEGORY_REPOSITORY,
  type CategoryRepositoryPort,
} from './ports/category.repository.port';

export type UpdateCategoryInput = {
  id: string;
  name?: string;
  description?: string | null;
  isActive?: boolean;
};

@Injectable()
export class UpdateCategoryUseCase {
  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly categories: CategoryRepositoryPort,
  ) {}

  async execute(input: UpdateCategoryInput) {
    const name =
      input.name !== undefined
        ? requireTrimmedNonEmpty(input.name, 'name')
        : undefined;
    const description =
      input.description === undefined
        ? undefined
        : (normalizeOptionalString(input.description) ?? null);

    if (input.isActive === false) {
      const result = await this.categories.deactivateIfNoActiveProducts(
        input.id,
        { name, description },
      );
      if (!result.ok) {
        if (result.reason === 'not_found') {
          throw new CategoryNotFoundError();
        }
        throw new CategoryHasActiveProductsError();
      }
      return result.category;
    }

    const existing = await this.categories.findById(input.id);
    if (!existing) {
      throw new CategoryNotFoundError();
    }

    return this.categories.update(input.id, {
      name,
      description,
      isActive: input.isActive,
    });
  }
}
