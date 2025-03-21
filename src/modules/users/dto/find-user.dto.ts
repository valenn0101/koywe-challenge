import { IsEmail, IsNumber, IsOptional } from 'class-validator';

export class FindUserDto {
  @IsOptional()
  @IsNumber({}, { message: 'El ID debe ser un número' })
  id?: number;

  @IsOptional()
  @IsEmail({}, { message: 'El formato del email no es válido' })
  email?: string;
}
