import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ForbiddenError } from '../../../domain/auth/auth.errors';
import { Role } from '../../../domain/auth/role';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  const reflector = {
    getAllAndOverride: jest.fn(),
  } as unknown as Reflector;
  const guard = new RolesGuard(reflector);

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

  it('allows when no roles required', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(undefined);
    expect(guard.canActivate(ctxWithUser(Role.Viewer))).toBe(true);
  });

  it('allows matching role', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([Role.Admin]);
    expect(guard.canActivate(ctxWithUser(Role.Admin))).toBe(true);
  });

  it('forbids mismatched role', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([Role.Admin]);
    expect(() => guard.canActivate(ctxWithUser(Role.Staff))).toThrow(
      ForbiddenError,
    );
  });
});
