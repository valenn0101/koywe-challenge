import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { CryptoMarketApiService } from '../../../infrastructure/api/crypto-market-api.service';
import { Currency } from '../../../interfaces/currency.enum';
import { ExternalApiErrorException } from '../../../exceptions/quote-exceptions';

jest.mock('axios');

describe('CryptoMarketApiService', () => {
  let service: CryptoMarketApiService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn(),
  };

  const API_URL = 'https://api.cryptomarket.test';

  beforeEach(async () => {
    jest.clearAllMocks();
    mockConfigService.get.mockImplementation((key) => {
      if (key === 'CRYPTO_MARKET_API_URL') {
        return API_URL;
      }
      return undefined;
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CryptoMarketApiService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<CryptoMarketApiService>(CryptoMarketApiService);
    configService = module.get<ConfigService>(ConfigService);
  });

  describe('getExchangeRate', () => {
    const fromCurrency = Currency.ARS;
    const toCurrency = Currency.ETH;
    const mockRate = '0.0000023';

    it('should return exchange rate when API call is successful', async () => {
      const mockResponse = {
        data: {
          [fromCurrency]: {
            currency: toCurrency,
            price: mockRate,
            timestamp: '2025-02-03T12:00:00Z',
          },
        },
      };

      (axios.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await service.getExchangeRate(fromCurrency, toCurrency);

      expect(result).toEqual(parseFloat(mockRate));
      expect(axios.get).toHaveBeenCalledWith(
        `${API_URL}?from=${fromCurrency}&to=${toCurrency}`,
      );
      expect(configService.get).toHaveBeenCalledWith('CRYPTO_MARKET_API_URL');
    });

    it('should throw ExternalApiErrorException when API response does not contain price', async () => {
      const mockResponse = {
        data: {
          [fromCurrency]: {
            currency: toCurrency,
            timestamp: '2025-02-03T12:00:00Z',
          },
        },
      };

      (axios.get as jest.Mock).mockResolvedValue(mockResponse);

      await expect(
        service.getExchangeRate(fromCurrency, toCurrency),
      ).rejects.toThrow(ExternalApiErrorException);

      expect(axios.get).toHaveBeenCalledWith(
        `${API_URL}?from=${fromCurrency}&to=${toCurrency}`,
      );
    });

    it('should throw ExternalApiErrorException when currency data is missing', async () => {
      const mockResponse = {
        data: {},
      };

      (axios.get as jest.Mock).mockResolvedValue(mockResponse);

      await expect(
        service.getExchangeRate(fromCurrency, toCurrency),
      ).rejects.toThrow(ExternalApiErrorException);

      expect(axios.get).toHaveBeenCalledWith(
        `${API_URL}?from=${fromCurrency}&to=${toCurrency}`,
      );
    });

    it('should throw ExternalApiErrorException when price is not a valid number', async () => {
      const mockResponse = {
        data: {
          [fromCurrency]: {
            currency: toCurrency,
            price: 'not-a-number',
            timestamp: '2025-02-03T12:00:00Z',
          },
        },
      };

      (axios.get as jest.Mock).mockResolvedValue(mockResponse);

      await expect(
        service.getExchangeRate(fromCurrency, toCurrency),
      ).rejects.toThrow(ExternalApiErrorException);

      expect(axios.get).toHaveBeenCalledWith(
        `${API_URL}?from=${fromCurrency}&to=${toCurrency}`,
      );
    });

    it('should throw ExternalApiErrorException when axios fails', async () => {
      (axios.get as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(
        service.getExchangeRate(fromCurrency, toCurrency),
      ).rejects.toThrow(ExternalApiErrorException);

      expect(axios.get).toHaveBeenCalledWith(
        `${API_URL}?from=${fromCurrency}&to=${toCurrency}`,
      );
    });
  });
});
