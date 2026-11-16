import { InvalidRefreshTokenError } from '../../domain/auth/auth.errors';
import { Role } from '../../domain/auth/role';
import { User } from '../../domain/auth/user';
import { RefreshUseCase } from './refresh.use-case';
import { RefreshTokenRepositoryPort } from './ports/refresh-token.repository.port';
import { TokenPort } from './ports/token.port';
import { UserRepositoryPort } from './ports/user.repository.port';

describe('RefreshUseCase', () => {
  const users: jest.Mocked<UserRepositoryPort> = {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
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

  const useCase = new RefreshUseCase(users, tokens, refreshTokens);

  const user: User = {
    id: 'user-1',
    email: 'admin@example.com',
    passwordHash: 'hashed',
    fullName: 'Admin',
    role: Role.Admin,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rotates refresh token and returns new pair', async () => {
    tokens.hashRefreshToken.mockImplementation((raw: string) => `hash:${raw}`);
    refreshTokens.findByTokenHash.mockResolvedValue({
      id: 'old-id',
      userId: user.id,
      tokenHash: 'hash:old-raw',
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
      replacedByTokenId: null,
    });
    users.findById.mockResolvedValue(user);
    tokens.generateRefreshToken.mockReturnValue('new-raw');
    refreshTokens.create.mockResolvedValue({
      id: 'new-id',
      userId: user.id,
      tokenHash: 'hash:new-raw',
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
      replacedByTokenId: null,
    });
    tokens.signAccessToken.mockResolvedValue('new-access');

    const actual = await useCase.execute({ refreshToken: 'old-raw' });

    expect(refreshTokens.revoke).toHaveBeenCalledWith('old-id', 'new-id');
    expect(actual.refreshToken).toBe('new-raw');
    expect(actual.accessToken).toBe('new-access');
  });

  it('rejects revoked refresh token', async () => {
    tokens.hashRefreshToken.mockReturnValue('hash');
    refreshTokens.findByTokenHash.mockResolvedValue({
      id: 'old-id',
      userId: user.id,
      tokenHash: 'hash',
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: new Date(),
      replacedByTokenId: null,
    });

    await expect(
      useCase.execute({ refreshToken: 'old-raw' }),
    ).rejects.toBeInstanceOf(InvalidRefreshTokenError);
  });

  it('rejects expired refresh token', async () => {
    tokens.hashRefreshToken.mockReturnValue('hash');
    refreshTokens.findByTokenHash.mockResolvedValue({
      id: 'old-id',
      userId: user.id,
      tokenHash: 'hash',
      expiresAt: new Date(Date.now() - 1000),
      revokedAt: null,
      replacedByTokenId: null,
    });

    await expect(
      useCase.execute({ refreshToken: 'old-raw' }),
    ).rejects.toBeInstanceOf(InvalidRefreshTokenError);
  });
});
