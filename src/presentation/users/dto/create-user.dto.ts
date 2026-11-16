import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator';
import { Role } from '../../../domain/auth/role';

export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  @MinLength(1)
  fullName!: string;

  @IsEnum(Role)
  role!: Role;
}
