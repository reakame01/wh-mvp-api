import { SupplierNotFoundError } from '../../domain/master-data/master-data.errors';
import { GetSupplierUseCase } from './get-supplier.use-case';
import { SupplierRepositoryPort } from './ports/supplier.repository.port';

describe('GetSupplierUseCase', () => {
  const suppliers = {
    findById: jest.fn(),
  } as unknown as jest.Mocked<SupplierRepositoryPort>;
  const useCase = new GetSupplierUseCase(suppliers);

  beforeEach(() => jest.clearAllMocks());

  it('returns supplier when found', async () => {
    suppliers.findById.mockResolvedValue({
      id: 's1',
      code: 'ACME',
      name: 'Acme',
      email: null,
      phone: null,
      address: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await expect(useCase.execute('s1')).resolves.toMatchObject({ id: 's1' });
  });

  it('throws when missing', async () => {
    suppliers.findById.mockResolvedValue(null);
    await expect(useCase.execute('x')).rejects.toBeInstanceOf(
      SupplierNotFoundError,
    );
  });
});
