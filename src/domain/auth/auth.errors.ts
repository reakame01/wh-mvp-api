export class AuthError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

export class InvalidCredentialsError extends AuthError {
  constructor() {
    super('AUTH_INVALID_CREDENTIALS', 'Invalid email or password');
  }
}

export class InvalidRefreshTokenError extends AuthError {
  constructor() {
    super('AUTH_INVALID_REFRESH', 'Invalid or expired refresh token');
  }
}

export class UnauthorizedError extends AuthError {
  constructor() {
    super('AUTH_UNAUTHORIZED', 'Unauthorized');
  }
}

export class ForbiddenError extends AuthError {
  constructor(message = 'Forbidden') {
    super('AUTH_FORBIDDEN', message);
  }
}

export class UserNotFoundError extends AuthError {
  constructor() {
    super('USER_NOT_FOUND', 'User not found');
  }
}

export class UserEmailTakenError extends AuthError {
  constructor() {
    super('USER_EMAIL_TAKEN', 'Email is already registered');
  }
}

export class UserInactiveError extends AuthError {
  constructor() {
    super('AUTH_INVALID_CREDENTIALS', 'Invalid email or password');
  }
}
