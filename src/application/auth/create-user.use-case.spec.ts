import {
  ForbiddenError,
  UserEmailTakenError,
} from '../../domain/auth/auth.errors';
import { Role } from '../../domain/auth/role';
import { CreateUserUseCase } from './create-user.use-case';
import { PasswordHasherPort } from './ports/password-hasher.port';
import { UserRepositoryPort } from './ports/user.repository.port';

describe('CreateUserUseCase', () => {
  const users: jest.Mocked<UserRepositoryPort> = {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
  };
  const passwords: jest.Mocked<PasswordHasherPort> = {
    hash: jest.fn(),
    verify: jest.fn(),
  };
  const useCase = new CreateUserUseCase(users, passwords);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('allows Admin to create a user', async () => {
    users.findByEmail.mockResolvedValue(null);
    passwords.hash.mockResolvedValue('hashed');
    users.create.mockResolvedValue({
      id: 'u2',
      email: 'staff@example.com',
      passwordHash: 'hashed',
      fullName: 'Staff',
      role: Role.Staff,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const actual = await useCase.execute({
      actorRole: Role.Admin,
      email: 'Staff@Example.com',
      password: 'Secret123!',
      fullName: 'Staff',
      role: Role.Staff,
    });

    expect(users.create).toHaveBeenCalledWith({
      email: 'staff@example.com',
      passwordHash: 'hashed',
      fullName: 'Staff',
      role: Role.Staff,
    });
    expect(actual).not.toHaveProperty('passwordHash');
  });

  it('forbids non-Admin actors', async () => {
    await expect(
      useCase.execute({
        actorRole: Role.Manager,
        email: 'a@b.com',
        password: 'Secret123!',
        fullName: 'X',
        role: Role.Viewer,
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('rejects duplicate email', async () => {
    users.findByEmail.mockResolvedValue({
      id: 'u1',
      email: 'a@b.com',
      passwordHash: 'x',
      fullName: 'Existing',
      role: Role.Viewer,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(
      useCase.execute({
        actorRole: Role.Admin,
        email: 'a@b.com',
        password: 'Secret123!',
        fullName: 'X',
        role: Role.Viewer,
      }),
    ).rejects.toBeInstanceOf(UserEmailTakenError);
  });
});
