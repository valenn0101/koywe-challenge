import { HttpException, HttpStatus } from '@nestjs/common';

export class TokenExpiredException extends HttpException {
  constructor() {
    super(
      {
        message: 'Token expirado',
        details: 'El token de autenticación ha expirado',
      },
      HttpStatus.UNAUTHORIZED,
    );
  }
}

export class InvalidTokenException extends HttpException {
  constructor() {
    super(
      {
        message: 'Token inválido',
        details: 'El token de autenticación proporcionado no es válido',
      },
      HttpStatus.UNAUTHORIZED,
    );
  }
}

export class UnauthorizedException extends HttpException {
  constructor() {
    super(
      {
        message: 'No autorizado',
        details: 'No tiene permisos para acceder a este recurso',
      },
      HttpStatus.UNAUTHORIZED,
    );
  }
}

export class SessionExpiredException extends HttpException {
  constructor() {
    super(
      {
        message: 'Sesión expirada',
        details: 'La sesión ha expirado, por favor inicie sesión nuevamente',
      },
      HttpStatus.UNAUTHORIZED,
    );
  }
}

export class InvalidRefreshTokenException extends HttpException {
  constructor() {
    super(
      {
        message: 'Refresh token inválido',
        details: 'El token de actualización proporcionado no es válido',
      },
      HttpStatus.UNAUTHORIZED,
    );
  }
}

export class AuthenticationFailedException extends HttpException {
  constructor(details: string = 'Error en el proceso de autenticación') {
    super(
      {
        message: 'Fallo en la autenticación',
        details,
      },
      HttpStatus.UNAUTHORIZED,
    );
  }
}
