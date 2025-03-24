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
