import { Injectable } from '@nestjs/common';
import { QuotesService } from './quotes.service';
import { CreateQuoteDto } from '../dto/create-quote.dto';
import { IQuoteResponse } from '../interfaces/quote.interface';
import { Currency } from '../interfaces/currency.enum';
import { QuoteEntity } from '../entities/quote.entity';

@Injectable()
export class QuotesFacade {
  constructor(private readonly quotesService: QuotesService) {}

  async createQuote(
    createQuoteDto: CreateQuoteDto,
    userId: number,
  ): Promise<IQuoteResponse> {
    return this.quotesService.createQuote(createQuoteDto, userId);
  }

  async getQuoteById(id: number): Promise<IQuoteResponse | null> {
    return this.quotesService.getQuoteById(id);
  }

  async getAllCurrencies(): Promise<Currency[]> {
    return this.quotesService.getAllCurrencies();
  }

  async getUserQuotes(userId: number): Promise<QuoteEntity[]> {
    return this.quotesService.getUserQuotes(userId);
  }

  async deleteQuote(id: number): Promise<void> {
    return this.quotesService.deleteQuote(id);
  }
}
