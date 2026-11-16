import { Injectable } from '@nestjs/common';
import {
  CreateRefreshTokenInput,
  RefreshTokenRecord,
  RefreshTokenRepositoryPort,
} from '../../application/auth/ports/refresh-token.repository.port';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrismaRefreshTokenRepository implements RefreshTokenRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateRefreshTokenInput): Promise<RefreshTokenRecord> {
    const row = await this.prisma.refreshToken.create({
      data: {
        userId: input.userId,
        tokenHash: input.tokenHash,
        expiresAt: input.expiresAt,
      },
    });
    return this.map(row);
  }

  async findByTokenHash(tokenHash: string): Promise<RefreshTokenRecord | null> {
    const row = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });
    return row ? this.map(row) : null;
  }

  async revoke(id: string, replacedByTokenId?: string): Promise<void> {
    await this.prisma.refreshToken.update({
      where: { id },
      data: {
        revokedAt: new Date(),
        replacedByTokenId: replacedByTokenId ?? null,
      },
    });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private map(row: {
    id: string;
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    revokedAt: Date | null;
    replacedByTokenId: string | null;
  }): RefreshTokenRecord {
    return {
      id: row.id,
      userId: row.userId,
      tokenHash: row.tokenHash,
      expiresAt: row.expiresAt,
      revokedAt: row.revokedAt,
      replacedByTokenId: row.replacedByTokenId,
    };
  }
}
