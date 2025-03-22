import { Injectable } from '@nestjs/common';
import { QuotesService } from './quotes.service';
import { CreateQuoteDto } from '../dto/create-quote.dto';
import { IQuoteResponse } from '../interfaces/quote.interface';

@Injectable()
export class QuotesFacade {
  constructor(private readonly quotesService: QuotesService) {}

  async createQuote(
    createQuoteDto: CreateQuoteDto,
    userId: number,
  ): Promise<IQuoteResponse> {
    return this.quotesService.createQuote(createQuoteDto, userId);
  }
}
