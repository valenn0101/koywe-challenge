import { Injectable, Inject } from '@nestjs/common';
import { QuotesRepository } from '../repositories/quotes.repository';
import { CreateQuoteDto } from '../dto/create-quote.dto';
import {
  ExternalApiErrorException,
  QuoteCreationFailedException,
  SameCurrencyException,
} from '../exceptions/quote-exceptions';
import { IQuoteResponse } from '../interfaces/quote.interface';
import {
  IExchangeRateApi,
  EXCHANGE_RATE_API,
} from '../infrastructure/api/exchange-rate-api.interface';

@Injectable()
export class QuotesService {
  constructor(
    private readonly quotesRepository: QuotesRepository,
    @Inject(EXCHANGE_RATE_API)
    private readonly exchangeRateApi: IExchangeRateApi,
  ) {}

  async createQuote(
    createQuoteDto: CreateQuoteDto,
    userId: number,
  ): Promise<IQuoteResponse> {
    try {
      const { from, to, amount } = createQuoteDto;

      if (from === to) {
        throw new SameCurrencyException(from);
      }

      const rate = await this.exchangeRateApi.getExchangeRate(from, to);

      const convertedAmount = amount * rate;

      const timestamp = new Date();
      const expiresAt = new Date(timestamp);
      expiresAt.setMinutes(expiresAt.getMinutes() + 5);

      const quote = await this.quotesRepository.create({
        from,
        to,
        amount,
        rate,
        convertedAmount,
        timestamp,
        expiresAt,
        userId,
      });

      const { userId: _, createdAt, updatedAt, ...result } = quote;

      return result;
    } catch (error) {
      if (
        error instanceof ExternalApiErrorException ||
        error instanceof SameCurrencyException
      ) {
        throw error;
      }

      throw new QuoteCreationFailedException();
    }
  }
}
