import { Role } from '../../../domain/auth/role';
import { User } from '../../../domain/auth/user';

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export type CreateUserInput = {
  email: string;
  passwordHash: string;
  fullName: string;
  role: Role;
};

export interface UserRepositoryPort {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  create(input: CreateUserInput): Promise<User>;
}
