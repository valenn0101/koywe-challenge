import { HttpStatus } from '@nestjs/common';

export const LoginSwagger = {
  operation: {
    summary: 'Iniciar sesión',
    description: 'Autentica al usuario y retorna los tokens de acceso',
  },
  responses: {
    [HttpStatus.OK]: {
      description: 'Inicio de sesión exitoso',
      schema: {
        properties: {
          accessToken: {
            type: 'string',
            description: 'Token JWT para autenticación',
          },
          refreshToken: {
            type: 'string',
            description: 'Token JWT para renovar el accessToken',
          },
        },
      },
    },
    [HttpStatus.UNAUTHORIZED]: {
      description: 'Credenciales inválidas',
      schema: {
        properties: {
          message: {
            type: 'string',
            example: 'Credenciales inválidas',
          },
          details: {
            type: 'string',
            example: 'El email o la contraseña son incorrectos',
          },
        },
      },
    },
  },
};
