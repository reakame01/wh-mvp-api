import {
  InvalidMasterDataInputError,
  SupplierNotFoundError,
} from '../../domain/master-data/master-data.errors';
import { SupplierRepositoryPort } from './ports/supplier.repository.port';
import { UpdateSupplierUseCase } from './update-supplier.use-case';

describe('UpdateSupplierUseCase', () => {
  const suppliers: jest.Mocked<SupplierRepositoryPort> = {
    findById: jest.fn(),
    findByCode: jest.fn(),
    list: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };
  const useCase = new UpdateSupplierUseCase(suppliers);

  beforeEach(() => jest.clearAllMocks());

  it('throws when supplier missing', async () => {
    suppliers.findById.mockResolvedValue(null);
    await expect(
      useCase.execute({ id: 'missing', name: 'X' }),
    ).rejects.toBeInstanceOf(SupplierNotFoundError);
  });

  it('normalizes blank email to null and updates', async () => {
    suppliers.findById.mockResolvedValue({
      id: 's1',
      code: 'ACME',
      name: 'Old',
      email: 'a@b.c',
      phone: null,
      address: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    suppliers.update.mockResolvedValue({
      id: 's1',
      code: 'ACME',
      name: 'New',
      email: null,
      phone: null,
      address: null,
      isActive: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await useCase.execute({
      id: 's1',
      name: ' New ',
      email: '  ',
      isActive: false,
    });

    expect(suppliers.update).toHaveBeenCalledWith('s1', {
      name: 'New',
      email: null,
      phone: undefined,
      address: undefined,
      isActive: false,
    });
  });

  it('rejects blank name', async () => {
    suppliers.findById.mockResolvedValue({
      id: 's1',
      code: 'ACME',
      name: 'Old',
      email: null,
      phone: null,
      address: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await expect(
      useCase.execute({ id: 's1', name: '  ' }),
    ).rejects.toBeInstanceOf(InvalidMasterDataInputError);
  });
});
