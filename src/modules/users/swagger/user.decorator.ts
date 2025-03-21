import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CreateUserDto } from '../dto/create-user.dto';
import { UserResponseSchema } from './user.schema';

export const ApiCreateUser = () => {
  return applyDecorators(
    ApiOperation({
      summary: 'Crear un nuevo usuario',
      description:
        'Crea un nuevo usuario en el sistema. La contraseña debe tener al menos 8 caracteres y un carácter especial.',
    }),
    ApiBody({
      type: CreateUserDto,
      examples: {
        usuario_valido: {
          summary: 'Usuario válido',
          description: 'Ejemplo de un usuario con datos válidos',
          value: {
            name: 'Juan Pérez',
            email: 'juan.perez@ejemplo.com',
            password: 'Segura123!',
          },
        },
        usuario_valido_2: {
          summary: 'Usuario válido alternativo',
          description: 'Otro ejemplo de usuario con datos válidos',
          value: {
            name: 'María González',
            email: 'maria.gonzalez@empresa.com',
            password: 'MiClave#2024',
          },
        },
        usuario_invalido_email: {
          summary: 'Email inválido',
          description: 'Ejemplo con formato de email incorrecto',
          value: {
            name: 'Pedro López',
            email: 'correo_invalido',
            password: 'Clave123!',
          },
        },
        usuario_invalido_password: {
          summary: 'Contraseña inválida',
          description: 'Ejemplo con contraseña que no cumple los requisitos',
          value: {
            name: 'Ana Torres',
            email: 'ana.torres@ejemplo.com',
            password: '123',
          },
        },
        usuario_invalido_nombre: {
          summary: 'Nombre vacío',
          description: 'Ejemplo con nombre vacío',
          value: {
            name: '',
            email: 'usuario@ejemplo.com',
            password: 'Clave123!',
          },
        },
      },
    }),
    ApiResponse({
      status: 201,
      description: 'Usuario creado exitosamente',
      type: UserResponseSchema,
      schema: {
        example: {
          id: 1,
          name: 'Juan Pérez',
          email: 'juan.perez@ejemplo.com',
          createdAt: '2024-03-21T15:00:00Z',
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Datos de entrada inválidos',
      schema: {
        example: {
          statusCode: 400,
          message: [
            'El email debe ser válido',
            'La contraseña debe tener al menos 8 caracteres',
            'La contraseña debe contener al menos un carácter especial',
          ],
          error: 'Bad Request',
        },
      },
    }),
  );
};

export const ApiFindAllUsers = () => {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Obtener todos los usuarios' }),
    ApiResponse({
      status: 200,
      description: 'Lista de usuarios obtenida exitosamente',
      type: [UserResponseSchema],
      schema: {
        example: [
          {
            id: 1,
            name: 'Juan Pérez',
            email: 'juan.perez@ejemplo.com',
            createdAt: '2024-03-21T15:00:00Z',
          },
          {
            id: 2,
            name: 'María González',
            email: 'maria.gonzalez@empresa.com',
            createdAt: '2024-03-21T16:30:00Z',
          },
        ],
      },
    }),
    ApiUnauthorizedResponse({
      description: 'No autorizado - Token no proporcionado o inválido',
      schema: {
        example: {
          statusCode: 401,
          message: 'No se proporcionó token de acceso',
          error: 'Unauthorized',
        },
      },
    }),
  );
};

export const ApiFindUserById = () => {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Obtener un usuario por ID',
      description:
        'Busca y retorna un usuario por su ID. El ID debe ser un número entero válido.',
    }),
    ApiParam({
      name: 'id',
      description: 'ID del usuario',
      required: true,
      examples: {
        usuario1: {
          summary: 'Usuario 1',
          value: 1,
        },
        usuario2: {
          summary: 'Usuario 2',
          value: 2,
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Usuario encontrado',
      type: UserResponseSchema,
    }),
    ApiUnauthorizedResponse({
      description: 'No autorizado - Token no proporcionado o inválido',
      schema: {
        example: {
          statusCode: 401,
          message: 'No se proporcionó token de acceso',
          error: 'Unauthorized',
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'Usuario no encontrado',
      schema: {
        example: {
          statusCode: 404,
          message: 'Usuario no encontrado',
          error: 'Not Found',
        },
      },
    }),
  );
};

export const ApiFindUserByEmail = () => {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Obtener un usuario por email',
      description:
        'Busca y retorna un usuario por su dirección de correo electrónico.',
    }),
    ApiParam({
      name: 'email',
      description: 'Email del usuario',
      required: true,
      examples: {
        email1: {
          summary: 'Email usuario 1',
          value: 'juan.perez@ejemplo.com',
        },
        email2: {
          summary: 'Email usuario 2',
          value: 'maria.gonzalez@empresa.com',
        },
        emailInvalido: {
          summary: 'Email inválido',
          value: 'correo_invalido',
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Usuario encontrado',
      type: UserResponseSchema,
    }),
    ApiUnauthorizedResponse({
      description: 'No autorizado - Token no proporcionado o inválido',
      schema: {
        example: {
          statusCode: 401,
          message: 'No se proporcionó token de acceso',
          error: 'Unauthorized',
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'Usuario no encontrado',
      schema: {
        example: {
          statusCode: 404,
          message: 'Usuario no encontrado',
          error: 'Not Found',
        },
      },
    }),
  );
};
