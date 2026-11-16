import { Role } from '../../../domain/auth/role';

export const PERMISSION_REPOSITORY = Symbol('PERMISSION_REPOSITORY');

export type RolePermissionRow = {
  role: Role;
  code: string;
};

export interface PermissionRepositoryPort {
  listRolePermissions(): Promise<RolePermissionRow[]>;
}
