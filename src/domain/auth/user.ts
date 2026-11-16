import { Role } from './role';

export type User = {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  role: Role;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type PublicUser = Omit<User, 'passwordHash'>;

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
