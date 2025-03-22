import { Test, TestingModule } from '@nestjs/testing';
import { QuotesFacade } from '../../../services/quotes.facade';
import { QuotesService } from '../../../services/quotes.service';
import { CreateQuoteDto } from '../../../dto/create-quote.dto';
import { Currency } from '../../../interfaces/currency.enum';
import { IQuoteResponse } from '../../../interfaces/quote.interface';

describe('QuotesFacade', () => {
  let facade: QuotesFacade;
  let service: QuotesService;

  const mockQuotesService = {
    createQuote: jest.fn(),
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
});
