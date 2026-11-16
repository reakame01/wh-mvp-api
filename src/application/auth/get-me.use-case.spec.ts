import { UserNotFoundError } from '../../domain/auth/auth.errors';
import { Role } from '../../domain/auth/role';
import { GetMeUseCase } from './get-me.use-case';
import { UserRepositoryPort } from './ports/user.repository.port';
import { RolePermissionCatalog } from './role-permission.catalog';

describe('GetMeUseCase', () => {
  const users: jest.Mocked<UserRepositoryPort> = {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
  };
  const catalog = {
    codesForRole: jest.fn(),
  } as unknown as RolePermissionCatalog;
  const useCase = new GetMeUseCase(users, catalog);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns public profile with permissions for role', async () => {
    users.findById.mockResolvedValue({
      id: 'u1',
      email: 'a@b.com',
      passwordHash: 'x',
      fullName: 'A',
      role: Role.Admin,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    (catalog.codesForRole as jest.Mock).mockReturnValue([
      'users:read',
      'users:write',
    ]);

    const actual = await useCase.execute('u1');
    expect(actual.email).toBe('a@b.com');
    expect(actual).not.toHaveProperty('passwordHash');
    expect(actual.permissions).toEqual(['users:read', 'users:write']);
    expect(catalog.codesForRole).toHaveBeenCalledWith(Role.Admin);
  });

  it('throws when user missing', async () => {
    users.findById.mockResolvedValue(null);
    await expect(useCase.execute('missing')).rejects.toBeInstanceOf(
      UserNotFoundError,
    );
  });
});
