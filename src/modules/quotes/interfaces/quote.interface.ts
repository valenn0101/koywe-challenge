import { Currency } from './currency.enum';

export interface ICryptoMarketPriceData {
  currency: string;
  price: string;
  timestamp: string;
}

export interface IExternalRateResponse {
  [currencyCode: string]: ICryptoMarketPriceData;
}

export interface IQuoteResponse {
  id: number;
  from: Currency;
  to: Currency;
  amount: number;
  rate: number;
  convertedAmount: number;
  timestamp: Date;
  expiresAt: Date;
}
