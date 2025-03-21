import { HttpStatus } from '@nestjs/common';

export const RegisterSwagger = {
  operation: {
    summary: 'Registrar un nuevo usuario',
    description:
      'Crea una nueva cuenta de usuario y retorna los tokens de acceso',
  },
  responses: {
    [HttpStatus.CREATED]: {
      description: 'Usuario registrado exitosamente',
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
    [HttpStatus.BAD_REQUEST]: {
      description: 'Datos de registro inválidos',
      schema: {
        properties: {
          message: {
            type: 'string',
            example: 'Error al registrar el usuario',
          },
          details: {
            type: 'string',
            example: 'El formato del email es inválido',
          },
        },
      },
    },
    [HttpStatus.CONFLICT]: {
      description: 'El usuario ya existe',
      schema: {
        properties: {
          message: {
            type: 'string',
            example: 'Usuario con email example@mail.com ya existe',
          },
        },
      },
    },
  },
};
