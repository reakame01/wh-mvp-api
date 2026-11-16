import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { Role } from '../../domain/auth/role';
import {
  PERMISSION_REPOSITORY,
  type PermissionRepositoryPort,
} from './ports/permission.repository.port';

@Injectable()
export class RolePermissionCatalog implements OnModuleInit {
  private readonly byRole = new Map<Role, Set<string>>();

  constructor(
    @Inject(PERMISSION_REPOSITORY)
    private readonly permissions: PermissionRepositoryPort,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.reload();
  }

  async reload(): Promise<void> {
    const rows = await this.permissions.listRolePermissions();
    this.byRole.clear();
    for (const row of rows) {
      let set = this.byRole.get(row.role);
      if (!set) {
        set = new Set<string>();
        this.byRole.set(row.role, set);
      }
      set.add(row.code);
    }
  }

  hasPermission(role: Role, code: string): boolean {
    return this.byRole.get(role)?.has(code) ?? false;
  }

  codesForRole(role: Role): string[] {
    return [...(this.byRole.get(role) ?? [])].sort();
  }
}
