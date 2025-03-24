import { HttpStatus } from '@nestjs/common';

export const RefreshSwagger = {
  operation: {
    summary: 'Refrescar tokens',
    description: 'Renueva los tokens de acceso usando el refresh token.',
  },
  responses: {
    [HttpStatus.OK]: {
      description: 'Tokens actualizados exitosamente',
      schema: {
        properties: {
          accessToken: {
            type: 'string',
            description: 'Nuevo token JWT para autenticación',
            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          },
          refreshToken: {
            type: 'string',
            description: 'Nuevo token JWT para renovar el accessToken',
            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          },
          user: {
            type: 'object',
            description: 'Datos del usuario autenticado',
            properties: {
              id: {
                type: 'number',
                description: 'ID único del usuario',
                example: 1,
              },
              email: {
                type: 'string',
                description: 'Correo electrónico del usuario',
                example: 'usuario@ejemplo.com',
              },
              name: {
                type: 'string',
                description: 'Nombre del usuario',
                example: 'Juan Pérez',
              },
            },
          },
        },
      },
    },
    [HttpStatus.UNAUTHORIZED]: {
      description: 'Token inválido o expirado',
      schema: {
        properties: {
          status: {
            type: 'number',
            example: 401,
          },
          message: {
            type: 'string',
            example: 'Token inválido',
          },
          details: {
            type: 'string',
            example: 'El token de refresco ha expirado o es inválido',
          },
          timestamp: {
            type: 'string',
            example: '2023-03-23T12:34:56.789Z',
          },
        },
      },
    },
  },
};
