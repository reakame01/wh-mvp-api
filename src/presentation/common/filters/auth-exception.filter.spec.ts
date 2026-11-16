import { ArgumentsHost } from '@nestjs/common';
import { InvalidCredentialsError } from '../../../domain/auth/auth.errors';
import { AuthExceptionFilter } from './auth-exception.filter';

describe('AuthExceptionFilter', () => {
  it('maps auth errors to typed JSON responses', () => {
    const filter = new AuthExceptionFilter();
    const status = jest.fn().mockReturnThis();
    const json = jest.fn();
    const host = {
      switchToHttp: () => ({
        getResponse: () => ({ status, json }),
      }),
    } as unknown as ArgumentsHost;

    filter.catch(new InvalidCredentialsError(), host);

    expect(status).toHaveBeenCalledWith(401);
    expect(json).toHaveBeenCalledWith({
      code: 'AUTH_INVALID_CREDENTIALS',
      message: 'Invalid email or password',
    });
  });
});
