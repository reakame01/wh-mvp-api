import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ForbiddenError } from '../../../domain/auth/auth.errors';
import { Role } from '../../../domain/auth/role';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { RequestUser } from '../decorators/current-user.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) {
      return true;
    }
    const request = context.switchToHttp().getRequest<{ user?: RequestUser }>();
    const user = request.user;
    if (!user || !required.includes(user.role)) {
      throw new ForbiddenError();
    }
    return true;
  }
}
