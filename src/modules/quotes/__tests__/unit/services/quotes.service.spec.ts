import { Test, TestingModule } from '@nestjs/testing';
import { QuotesService } from '../../../services/quotes.service';
import { QuotesRepository } from '../../../repositories/quotes.repository';
import { CreateQuoteDto } from '../../../dto/create-quote.dto';
import { QuoteEntity } from '../../../entities/quote.entity';
import { Currency } from '../../../interfaces/currency.enum';
import {
  SameCurrencyException,
  ExternalApiErrorException,
  QuoteCreationFailedException,
} from '../../../exceptions/quote-exceptions';
import {
  IExchangeRateApi,
  EXCHANGE_RATE_API,
} from '../../../infrastructure/api/exchange-rate-api.interface';

describe('QuotesService', () => {
  let service: QuotesService;
  let repository: QuotesRepository;
  let exchangeRateApi: IExchangeRateApi;

  const mockRepository = {
    create: jest.fn(),
    findById: jest.fn(),
    findByUserId: jest.fn(),
  };

  const mockExchangeRateApi = {
    getExchangeRate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuotesService,
        {
          provide: QuotesRepository,
          useValue: mockRepository,
        },
        {
          provide: EXCHANGE_RATE_API,
          useValue: mockExchangeRateApi,
        },
      ],
    }).compile();

    service = module.get<QuotesService>(QuotesService);
    repository = module.get<QuotesRepository>(QuotesRepository);
    exchangeRateApi = module.get<IExchangeRateApi>(EXCHANGE_RATE_API);

    jest.clearAllMocks();
  });

  describe('createQuote', () => {
    const userId = 1;
    const createQuoteDto: CreateQuoteDto = {
      amount: 1000000,
      from: Currency.ARS,
      to: Currency.ETH,
    };

    const mockRate = 0.0000023;
    const mockConvertedAmount = createQuoteDto.amount * mockRate;

    const mockQuote = new QuoteEntity({
      id: 1,
      from: createQuoteDto.from,
      to: createQuoteDto.to,
      amount: createQuoteDto.amount,
      rate: mockRate,
      convertedAmount: mockConvertedAmount,
      timestamp: new Date(),
      expiresAt: new Date(new Date().getTime() + 5 * 60000),
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    it('should create a quote successfully', async () => {
      mockExchangeRateApi.getExchangeRate.mockResolvedValue(mockRate);
      mockRepository.create.mockResolvedValue(mockQuote);

      const result = await service.createQuote(createQuoteDto, userId);

      expect(result).toBeDefined();
      expect(result.id).toEqual(mockQuote.id);
      expect(result.from).toEqual(createQuoteDto.from);
      expect(result.to).toEqual(createQuoteDto.to);
      expect(result.amount).toEqual(createQuoteDto.amount);
      expect(result.rate).toEqual(mockRate);
      expect(result.convertedAmount).toEqual(mockConvertedAmount);

      expect(exchangeRateApi.getExchangeRate).toHaveBeenCalledWith(
        createQuoteDto.from,
        createQuoteDto.to,
      );

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          from: createQuoteDto.from,
          to: createQuoteDto.to,
          amount: createQuoteDto.amount,
          rate: mockRate,
          convertedAmount: mockConvertedAmount,
          userId,
        }),
      );
    });

    it('should throw SameCurrencyException when from and to currencies are the same', async () => {
      const invalidDto: CreateQuoteDto = {
        amount: 1000,
        from: Currency.ETH,
        to: Currency.ETH,
      };

      await expect(service.createQuote(invalidDto, userId)).rejects.toThrow(
        SameCurrencyException,
      );

      expect(exchangeRateApi.getExchangeRate).not.toHaveBeenCalled();
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('should throw ExternalApiErrorException when exchange rate API fails', async () => {
      mockExchangeRateApi.getExchangeRate.mockRejectedValue(
        new ExternalApiErrorException(),
      );

      await expect(service.createQuote(createQuoteDto, userId)).rejects.toThrow(
        ExternalApiErrorException,
      );

      expect(exchangeRateApi.getExchangeRate).toHaveBeenCalledWith(
        createQuoteDto.from,
        createQuoteDto.to,
      );
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('should throw QuoteCreationFailedException when repository fails', async () => {
      mockExchangeRateApi.getExchangeRate.mockResolvedValue(mockRate);
      mockRepository.create.mockRejectedValue(new Error('Database error'));

      await expect(service.createQuote(createQuoteDto, userId)).rejects.toThrow(
        QuoteCreationFailedException,
      );

      expect(exchangeRateApi.getExchangeRate).toHaveBeenCalledWith(
        createQuoteDto.from,
        createQuoteDto.to,
      );
      expect(repository.create).toHaveBeenCalled();
    });
  });
});
