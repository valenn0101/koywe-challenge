import { IsEmail, IsOptional, IsString } from 'class-validator';

export class FindUserDto {
  @IsOptional()
  @IsString({ message: 'El ID debe ser un texto' })
  id?: string;

  @IsOptional()
  @IsEmail({}, { message: 'El formato del email no es válido' })
  email?: string;
}
