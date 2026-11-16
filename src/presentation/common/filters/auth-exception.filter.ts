import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthError } from '../../../domain/auth/auth.errors';

const STATUS_BY_CODE: Record<string, number> = {
  AUTH_INVALID_CREDENTIALS: HttpStatus.UNAUTHORIZED,
  AUTH_INVALID_REFRESH: HttpStatus.UNAUTHORIZED,
  AUTH_UNAUTHORIZED: HttpStatus.UNAUTHORIZED,
  AUTH_FORBIDDEN: HttpStatus.FORBIDDEN,
  USER_NOT_FOUND: HttpStatus.NOT_FOUND,
  USER_EMAIL_TAKEN: HttpStatus.CONFLICT,
};

@Catch(AuthError)
export class AuthExceptionFilter implements ExceptionFilter {
  catch(exception: AuthError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status =
      STATUS_BY_CODE[exception.code] ?? HttpStatus.INTERNAL_SERVER_ERROR;
    response.status(status).json({
      code: exception.code,
      message: exception.message,
    });
  }
}
