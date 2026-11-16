import { createHash, randomBytes } from 'crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  AccessTokenPayload,
  TokenPort,
} from '../../application/auth/ports/token.port';
import { Role } from '../../domain/auth/role';

@Injectable()
export class JwtTokenService implements TokenPort {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  signAccessToken(payload: Omit<AccessTokenPayload, 'typ'>): Promise<string> {
    return this.jwt.signAsync(
      { ...payload, typ: 'access' },
      {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: '15m',
      },
    );
  }

  async verifyAccessToken(token: string): Promise<AccessTokenPayload> {
    const payload = await this.jwt.verifyAsync<AccessTokenPayload>(token, {
      secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
    });
    if (payload.typ !== 'access') {
      throw new Error('Invalid token type');
    }
    if (!Object.values(Role).includes(payload.role)) {
      throw new Error('Invalid role in token');
    }
    return payload;
  }

  generateRefreshToken(): string {
    return randomBytes(48).toString('base64url');
  }

  hashRefreshToken(raw: string): string {
    const pepper = this.config.get<string>('JWT_REFRESH_SECRET') ?? '';
    return createHash('sha256').update(`${pepper}:${raw}`).digest('hex');
  }
}
