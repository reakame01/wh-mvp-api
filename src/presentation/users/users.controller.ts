import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CreateUserUseCase } from '../../application/auth/create-user.use-case';
import { Role } from '../../domain/auth/role';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { RequestUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly createUserUseCase: CreateUserUseCase) {}

  @Post()
  @Roles(Role.Admin)
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
