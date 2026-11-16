import { Inject, Injectable } from '@nestjs/common';
import { InvalidRefreshTokenError } from '../../domain/auth/auth.errors';
import { toPublicUser } from '../../domain/auth/user';
import {
  REFRESH_TOKEN_REPOSITORY,
  type RefreshTokenRepositoryPort,
} from './ports/refresh-token.repository.port';
import { TOKEN_SERVICE, type TokenPort } from './ports/token.port';
import {
  USER_REPOSITORY,
  type UserRepositoryPort,
} from './ports/user.repository.port';
import { AuthTokensResult } from './login.use-case';

const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export type RefreshInput = {
  refreshToken: string;
};

@Injectable()
export class RefreshUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly users: UserRepositoryPort,
    @Inject(TOKEN_SERVICE)
    private readonly tokens: TokenPort,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokens: RefreshTokenRepositoryPort,
  ) {}

  async execute(input: RefreshInput): Promise<AuthTokensResult> {
    const tokenHash = this.tokens.hashRefreshToken(input.refreshToken);
    const existing = await this.refreshTokens.findByTokenHash(tokenHash);
    if (
      !existing ||
      existing.revokedAt ||
      existing.expiresAt.getTime() <= Date.now()
    ) {
      throw new InvalidRefreshTokenError();
    }
    const user = await this.users.findById(existing.userId);
    if (!user || !user.isActive) {
      throw new InvalidRefreshTokenError();
    }
    const newRefreshToken = this.tokens.generateRefreshToken();
    const created = await this.refreshTokens.create({
      userId: user.id,
      tokenHash: this.tokens.hashRefreshToken(newRefreshToken),
      expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
    });
    await this.refreshTokens.revoke(existing.id, created.id);
    const accessToken = await this.tokens.signAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
    return {
      accessToken,
      refreshToken: newRefreshToken,
      user: toPublicUser(user),
    };
  }
}
