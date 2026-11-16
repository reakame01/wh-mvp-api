import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Role } from '../../../domain/auth/role';

export type RequestUser = {
  userId: string;
  email: string;
  role: Role;
};

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): RequestUser => {
    const request = ctx.switchToHttp().getRequest<{ user: RequestUser }>();
    return request.user;
  },
);
