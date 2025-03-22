import { IsNotEmpty, IsNumber, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Currency } from '../interfaces/currency.enum';

export class CreateQuoteDto {
  @ApiProperty({
    description: 'Monto a convertir',
    example: 1000000,
    type: Number,
    minimum: 0,
    required: true,
  })
  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @ApiProperty({
    description: 'Moneda de origen',
    example: 'ARS',
    enum: Currency,
    enumName: 'Currency',
    required: true,
  })
  @IsNotEmpty()
  @IsEnum(Currency, {
    message:
      'La moneda de origen no es válida. Valores permitidos: ARS, ETH, BTC, USDT, XEM, CLP, SHIB, DOGE',
  })
  from: Currency;

  @ApiProperty({
    description: 'Moneda de destino',
    example: 'ETH',
    enum: Currency,
    enumName: 'Currency',
    required: true,
  })
  @IsNotEmpty()
  @IsEnum(Currency, {
    message:
      'La moneda de destino no es válida. Valores permitidos: ARS, ETH, BTC, USDT, XEM, CLP, SHIB, DOGE',
  })
  to: Currency;
}
