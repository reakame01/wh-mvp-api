import { Role } from './role';
import { PERMISSION_CODES, type PermissionCode } from './permission';

/**
 * Seed matrix for Stage 2 (ADR 0002 / auth-rbac spec).
 * users:* → Admin only; *:read → all roles; other *:write → Manager + Admin.
 */
export function rolesForPermission(code: PermissionCode): Role[] {
  if (code.startsWith('users:')) {
    return [Role.Admin];
  }
  if (code.endsWith(':read')) {
    return [Role.Viewer, Role.Staff, Role.Manager, Role.Admin];
  }
  return [Role.Manager, Role.Admin];
}

export function buildRolePermissionPairs(): Array<{
  role: Role;
  code: PermissionCode;
}> {
  const pairs: Array<{ role: Role; code: PermissionCode }> = [];
  for (const code of PERMISSION_CODES) {
    for (const role of rolesForPermission(code)) {
      pairs.push({ role, code });
    }
  }
  return pairs;
}
