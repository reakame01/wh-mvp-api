import { Inject, Injectable } from '@nestjs/common';
import { CategoryNotFoundError } from '../../domain/master-data/master-data.errors';
import {
  CATEGORY_REPOSITORY,
  type CategoryRepositoryPort,
} from './ports/category.repository.port';

@Injectable()
export class GetCategoryUseCase {
  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly categories: CategoryRepositoryPort,
  ) {}

  async execute(id: string) {
    const category = await this.categories.findById(id);
    if (!category) {
      throw new CategoryNotFoundError();
    }
    return category;
  }
}
