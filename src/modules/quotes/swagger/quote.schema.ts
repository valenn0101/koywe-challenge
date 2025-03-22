import { ApiProperty } from '@nestjs/swagger';
import { Currency } from '../interfaces/currency.enum';

export class QuoteResponseSchema {
  @ApiProperty({
    description: 'ID único de la cotización',
    example: 1,
    type: Number,
    minimum: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Moneda de origen',
    example: 'ARS',
    enum: Currency,
    enumName: 'Currency',
  })
  from: Currency;

  @ApiProperty({
    description: 'Moneda de destino',
    example: 'ETH',
    enum: Currency,
    enumName: 'Currency',
  })
  to: Currency;

  @ApiProperty({
    description: 'Monto original a convertir',
    example: 1000000,
    type: Number,
    minimum: 0,
  })
  amount: number;

  @ApiProperty({
    description: 'Tasa de conversión aplicada',
    example: 0.0000023,
    type: Number,
    minimum: 0,
  })
  rate: number;

  @ApiProperty({
    description: 'Monto convertido según la tasa',
    example: 2.3,
    type: Number,
    minimum: 0,
  })
  convertedAmount: number;

  @ApiProperty({
    description:
      'Fecha y hora de creación de la cotización en formato ISO 8601',
    example: '2025-02-03T12:00:00Z',
    type: String,
    format: 'date-time',
  })
  timestamp: Date;

  @ApiProperty({
    description:
      'Fecha y hora de expiración de la cotización en formato ISO 8601',
    example: '2025-02-03T12:05:00Z',
    type: String,
    format: 'date-time',
  })
  expiresAt: Date;
}
