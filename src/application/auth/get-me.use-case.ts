import { Inject, Injectable } from '@nestjs/common';
import { UserNotFoundError } from '../../domain/auth/auth.errors';
import { toPublicUser } from '../../domain/auth/user';
import {
  USER_REPOSITORY,
  type UserRepositoryPort,
} from './ports/user.repository.port';
import { RolePermissionCatalog } from './role-permission.catalog';

@Injectable()
export class GetMeUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly users: UserRepositoryPort,
    private readonly catalog: RolePermissionCatalog,
  ) {}

  async execute(userId: string) {
    const user = await this.users.findById(userId);
    if (!user || !user.isActive) {
      throw new UserNotFoundError();
    }
    return {
      ...toPublicUser(user),
      permissions: this.catalog.codesForRole(user.role),
    };
  }
}
