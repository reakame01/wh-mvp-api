import { Role } from '../../../domain/auth/role';

export const TOKEN_SERVICE = Symbol('TOKEN_SERVICE');

export type AccessTokenPayload = {
  sub: string;
  email: string;
  role: Role;
  typ: 'access';
};

export interface TokenPort {
  signAccessToken(payload: Omit<AccessTokenPayload, 'typ'>): Promise<string>;
  verifyAccessToken(token: string): Promise<AccessTokenPayload>;
  generateRefreshToken(): string;
  hashRefreshToken(raw: string): string;
}
