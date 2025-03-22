import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { IExchangeRateApi } from './exchange-rate-api.interface';
import { IExternalRateResponse } from '../../interfaces/quote.interface';
import { ExternalApiErrorException } from '../../exceptions/quote-exceptions';
import { Currency } from '../../interfaces/currency.enum';

@Injectable()
export class CryptoMarketApiService implements IExchangeRateApi {
  private readonly apiUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.apiUrl = this.configService.get<string>('CRYPTO_MARKET_API_URL');
  }

  async getExchangeRate(
    fromCurrency: Currency,
    toCurrency: Currency,
  ): Promise<number> {
    try {
      const url = `${this.apiUrl}?from=${fromCurrency}&to=${toCurrency}`;

      const response = await axios.get<IExternalRateResponse>(url);

      const currencyResponse = response.data[fromCurrency.toString()];
      if (!currencyResponse || !currencyResponse.price) {
        throw new ExternalApiErrorException();
      }

      const rate = parseFloat(currencyResponse.price);
      if (isNaN(rate)) {
        throw new ExternalApiErrorException();
      }

      return rate;
    } catch (error) {
      throw new ExternalApiErrorException();
    }
  }
}
