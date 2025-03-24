import {
  Body,
  Controller,
  Post,
  UseGuards,
  Request,
  UnauthorizedException,
  Get,
  Param,
  ParseIntPipe,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { QuotesFacade } from '../services/quotes.facade';
import { CreateQuoteDto } from '../dto/create-quote.dto';
import { AuthGuard } from '../../auth/guards/auth.guard';
import {
  ApiCreateQuote,
  ApiGetQuoteById,
  ApiGetAllCurrencies,
  ApiGetUserQuotes,
} from '../swagger';

@ApiTags('Cotizaciones')
@ApiBearerAuth()
@Controller('quote')
export class QuotesController {
  constructor(private readonly quotesFacade: QuotesFacade) {}

  @Post()
  @ApiCreateQuote()
  @UseGuards(AuthGuard)
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

  @Get(':id')
  @ApiGetQuoteById()
  @UseGuards(AuthGuard)
  async getQuoteById(@Param('id', ParseIntPipe) id: number) {
    return this.quotesFacade.getQuoteById(id);
  }

  @Get('currencies/all')
  @ApiGetAllCurrencies()
  async getAllCurrencies() {
    return this.quotesFacade.getAllCurrencies();
  }

  @Get('user/all')
  @ApiGetUserQuotes()
  @UseGuards(AuthGuard)
  async getUserQuotes(@Request() req) {
    if (!req.user) {
      throw new UnauthorizedException('Usuario no autenticado');
    }

    const userId = req.user.id || req.user.sub;

    if (!userId) {
      throw new UnauthorizedException(
        'No se pudo determinar el ID del usuario',
      );
    }

    return this.quotesFacade.getUserQuotes(userId);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  async deleteQuote(@Param('id', ParseIntPipe) id: number) {
    return this.quotesFacade.deleteQuote(id);
  }
}
