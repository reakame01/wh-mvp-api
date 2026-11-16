import { Role } from '../../domain/auth/role';
import { PermissionRepositoryPort } from './ports/permission.repository.port';
import { RolePermissionCatalog } from './role-permission.catalog';

describe('RolePermissionCatalog', () => {
  const repo: jest.Mocked<PermissionRepositoryPort> = {
    listRolePermissions: jest.fn(),
  };
  const catalog = new RolePermissionCatalog(repo);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('allows Admin users:write and denies Viewer users:write after load', async () => {
    repo.listRolePermissions.mockResolvedValue([
      { role: Role.Admin, code: 'users:write' },
      { role: Role.Viewer, code: 'products:read' },
      { role: Role.Admin, code: 'products:read' },
    ]);

    await catalog.reload();

    expect(catalog.hasPermission(Role.Admin, 'users:write')).toBe(true);
    expect(catalog.hasPermission(Role.Viewer, 'users:write')).toBe(false);
    expect(catalog.codesForRole(Role.Viewer)).toEqual(['products:read']);
  });

  it('returns empty permissions before reload', () => {
    const fresh = new RolePermissionCatalog(repo);
    expect(fresh.hasPermission(Role.Admin, 'users:write')).toBe(false);
    expect(fresh.codesForRole(Role.Admin)).toEqual([]);
  });
});
