import { ListCategoriesUseCase } from './list-categories.use-case';
import { CategoryRepositoryPort } from './ports/category.repository.port';

describe('ListCategoriesUseCase', () => {
  const categories = {
    list: jest.fn(),
  } as unknown as jest.Mocked<CategoryRepositoryPort>;
  const useCase = new ListCategoriesUseCase(categories);

  beforeEach(() => jest.clearAllMocks());

  it('returns paged envelope', async () => {
    categories.list.mockResolvedValue({ items: [], total: 25 });
    const actual = await useCase.execute({ page: 2, pageSize: 10 });
    expect(actual.meta).toEqual({
      page: 2,
      pageSize: 10,
      total: 25,
      totalPages: 3,
    });
  });
});
