import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolePermissionCatalog } from '../../../application/auth/role-permission.catalog';
import { ForbiddenError } from '../../../domain/auth/auth.errors';
import { Role } from '../../../domain/auth/role';
import { PermissionsGuard } from './permissions.guard';

describe('PermissionsGuard', () => {
  const reflector = {
    getAllAndOverride: jest.fn(),
  } as unknown as Reflector;
  const catalog = {
    hasPermission: jest.fn(),
  } as unknown as RolePermissionCatalog;
  const guard = new PermissionsGuard(reflector, catalog);

  function ctxWithUser(role?: Role): ExecutionContext {
    return {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({
          user: role ? { userId: 'u1', email: 'a@b.com', role } : undefined,
        }),
      }),
    } as unknown as ExecutionContext;
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('allows when no permissions required', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(undefined);
    expect(guard.canActivate(ctxWithUser(Role.Viewer))).toBe(true);
  });

  it('allows when role has all required permissions', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['users:write']);
    (catalog.hasPermission as jest.Mock).mockReturnValue(true);

    expect(guard.canActivate(ctxWithUser(Role.Admin))).toBe(true);
    expect(catalog.hasPermission).toHaveBeenCalledWith(
      Role.Admin,
      'users:write',
    );
  });

  it('forbids when role lacks a required permission', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['users:write']);
    (catalog.hasPermission as jest.Mock).mockReturnValue(false);

    expect(() => guard.canActivate(ctxWithUser(Role.Manager))).toThrow(
      ForbiddenError,
    );
  });

  it('forbids when user is missing', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['users:write']);

    expect(() => guard.canActivate(ctxWithUser(undefined))).toThrow(
      ForbiddenError,
    );
  });
});
