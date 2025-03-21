import { HttpStatus } from '@nestjs/common';

export const RefreshSwagger = {
  operation: {
    summary: 'Refrescar tokens',
    description: 'Renueva los tokens de acceso usando el refresh token',
  },
  responses: {
    [HttpStatus.OK]: {
      description: 'Tokens actualizados exitosamente',
      schema: {
        properties: {
          accessToken: {
            type: 'string',
            description: 'Nuevo token JWT para autenticación',
          },
          refreshToken: {
            type: 'string',
            description: 'Nuevo token JWT para renovar el accessToken',
          },
        },
      },
    },
    [HttpStatus.UNAUTHORIZED]: {
      description: 'Token inválido o expirado',
      schema: {
        properties: {
          message: {
            type: 'string',
            example: 'Token inválido',
          },
          details: {
            type: 'string',
            example: 'El token de refresco ha expirado o es inválido',
          },
        },
      },
    },
  },
};
