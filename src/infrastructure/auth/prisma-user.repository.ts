import { Injectable } from '@nestjs/common';
import { Role as PrismaRole } from '@prisma/client';
import {
  CreateUserInput,
  UserRepositoryPort,
} from '../../application/auth/ports/user.repository.port';
import { Role } from '../../domain/auth/role';
import { User } from '../../domain/auth/user';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrismaUserRepository implements UserRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { email } });
    return row ? this.map(row) : null;
  }

  async findById(id: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { id } });
    return row ? this.map(row) : null;
  }

  async create(input: CreateUserInput): Promise<User> {
    const row = await this.prisma.user.create({
      data: {
        email: input.email,
        passwordHash: input.passwordHash,
        fullName: input.fullName,
        role: input.role,
      },
    });
    return this.map(row);
  }

  private map(row: {
    id: string;
    email: string;
    passwordHash: string;
    fullName: string;
    role: PrismaRole;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): User {
    return {
      id: row.id,
      email: row.email,
      passwordHash: row.passwordHash,
      fullName: row.fullName,
      role: row.role as Role,
      isActive: row.isActive,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
