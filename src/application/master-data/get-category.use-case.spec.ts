import { CategoryNotFoundError } from '../../domain/master-data/master-data.errors';
import { GetCategoryUseCase } from './get-category.use-case';
import { CategoryRepositoryPort } from './ports/category.repository.port';

describe('GetCategoryUseCase', () => {
  const categories = {
    findById: jest.fn(),
  } as unknown as jest.Mocked<CategoryRepositoryPort>;
  const useCase = new GetCategoryUseCase(categories);

  beforeEach(() => jest.clearAllMocks());

  it('returns category when found', async () => {
    categories.findById.mockResolvedValue({
      id: 'c1',
      code: 'ELEC',
      name: 'Electronics',
      description: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await expect(useCase.execute('c1')).resolves.toMatchObject({ id: 'c1' });
  });

  it('throws when missing', async () => {
    categories.findById.mockResolvedValue(null);
    await expect(useCase.execute('x')).rejects.toBeInstanceOf(
      CategoryNotFoundError,
    );
  });
});
