import { InvalidCredentialsError } from '../../domain/auth/auth.errors';
import { Role } from '../../domain/auth/role';
import { User } from '../../domain/auth/user';
import { LoginUseCase } from './login.use-case';
import { PasswordHasherPort } from './ports/password-hasher.port';
import { RefreshTokenRepositoryPort } from './ports/refresh-token.repository.port';
import { TokenPort } from './ports/token.port';
import { UserRepositoryPort } from './ports/user.repository.port';

function makeUser(overrides: Partial<User> = {}): User {
  const now = new Date();
  return {
    id: 'user-1',
    email: 'admin@example.com',
    passwordHash: 'hashed',
    fullName: 'Admin User',
    role: Role.Admin,
    isActive: true,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe('LoginUseCase', () => {
  const users: jest.Mocked<UserRepositoryPort> = {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
  };
  const passwords: jest.Mocked<PasswordHasherPort> = {
    hash: jest.fn(),
    verify: jest.fn(),
  };
  const tokens: jest.Mocked<TokenPort> = {
    signAccessToken: jest.fn(),
    verifyAccessToken: jest.fn(),
    generateRefreshToken: jest.fn(),
    hashRefreshToken: jest.fn(),
  };
  const refreshTokens: jest.Mocked<RefreshTokenRepositoryPort> = {
    create: jest.fn(),
    findByTokenHash: jest.fn(),
    revoke: jest.fn(),
    revokeAllForUser: jest.fn(),
  };

  const useCase = new LoginUseCase(users, passwords, tokens, refreshTokens);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns tokens and public user on valid credentials', async () => {
    const user = makeUser();
    users.findByEmail.mockResolvedValue(user);
    passwords.verify.mockResolvedValue(true);
    tokens.signAccessToken.mockResolvedValue('access-token');
    tokens.generateRefreshToken.mockReturnValue('refresh-raw');
    tokens.hashRefreshToken.mockReturnValue('refresh-hash');
    refreshTokens.create.mockResolvedValue({
      id: 'rt-1',
      userId: user.id,
      tokenHash: 'refresh-hash',
      expiresAt: new Date(Date.now() + 1000),
      revokedAt: null,
      replacedByTokenId: null,
    });

    const actual = await useCase.execute({
      email: 'Admin@Example.com',
      password: 'Secret123!',
    });

    expect(users.findByEmail).toHaveBeenCalledWith('admin@example.com');
    expect(actual.accessToken).toBe('access-token');
    expect(actual.refreshToken).toBe('refresh-raw');
    expect(actual.user).not.toHaveProperty('passwordHash');
    expect(actual.user.email).toBe('admin@example.com');
  });

  it('rejects unknown email with invalid credentials', async () => {
    users.findByEmail.mockResolvedValue(null);

    await expect(
      useCase.execute({ email: 'x@y.com', password: 'x' }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
  });

  it('rejects wrong password with invalid credentials', async () => {
    users.findByEmail.mockResolvedValue(makeUser());
    passwords.verify.mockResolvedValue(false);

    await expect(
      useCase.execute({ email: 'admin@example.com', password: 'bad' }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
  });

  it('rejects inactive users without revealing status', async () => {
    users.findByEmail.mockResolvedValue(makeUser({ isActive: false }));

    await expect(
      useCase.execute({ email: 'admin@example.com', password: 'Secret123!' }),
    ).rejects.toMatchObject({ code: 'AUTH_INVALID_CREDENTIALS' });
  });
});
