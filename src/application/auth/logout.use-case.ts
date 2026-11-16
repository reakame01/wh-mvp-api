import { Inject, Injectable } from '@nestjs/common';
import {
  REFRESH_TOKEN_REPOSITORY,
  type RefreshTokenRepositoryPort,
} from './ports/refresh-token.repository.port';
import { TOKEN_SERVICE, type TokenPort } from './ports/token.port';

export type LogoutInput = {
  userId: string;
  refreshToken?: string;
};

@Injectable()
export class LogoutUseCase {
  constructor(
    @Inject(TOKEN_SERVICE)
    private readonly tokens: TokenPort,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokens: RefreshTokenRepositoryPort,
  ) {}

  async execute(input: LogoutInput): Promise<void> {
    if (input.refreshToken) {
      const tokenHash = this.tokens.hashRefreshToken(input.refreshToken);
      const existing = await this.refreshTokens.findByTokenHash(tokenHash);
      if (existing && existing.userId === input.userId && !existing.revokedAt) {
        await this.refreshTokens.revoke(existing.id);
        return;
      }
    }
    await this.refreshTokens.revokeAllForUser(input.userId);
  }
}
