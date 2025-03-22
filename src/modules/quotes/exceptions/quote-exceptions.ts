import { HttpException, HttpStatus } from '@nestjs/common';
import { Currency } from '../interfaces/currency.enum';

export class ExternalApiErrorException extends HttpException {
  constructor() {
    super(
      'Error al consultar la API externa de precios',
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}

export class InvalidCurrencyException extends HttpException {
  constructor(currency: string) {
    super(
      `La moneda ${currency} no es válida o no está soportada`,
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class SameCurrencyException extends HttpException {
  constructor(currency: Currency) {
    super(
      `No se puede convertir de ${currency} a ${currency}. Las divisas deben ser diferentes`,
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class QuoteCreationFailedException extends HttpException {
  constructor() {
    super(
      'Ha ocurrido un error al crear la cotización',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
