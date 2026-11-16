import { Inject, Injectable } from '@nestjs/common';
import { CategoryCodeTakenError } from '../../domain/master-data/master-data.errors';
import {
  normalizeOptionalString,
  requireTrimmedNonEmpty,
} from '../../domain/master-data/normalize';
import {
  CATEGORY_REPOSITORY,
  type CategoryRepositoryPort,
} from './ports/category.repository.port';

export type CreateCategoryInput = {
  code: string;
  name: string;
  description?: string | null;
};

@Injectable()
export class CreateCategoryUseCase {
  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly categories: CategoryRepositoryPort,
  ) {}

  async execute(input: CreateCategoryInput) {
    const code = requireTrimmedNonEmpty(input.code, 'code').toUpperCase();
    const name = requireTrimmedNonEmpty(input.name, 'name');
    const description = normalizeOptionalString(input.description);
    const existing = await this.categories.findByCode(code);
    if (existing) {
      throw new CategoryCodeTakenError();
    }
    return this.categories.create({
      code,
      name,
      description: description === undefined ? null : description,
    });
  }
}
