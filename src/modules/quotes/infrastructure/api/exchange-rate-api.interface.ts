import { Currency } from '../../interfaces/currency.enum';

export const EXCHANGE_RATE_API = 'EXCHANGE_RATE_API';

export interface IExchangeRateApi {
  getExchangeRate(
    fromCurrency: Currency,
    toCurrency: Currency,
  ): Promise<number>;
}
