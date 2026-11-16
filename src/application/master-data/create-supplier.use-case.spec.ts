import {
  InvalidMasterDataInputError,
  SupplierCodeTakenError,
} from '../../domain/master-data/master-data.errors';
import { CreateSupplierUseCase } from './create-supplier.use-case';
import { SupplierRepositoryPort } from './ports/supplier.repository.port';

describe('CreateSupplierUseCase', () => {
  const suppliers: jest.Mocked<SupplierRepositoryPort> = {
    findById: jest.fn(),
    findByCode: jest.fn(),
    list: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };
  const useCase = new CreateSupplierUseCase(suppliers);

  beforeEach(() => jest.clearAllMocks());

  it('creates supplier with normalized code', async () => {
    suppliers.findByCode.mockResolvedValue(null);
    suppliers.create.mockResolvedValue({
      id: 's1',
      code: 'ACME',
      name: 'Acme Co',
      email: null,
      phone: null,
      address: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await useCase.execute({ code: ' acme ', name: ' Acme Co ', email: '  ' });

    expect(suppliers.create).toHaveBeenCalledWith({
      code: 'ACME',
      name: 'Acme Co',
      email: null,
      phone: null,
      address: null,
    });
  });

  it('rejects blank name', async () => {
    await expect(
      useCase.execute({ code: 'X', name: '  ' }),
    ).rejects.toBeInstanceOf(InvalidMasterDataInputError);
  });

  it('rejects duplicate code', async () => {
    suppliers.findByCode.mockResolvedValue({
      id: 's1',
      code: 'ACME',
      name: 'X',
      email: null,
      phone: null,
      address: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(
      useCase.execute({ code: 'ACME', name: 'Y' }),
    ).rejects.toBeInstanceOf(SupplierCodeTakenError);
  });
});
