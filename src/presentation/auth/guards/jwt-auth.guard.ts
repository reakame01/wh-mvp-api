import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UnauthorizedError } from '../../../domain/auth/auth.errors';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser>(err: Error | null, user: TUser): TUser {
    if (err || !user) {
      throw err instanceof UnauthorizedError ? err : new UnauthorizedError();
    }
    return user;
  }
}
