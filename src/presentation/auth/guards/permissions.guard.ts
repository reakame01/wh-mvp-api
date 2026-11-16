import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolePermissionCatalog } from '../../../application/auth/role-permission.catalog';
import { ForbiddenError } from '../../../domain/auth/auth.errors';
import { RequestUser } from '../decorators/current-user.decorator';
import { PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly catalog: RolePermissionCatalog,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required || required.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: RequestUser }>();
    const user = request.user;
    if (!user) {
      throw new ForbiddenError();
    }

    const missing = required.some(
      (code) => !this.catalog.hasPermission(user.role, code),
    );
    if (missing) {
      throw new ForbiddenError();
    }
    return true;
  }
}
