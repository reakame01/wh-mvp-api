import { Inject, Injectable } from '@nestjs/common';
import {
  ForbiddenError,
  UserEmailTakenError,
} from '../../domain/auth/auth.errors';
import { Role } from '../../domain/auth/role';
import { toPublicUser } from '../../domain/auth/user';
import {
  PASSWORD_HASHER,
  PasswordHasherPort,
} from './ports/password-hasher.port';
import {
  USER_REPOSITORY,
  UserRepositoryPort,
} from './ports/user.repository.port';

export type CreateUserInput = {
  actorRole: Role;
  email: string;
  password: string;
  fullName: string;
  role: Role;
};

@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly users: UserRepositoryPort,
    @Inject(PASSWORD_HASHER)
    private readonly passwords: PasswordHasherPort,
  ) {}

  async execute(input: CreateUserInput) {
    if (input.actorRole !== Role.Admin) {
      throw new ForbiddenError('Only Admin can create users');
    }
    const email = input.email.trim().toLowerCase();
    const existing = await this.users.findByEmail(email);
    if (existing) {
      throw new UserEmailTakenError();
    }
    const passwordHash = await this.passwords.hash(input.password);
    const user = await this.users.create({
      email,
      passwordHash,
      fullName: input.fullName.trim(),
      role: input.role,
    });
    return toPublicUser(user);
  }
}
