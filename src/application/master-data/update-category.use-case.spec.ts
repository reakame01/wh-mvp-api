import {
  CategoryHasActiveProductsError,
  CategoryNotFoundError,
} from '../../domain/master-data/master-data.errors';
import { CategoryRepositoryPort } from './ports/category.repository.port';
import { UpdateCategoryUseCase } from './update-category.use-case';

describe('UpdateCategoryUseCase', () => {
  const categories: jest.Mocked<CategoryRepositoryPort> = {
    findById: jest.fn(),
    findByCode: jest.fn(),
    list: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    countActiveProducts: jest.fn(),
    deactivateIfNoActiveProducts: jest.fn(),
  };
  const useCase = new UpdateCategoryUseCase(categories);

  beforeEach(() => jest.clearAllMocks());

  it('blocks deactivate when active products exist', async () => {
    categories.deactivateIfNoActiveProducts.mockResolvedValue({
      ok: false,
      reason: 'has_active_products',
    });

    await expect(
      useCase.execute({ id: 'c1', isActive: false }),
    ).rejects.toBeInstanceOf(CategoryHasActiveProductsError);
  });

  it('throws not found when deactivate target missing', async () => {
    categories.deactivateIfNoActiveProducts.mockResolvedValue({
      ok: false,
      reason: 'not_found',
    });

    await expect(
      useCase.execute({ id: 'missing', isActive: false }),
    ).rejects.toBeInstanceOf(CategoryNotFoundError);
  });

  it('updates name when category exists', async () => {
    categories.findById.mockResolvedValue({
      id: 'c1',
      code: 'ELEC',
      name: 'Old',
      description: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    categories.update.mockResolvedValue({
      id: 'c1',
      code: 'ELEC',
      name: 'New',
      description: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const actual = await useCase.execute({ id: 'c1', name: ' New ' });
    expect(categories.update).toHaveBeenCalledWith('c1', {
      name: 'New',
      description: undefined,
      isActive: undefined,
    });
    expect(actual.name).toBe('New');
  });
});
