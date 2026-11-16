import {
  CategoryCodeTakenError,
  InvalidMasterDataInputError,
} from '../../domain/master-data/master-data.errors';
import { CreateCategoryUseCase } from './create-category.use-case';
import { CategoryRepositoryPort } from './ports/category.repository.port';

describe('CreateCategoryUseCase', () => {
  const categories: jest.Mocked<CategoryRepositoryPort> = {
    findById: jest.fn(),
    findByCode: jest.fn(),
    list: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    countActiveProducts: jest.fn(),
    deactivateIfNoActiveProducts: jest.fn(),
  };
  const useCase = new CreateCategoryUseCase(categories);

  beforeEach(() => jest.clearAllMocks());

  it('creates category with normalized code', async () => {
    categories.findByCode.mockResolvedValue(null);
    categories.create.mockResolvedValue({
      id: 'c1',
      code: 'ELEC',
      name: 'Electronics',
      description: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const actual = await useCase.execute({
      code: ' elec ',
      name: ' Electronics ',
      description: '  ',
    });

    expect(categories.create).toHaveBeenCalledWith({
      code: 'ELEC',
      name: 'Electronics',
      description: null,
    });
    expect(actual.code).toBe('ELEC');
  });

  it('rejects whitespace-only code', async () => {
    await expect(
      useCase.execute({ code: '   ', name: 'X' }),
    ).rejects.toBeInstanceOf(InvalidMasterDataInputError);
  });

  it('rejects duplicate code', async () => {
    categories.findByCode.mockResolvedValue({
      id: 'c1',
      code: 'ELEC',
      name: 'X',
      description: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(
      useCase.execute({ code: 'ELEC', name: 'Y' }),
    ).rejects.toBeInstanceOf(CategoryCodeTakenError);
  });
});
