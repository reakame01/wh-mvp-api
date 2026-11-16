import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { CreateUserUseCase } from '../../application/auth/create-user.use-case';
import { GetMeUseCase } from '../../application/auth/get-me.use-case';
import { LoginUseCase } from '../../application/auth/login.use-case';
import { LogoutUseCase } from '../../application/auth/logout.use-case';
import { PASSWORD_HASHER } from '../../application/auth/ports/password-hasher.port';
import { PERMISSION_REPOSITORY } from '../../application/auth/ports/permission.repository.port';
import { REFRESH_TOKEN_REPOSITORY } from '../../application/auth/ports/refresh-token.repository.port';
import { TOKEN_SERVICE } from '../../application/auth/ports/token.port';
import { USER_REPOSITORY } from '../../application/auth/ports/user.repository.port';
import { RefreshUseCase } from '../../application/auth/refresh.use-case';
import { RolePermissionCatalog } from '../../application/auth/role-permission.catalog';
import { BcryptPasswordHasher } from '../../infrastructure/auth/bcrypt-password.hasher';
import { JwtTokenService } from '../../infrastructure/auth/jwt-token.service';
import { PrismaPermissionRepository } from '../../infrastructure/auth/prisma-permission.repository';
import { PrismaRefreshTokenRepository } from '../../infrastructure/auth/prisma-refresh-token.repository';
import { PrismaUserRepository } from '../../infrastructure/auth/prisma-user.repository';
import { UsersController } from '../users/users.controller';
import { AuthController } from './auth.controller';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { RolesGuard } from './guards/roles.guard';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      }),
    }),
  ],
  controllers: [AuthController, UsersController],
  providers: [
    LoginUseCase,
    RefreshUseCase,
    LogoutUseCase,
    GetMeUseCase,
    CreateUserUseCase,
    JwtStrategy,
    JwtAuthGuard,
    RolesGuard,
    PermissionsGuard,
    RolePermissionCatalog,
    { provide: PASSWORD_HASHER, useClass: BcryptPasswordHasher },
    { provide: TOKEN_SERVICE, useClass: JwtTokenService },
    { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
    {
      provide: REFRESH_TOKEN_REPOSITORY,
      useClass: PrismaRefreshTokenRepository,
    },
    {
      provide: PERMISSION_REPOSITORY,
      useClass: PrismaPermissionRepository,
    },
  ],
  exports: [
    JwtAuthGuard,
    RolesGuard,
    PermissionsGuard,
    RolePermissionCatalog,
    USER_REPOSITORY,
    PASSWORD_HASHER,
  ],
})
export class AuthModule {}
