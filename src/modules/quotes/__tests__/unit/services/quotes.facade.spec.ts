import { Test, TestingModule } from '@nestjs/testing';
import { QuotesFacade } from '../../../services/quotes.facade';
import { QuotesService } from '../../../services/quotes.service';
import { CreateQuoteDto } from '../../../dto/create-quote.dto';
import { Currency } from '../../../interfaces/currency.enum';
import { IQuoteResponse } from '../../../interfaces/quote.interface';
import { QuoteEntity } from '../../../entities/quote.entity';

describe('QuotesFacade', () => {
  let facade: QuotesFacade;
  let service: QuotesService;

  const mockQuotesService = {
    createQuote: jest.fn(),
    getQuoteById: jest.fn(),
    getAllCurrencies: jest.fn(),
    getUserQuotes: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuotesFacade,
        {
          provide: QuotesService,
          useValue: mockQuotesService,
        },
      ],
    }).compile();

    facade = module.get<QuotesFacade>(QuotesFacade);
    service = module.get<QuotesService>(QuotesService);

    jest.clearAllMocks();
  });

  describe('createQuote', () => {
    const userId = 1;
    const createQuoteDto: CreateQuoteDto = {
      amount: 1000000,
      from: Currency.ARS,
      to: Currency.ETH,
    };

    const mockQuoteResponse: IQuoteResponse = {
      id: 1,
      from: Currency.ARS,
      to: Currency.ETH,
      amount: 1000000,
      rate: 0.0000023,
      convertedAmount: 2.3,
      timestamp: new Date(),
      expiresAt: new Date(new Date().getTime() + 5 * 60000),
    };

    it('should delegate to QuotesService.createQuote and return the result', async () => {
      mockQuotesService.createQuote.mockResolvedValue(mockQuoteResponse);

      const result = await facade.createQuote(createQuoteDto, userId);

      expect(result).toEqual(mockQuoteResponse);
      expect(mockQuotesService.createQuote).toHaveBeenCalledWith(
        createQuoteDto,
        userId,
      );
    });

    it('should throw any errors from QuotesService', async () => {
      const error = new Error('Test error');
      mockQuotesService.createQuote.mockRejectedValue(error);

      await expect(facade.createQuote(createQuoteDto, userId)).rejects.toThrow(
        error,
      );

      expect(mockQuotesService.createQuote).toHaveBeenCalledWith(
        createQuoteDto,
        userId,
      );
    });
  });

  describe('getQuoteById', () => {
    const quoteId = 1;
    const mockQuoteResponse: IQuoteResponse = {
      id: quoteId,
      from: Currency.ARS,
      to: Currency.ETH,
      amount: 1000000,
      rate: 0.0000023,
      convertedAmount: 2.3,
      timestamp: new Date(),
      expiresAt: new Date(new Date().getTime() + 5 * 60000),
    };

    it('should delegate to QuotesService.getQuoteById and return the result', async () => {
      mockQuotesService.getQuoteById.mockResolvedValue(mockQuoteResponse);

      const result = await facade.getQuoteById(quoteId);

      expect(result).toEqual(mockQuoteResponse);
      expect(mockQuotesService.getQuoteById).toHaveBeenCalledWith(quoteId);
    });

    it('should throw any errors from QuotesService', async () => {
      const error = new Error('Quote not found');
      mockQuotesService.getQuoteById.mockRejectedValue(error);

      await expect(facade.getQuoteById(quoteId)).rejects.toThrow(error);

      expect(mockQuotesService.getQuoteById).toHaveBeenCalledWith(quoteId);
    });
  });

  describe('getAllCurrencies', () => {
    const mockCurrencies = Object.values(Currency);

    it('should delegate to QuotesService.getAllCurrencies and return the result', async () => {
      mockQuotesService.getAllCurrencies.mockResolvedValue(mockCurrencies);

      const result = await facade.getAllCurrencies();

      expect(result).toEqual(mockCurrencies);
      expect(mockQuotesService.getAllCurrencies).toHaveBeenCalled();
    });
  });

  describe('getUserQuotes', () => {
    const userId = 1;
    const mockQuotes: QuoteEntity[] = [
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

    it('should delegate to QuotesService.getUserQuotes and return the result', async () => {
      mockQuotesService.getUserQuotes.mockResolvedValue(mockQuotes);

      const result = await facade.getUserQuotes(userId);

      expect(result).toEqual(mockQuotes);
      expect(mockQuotesService.getUserQuotes).toHaveBeenCalledWith(userId);
    });

    it('should throw any errors from QuotesService', async () => {
      const error = new Error('Failed to get user quotes');
      mockQuotesService.getUserQuotes.mockRejectedValue(error);

      await expect(facade.getUserQuotes(userId)).rejects.toThrow(error);

      expect(mockQuotesService.getUserQuotes).toHaveBeenCalledWith(userId);
    });
  });
});
