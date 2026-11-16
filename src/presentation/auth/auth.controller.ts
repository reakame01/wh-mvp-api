import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  UseGuards,
} from '@nestjs/common';
import { GetMeUseCase } from '../../application/auth/get-me.use-case';
import { LoginUseCase } from '../../application/auth/login.use-case';
import { LogoutUseCase } from '../../application/auth/logout.use-case';
import { RefreshUseCase } from '../../application/auth/refresh.use-case';
import { CurrentUser, RequestUser } from './decorators/current-user.decorator';
import { LoginDto } from './dto/login.dto';
import { LogoutDto } from './dto/logout.dto';
import { RefreshDto } from './dto/refresh.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshUseCase: RefreshUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly getMeUseCase: GetMeUseCase,
  ) {}

  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.loginUseCase.execute(dto);
  }

  @Post('refresh')
  @HttpCode(200)
  refresh(@Body() dto: RefreshDto) {
    return this.refreshUseCase.execute(dto);
  }

  @Post('logout')
  @HttpCode(204)
  @UseGuards(JwtAuthGuard)
  async logout(
    @CurrentUser() user: RequestUser,
    @Body() dto: LogoutDto,
  ): Promise<void> {
    await this.logoutUseCase.execute({
      userId: user.userId,
      refreshToken: dto.refreshToken,
    });
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: RequestUser) {
    return this.getMeUseCase.execute(user.userId);
  }
}
