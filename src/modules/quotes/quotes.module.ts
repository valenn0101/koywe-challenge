import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { QuotesController } from './controllers/quotes.controller';
import { QuotesService } from './services/quotes.service';
import { QuotesFacade } from './services/quotes.facade';
import { QuotesRepository } from './repositories/quotes.repository';
import { PrismaService } from '../../database/prisma.service';
import { HttpExceptionFilter } from '../../common/filters/http-exception.filter';
import { ExchangeRateApiProvider } from './infrastructure/api/exchange-rate-api.provider';

@Module({
  imports: [ConfigModule],
  controllers: [QuotesController],
  providers: [
    QuotesService,
    QuotesFacade,
    QuotesRepository,
    PrismaService,
    ExchangeRateApiProvider,
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
  exports: [QuotesFacade],
})
export class QuotesModule {}
