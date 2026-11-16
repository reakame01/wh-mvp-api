import { Inject, Injectable } from '@nestjs/common';
import {
  InvalidCredentialsError,
  UserInactiveError,
} from '../../domain/auth/auth.errors';
import { toPublicUser } from '../../domain/auth/user';
import {
  PASSWORD_HASHER,
  type PasswordHasherPort,
} from './ports/password-hasher.port';
import {
  REFRESH_TOKEN_REPOSITORY,
  type RefreshTokenRepositoryPort,
} from './ports/refresh-token.repository.port';
import { TOKEN_SERVICE, type TokenPort } from './ports/token.port';
import {
  USER_REPOSITORY,
  type UserRepositoryPort,
} from './ports/user.repository.port';

const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export type LoginInput = {
  email: string;
  password: string;
};

export type AuthTokensResult = {
  accessToken: string;
  refreshToken: string;
  user: ReturnType<typeof toPublicUser>;
};

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly users: UserRepositoryPort,
    @Inject(PASSWORD_HASHER)
    private readonly passwords: PasswordHasherPort,
    @Inject(TOKEN_SERVICE)
    private readonly tokens: TokenPort,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokens: RefreshTokenRepositoryPort,
  ) {}

  async execute(input: LoginInput): Promise<AuthTokensResult> {
    const email = input.email.trim().toLowerCase();
    const user = await this.users.findByEmail(email);
    if (!user) {
      throw new InvalidCredentialsError();
    }
    if (!user.isActive) {
      throw new UserInactiveError();
    }
    const ok = await this.passwords.verify(input.password, user.passwordHash);
    if (!ok) {
      throw new InvalidCredentialsError();
    }
    const accessToken = await this.tokens.signAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
    const refreshToken = this.tokens.generateRefreshToken();
    await this.refreshTokens.create({
      userId: user.id,
      tokenHash: this.tokens.hashRefreshToken(refreshToken),
      expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
    });
    return {
      accessToken,
      refreshToken,
      user: toPublicUser(user),
    };
  }
}
