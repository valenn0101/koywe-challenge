import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { QuoteEntity } from '../entities/quote.entity';
import { Currency } from '../interfaces/currency.enum';

@Injectable()
export class QuotesRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    from: Currency;
    to: Currency;
    amount: number;
    rate: number;
    convertedAmount: number;
    timestamp: Date;
    expiresAt: Date;
    userId: number;
  }): Promise<QuoteEntity> {
    const { userId, ...quoteData } = data;

    const quote = await this.prisma.quote.create({
      data: {
        ...quoteData,
        user: {
          connect: { id: userId },
        },
      },
    });

    return new QuoteEntity({
      ...quote,
      from: quote.from as Currency,
      to: quote.to as Currency,
    });
  }

  async findById(id: number): Promise<QuoteEntity | null> {
    const quote = await this.prisma.quote.findUnique({
      where: { id },
    });

    if (!quote) return null;

    return new QuoteEntity({
      ...quote,
      from: quote.from as Currency,
      to: quote.to as Currency,
    });
  }

  async findByUserId(userId: number): Promise<QuoteEntity[]> {
    const quotes = await this.prisma.quote.findMany({
      where: { userId },
    });

    return quotes.map(
      (quote) =>
        new QuoteEntity({
          ...quote,
          from: quote.from as Currency,
          to: quote.to as Currency,
        }),
    );
  }
}
