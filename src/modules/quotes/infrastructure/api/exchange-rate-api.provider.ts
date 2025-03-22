import { Provider } from '@nestjs/common';
import { EXCHANGE_RATE_API } from './exchange-rate-api.interface';
import { CryptoMarketApiService } from './crypto-market-api.service';

export const ExchangeRateApiProvider: Provider = {
  provide: EXCHANGE_RATE_API,
  useClass: CryptoMarketApiService,
};
