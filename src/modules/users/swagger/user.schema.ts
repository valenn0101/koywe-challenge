import { ApiProperty } from '@nestjs/swagger';

export class UserResponseSchema {
  @ApiProperty({
    description: 'ID único del usuario',
    example: 1,
    type: Number,
    minimum: 1,
    examples: [1, 2, 3],
  })
  id: number;

  @ApiProperty({
    description: 'Nombre completo del usuario',
    example: 'Juan Pérez',
    minLength: 1,
    maxLength: 100,
    type: String,
    examples: [
      'Juan Pérez',
      'María González',
      'Carlos Rodríguez',
      'Ana Torres',
    ],
  })
  name: string;

  @ApiProperty({
    description: 'Correo electrónico del usuario (debe ser único)',
    example: 'juan.perez@ejemplo.com',
    format: 'email',
    type: String,
    examples: [
      'juan.perez@ejemplo.com',
      'maria.gonzalez@empresa.com',
      'carlos.rodriguez@ejemplo.com',
      'ana.torres@empresa.com',
    ],
  })
  email: string;

  @ApiProperty({
    description: 'Fecha y hora de creación del usuario en formato ISO 8601',
    example: '2024-03-21T15:00:00Z',
    type: String,
    format: 'date-time',
    examples: [
      '2024-03-21T15:00:00Z',
      '2024-03-21T16:30:00Z',
      '2024-03-21T17:45:00Z',
    ],
  })
  createdAt: string;
}
