import {
  Body,
  Controller,
  Post,
  UseGuards,
  Request,
  UnauthorizedException,
} from '@nestjs/common';
import { QuotesFacade } from '../services/quotes.facade';
import { CreateQuoteDto } from '../dto/create-quote.dto';
import { AuthGuard } from '../../auth/guards/auth.guard';

@Controller('quote')
@UseGuards(AuthGuard)
export class QuotesController {
  constructor(private readonly quotesFacade: QuotesFacade) {}

  @Post()
  async create(@Body() createQuoteDto: CreateQuoteDto, @Request() req) {
    if (!req.user) {
      throw new UnauthorizedException('Usuario no autenticado');
    }

    const userId = req.user.id || req.user.sub;

    if (!userId) {
      throw new UnauthorizedException(
        'No se pudo determinar el ID del usuario',
      );
    }

    return this.quotesFacade.createQuote(createQuoteDto, userId);
  }
}
