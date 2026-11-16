import { LogoutUseCase } from './logout.use-case';
import { RefreshTokenRepositoryPort } from './ports/refresh-token.repository.port';
import { TokenPort } from './ports/token.port';

describe('LogoutUseCase', () => {
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
  const useCase = new LogoutUseCase(tokens, refreshTokens);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('revokes the provided refresh token when owned by user', async () => {
    tokens.hashRefreshToken.mockReturnValue('hash');
    refreshTokens.findByTokenHash.mockResolvedValue({
      id: 'rt-1',
      userId: 'user-1',
      tokenHash: 'hash',
      expiresAt: new Date(Date.now() + 1000),
      revokedAt: null,
      replacedByTokenId: null,
    });

    await useCase.execute({ userId: 'user-1', refreshToken: 'raw' });

    expect(refreshTokens.revoke).toHaveBeenCalledWith('rt-1');
    expect(refreshTokens.revokeAllForUser).not.toHaveBeenCalled();
  });

  it('revokes all tokens when refresh token omitted', async () => {
    await useCase.execute({ userId: 'user-1' });

    expect(refreshTokens.revokeAllForUser).toHaveBeenCalledWith('user-1');
  });
});
