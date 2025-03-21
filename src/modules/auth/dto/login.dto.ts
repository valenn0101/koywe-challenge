import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: 'Correo electrónico del usuario',
    example: 'usuario@ejemplo.com',
  })
  @IsEmail({}, { message: 'El formato del email no es válido' })
  email: string;

  @ApiProperty({
    description: 'Contraseña del usuario',
    example: 'Contraseña123!',
  })
  @IsString()
  @MinLength(8)
  password: string;
}
