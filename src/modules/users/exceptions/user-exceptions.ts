import { HttpException, HttpStatus } from '@nestjs/common';

export class UserAlreadyExistsException extends HttpException {
  constructor(email: string) {
    super(`Usuario con email ${email} ya existe`, HttpStatus.CONFLICT);
  }
}

export class UserNotFoundException extends HttpException {
  constructor(identifier: number | string) {
    super(
      {
        message: 'Usuario no encontrado',
        details: `No se pudo encontrar el usuario con identificador: ${identifier}`,
      },
      HttpStatus.NOT_FOUND,
    );
  }
}

export class InvalidCredentialsException extends HttpException {
  constructor() {
    super('Credenciales inválidas', HttpStatus.UNAUTHORIZED);
  }
}

export class PasswordHashFailedException extends HttpException {
  constructor() {
    super('Error al procesar la contraseña', HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

export class IncompleteFormDataException extends HttpException {
  constructor(missingFields: string[]) {
    super(
      {
        message: 'Datos de formulario incompletos',
        details: `Los siguientes campos son obligatorios: ${missingFields.join(', ')}`,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class PasswordValidationException extends HttpException {
  constructor() {
    super(
      {
        message: 'Contraseña insegura',
        details:
          'La contraseña debe tener al menos 8 caracteres y contener al menos un carácter especial',
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}
