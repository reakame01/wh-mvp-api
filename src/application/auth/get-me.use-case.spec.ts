import { UserNotFoundError } from '../../domain/auth/auth.errors';
import { Role } from '../../domain/auth/role';
import { GetMeUseCase } from './get-me.use-case';
import { UserRepositoryPort } from './ports/user.repository.port';

describe('GetMeUseCase', () => {
  const users: jest.Mocked<UserRepositoryPort> = {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
  };
  const useCase = new GetMeUseCase(users);

  it('returns public profile', async () => {
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

    const actual = await useCase.execute('u1');
    expect(actual.email).toBe('a@b.com');
    expect(actual).not.toHaveProperty('passwordHash');
  });

  it('throws when user missing', async () => {
    users.findById.mockResolvedValue(null);
    await expect(useCase.execute('missing')).rejects.toBeInstanceOf(
      UserNotFoundError,
    );
  });
});
