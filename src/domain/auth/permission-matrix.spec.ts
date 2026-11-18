import { Role } from './role';
import {
  buildRolePermissionPairs,
  rolesForPermission,
} from './permission-matrix';

describe('permission matrix (seed rules)', () => {
  it('grants users:write only to Admin', () => {
    expect(rolesForPermission('users:write')).toEqual([Role.Admin]);
    expect(rolesForPermission('users:read')).toEqual([Role.Admin]);
  });

  it('grants products:read to all roles', () => {
    expect(rolesForPermission('products:read')).toEqual([
      Role.Viewer,
      Role.Staff,
      Role.Manager,
      Role.Admin,
    ]);
  });

  it('grants products:write to Manager and Admin only', () => {
    expect(rolesForPermission('products:write')).toEqual([
      Role.Manager,
      Role.Admin,
    ]);
  });

  it('grants stock:read to all roles and stock:write to Manager+Admin', () => {
    expect(rolesForPermission('stock:read')).toEqual([
      Role.Viewer,
      Role.Staff,
      Role.Manager,
      Role.Admin,
    ]);
    expect(rolesForPermission('stock:write')).toEqual([
      Role.Manager,
      Role.Admin,
    ]);
  });

  it('does not give Viewer any write permission', () => {
    const viewerWrites = buildRolePermissionPairs().filter(
      (p) => p.role === Role.Viewer && p.code.endsWith(':write'),
    );
    expect(viewerWrites).toEqual([]);
  });
});
