import { IsNotEmpty, IsNumber, IsEnum } from 'class-validator';
import { Currency } from '../interfaces/currency.enum';

export class CreateQuoteDto {
  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @IsNotEmpty()
  @IsEnum(Currency, {
    message:
      'La moneda de origen no es válida. Valores permitidos: ARS, ETH, BTC, USDT, XEM, CLP, SHIB, DOGE',
  })
  from: Currency;

  @IsNotEmpty()
  @IsEnum(Currency, {
    message:
      'La moneda de destino no es válida. Valores permitidos: ARS, ETH, BTC, USDT, XEM, CLP, SHIB, DOGE',
  })
  to: Currency;
}
