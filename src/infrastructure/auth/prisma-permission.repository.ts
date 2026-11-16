import { Injectable } from '@nestjs/common';
import {
  PermissionRepositoryPort,
  RolePermissionRow,
} from '../../application/auth/ports/permission.repository.port';
import { Role } from '../../domain/auth/role';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrismaPermissionRepository implements PermissionRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async listRolePermissions(): Promise<RolePermissionRow[]> {
    const rows = await this.prisma.rolePermission.findMany({
      include: { permission: true },
    });
    return rows.map((row) => ({
      role: row.role as Role,
      code: row.permission.code,
    }));
  }
}
