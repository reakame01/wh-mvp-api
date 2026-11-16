import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CreateUserUseCase } from '../../application/auth/create-user.use-case';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { RequestUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsersController {
  constructor(private readonly createUserUseCase: CreateUserUseCase) {}

  @Post()
  @RequirePermissions('users:write')
  create(@CurrentUser() actor: RequestUser, @Body() dto: CreateUserDto) {
    return this.createUserUseCase.execute({
      actorRole: actor.role,
      email: dto.email,
      password: dto.password,
      fullName: dto.fullName,
      role: dto.role,
    });
  }
}
