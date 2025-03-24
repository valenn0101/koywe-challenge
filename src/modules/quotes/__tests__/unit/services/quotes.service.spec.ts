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
import { NotFoundException } from '@nestjs/common';

describe('QuotesService', () => {
  let service: QuotesService;
  let repository: QuotesRepository;
  let exchangeRateApi: IExchangeRateApi;

  const mockRepository = {
    create: jest.fn(),
    findById: jest.fn(),
    findByUserId: jest.fn(),
    softDelete: jest.fn(),
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

  describe('getQuoteById', () => {
    const quoteId = 1;
    const userId = 1;
    const mockQuote = new QuoteEntity({
      id: quoteId,
      from: Currency.ARS,
      to: Currency.ETH,
      amount: 1000000,
      rate: 0.0000023,
      convertedAmount: 2.3,
      timestamp: new Date(),
      expiresAt: new Date(new Date().getTime() + 5 * 60000),
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    it('should return a quote when it exists and is not expired', async () => {
      mockRepository.findById.mockResolvedValue(mockQuote);

      const result = await service.getQuoteById(quoteId);

      expect(result).toBeDefined();
      expect(result.id).toEqual(mockQuote.id);
      expect(result.from).toEqual(mockQuote.from);
      expect(result.to).toEqual(mockQuote.to);
      expect(result.amount).toEqual(mockQuote.amount);
      expect(result.rate).toEqual(mockQuote.rate);
      expect(result.convertedAmount).toEqual(mockQuote.convertedAmount);
      expect(mockRepository.findById).toHaveBeenCalledWith(quoteId);
    });

    it('should throw NotFoundException when quote does not exist', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.getQuoteById(quoteId)).rejects.toThrow(
        NotFoundException,
      );

      expect(mockRepository.findById).toHaveBeenCalledWith(quoteId);
    });

    it('should throw NotFoundException when quote is expired', async () => {
      const expiredQuote = new QuoteEntity({
        ...mockQuote,
        expiresAt: new Date(new Date().getTime() - 60000),
      });

      mockRepository.findById.mockResolvedValue(expiredQuote);

      await expect(service.getQuoteById(quoteId)).rejects.toThrow(
        NotFoundException,
      );

      expect(mockRepository.findById).toHaveBeenCalledWith(quoteId);
    });
  });

  describe('getAllCurrencies', () => {
    it('should return all currency values', async () => {
      const result = await service.getAllCurrencies();

      expect(result).toEqual(Object.values(Currency));
      expect(Array.isArray(result)).toBeTruthy();
      expect(result.length).toEqual(Object.values(Currency).length);
    });
  });

  describe('getUserQuotes', () => {
    const userId = 1;
    const mockQuotes = [
      new QuoteEntity({
        id: 1,
        from: Currency.ARS,
        to: Currency.ETH,
        amount: 1000000,
        rate: 0.0000023,
        convertedAmount: 2.3,
        timestamp: new Date(),
        expiresAt: new Date(new Date().getTime() + 5 * 60000),
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      new QuoteEntity({
        id: 2,
        from: Currency.ETH,
        to: Currency.BTC,
        amount: 1,
        rate: 0.05,
        convertedAmount: 0.05,
        timestamp: new Date(),
        expiresAt: new Date(new Date().getTime() + 5 * 60000),
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    ];

    it('should return quotes for the specified user', async () => {
      mockRepository.findByUserId.mockResolvedValue(mockQuotes);

      const result = await service.getUserQuotes(userId);

      expect(result).toEqual(mockQuotes);
      expect(result.length).toEqual(mockQuotes.length);
      expect(mockRepository.findByUserId).toHaveBeenCalledWith(userId);
    });

    it('should return empty array when user has no quotes', async () => {
      mockRepository.findByUserId.mockResolvedValue([]);

      const result = await service.getUserQuotes(userId);

      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBeTruthy();
      expect(result.length).toEqual(0);
      expect(mockRepository.findByUserId).toHaveBeenCalledWith(userId);
    });
  });

  describe('deleteQuote', () => {
    const quoteId = 1;
    const userId = 1;
    const mockQuote = new QuoteEntity({
      id: quoteId,
      from: Currency.ARS,
      to: Currency.ETH,
      amount: 1000000,
      rate: 0.0000023,
      convertedAmount: 2.3,
      timestamp: new Date(),
      expiresAt: new Date(new Date().getTime() + 5 * 60000),
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should soft delete a quote when it exists', async () => {
      mockRepository.findById.mockResolvedValue(mockQuote);
      mockRepository.softDelete.mockResolvedValue({
        ...mockQuote,
        deletedAt: new Date(),
      });

      await service.deleteQuote(quoteId);

      expect(mockRepository.findById).toHaveBeenCalledWith(quoteId);
      expect(mockRepository.softDelete).toHaveBeenCalledWith(quoteId);
    });

    it('should throw NotFoundException when quote does not exist', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.deleteQuote(quoteId)).rejects.toThrow(
        NotFoundException,
      );

      expect(mockRepository.findById).toHaveBeenCalledWith(quoteId);
      expect(mockRepository.softDelete).not.toHaveBeenCalled();
    });
  });
});
