import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiParam,
} from '@nestjs/swagger';
import { CreateQuoteDto } from '../dto/create-quote.dto';
import { QuoteResponseSchema } from './quote.schema';
import { Currency } from '../interfaces/currency.enum';

export const ApiCreateQuote = () => {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Crear una cotización',
      description:
        'Crea una nueva cotización de cambio entre dos monedas. Calcula el monto convertido según la tasa actual.',
    }),
    ApiBody({
      type: CreateQuoteDto,
      examples: {
        ars_to_eth: {
          summary: 'ARS a ETH',
          description: 'Ejemplo de conversión de Pesos Argentinos a Ethereum',
          value: {
            amount: 1000000,
            from: Currency.ARS,
            to: Currency.ETH,
          },
        },
        eth_to_ars: {
          summary: 'ETH a ARS',
          description: 'Ejemplo de conversión de Ethereum a Pesos Argentinos',
          value: {
            amount: 1,
            from: Currency.ETH,
            to: Currency.ARS,
          },
        },
        btc_to_usdt: {
          summary: 'BTC a USDT',
          description: 'Ejemplo de conversión de Bitcoin a Tether',
          value: {
            amount: 0.5,
            from: Currency.BTC,
            to: Currency.USDT,
          },
        },
        clp_to_btc: {
          summary: 'CLP a BTC',
          description: 'Ejemplo de conversión de Pesos Chilenos a Bitcoin',
          value: {
            amount: 5000000,
            from: Currency.CLP,
            to: Currency.BTC,
          },
        },
      },
    }),
    ApiResponse({
      status: 201,
      description: 'Cotización creada exitosamente',
      type: QuoteResponseSchema,
      schema: {
        example: {
          id: 1,
          from: 'ARS',
          to: 'ETH',
          amount: 1000000,
          rate: 0.0000023,
          convertedAmount: 2.3,
          timestamp: '2025-02-03T12:00:00Z',
          expiresAt: '2025-02-03T12:05:00Z',
        },
      },
    }),
    ApiBadRequestResponse({
      description:
        'Datos de entrada inválidos o misma moneda en origen y destino',
      schema: {
        examples: {
          moneda_invalida: {
            summary: 'Moneda no soportada',
            value: {
              statusCode: 400,
              message:
                'La moneda XXX no es válida. Valores permitidos: ARS, ETH, BTC, USDT, XEM, CLP, SHIB, DOGE',
              error: 'Bad Request',
            },
          },
          monedas_iguales: {
            summary: 'Misma moneda en origen y destino',
            value: {
              statusCode: 400,
              message:
                'No se puede convertir de ETH a ETH. Las divisas deben ser diferentes',
              error: 'Bad Request',
            },
          },
          formato_invalido: {
            summary: 'Formato de datos inválido',
            value: {
              statusCode: 400,
              message: [
                'El monto debe ser un número',
                'La moneda de origen es requerida',
                'La moneda de destino es requerida',
              ],
              error: 'Bad Request',
            },
          },
        },
      },
    }),
    ApiUnauthorizedResponse({
      description: 'No autorizado - Token no proporcionado o inválido',
      schema: {
        example: {
          statusCode: 401,
          message: 'No se proporcionó token de acceso',
          error: 'Unauthorized',
        },
      },
    }),
    ApiInternalServerErrorResponse({
      description:
        'Error en el servidor o en la comunicación con el proveedor de tasas',
      schema: {
        example: {
          statusCode: 500,
          message: 'Ha ocurrido un error al crear la cotización',
          error: 'Internal Server Error',
        },
      },
    }),
  );
};

export const ApiGetQuoteById = () => {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Obtener una cotización por ID',
      description:
        'Recupera una cotización existente por su ID, validando que no haya expirado',
    }),
    ApiParam({
      name: 'id',
      type: 'number',
      description: 'ID de la cotización a recuperar',
      required: true,
    }),
    ApiResponse({
      status: 200,
      description: 'Cotización recuperada exitosamente',
      type: QuoteResponseSchema,
      schema: {
        example: {
          id: 1,
          from: 'ARS',
          to: 'ETH',
          amount: 1000000,
          rate: 0.0000023,
          convertedAmount: 2.3,
          timestamp: '2025-02-03T12:00:00Z',
          expiresAt: '2025-02-03T12:05:00Z',
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'Cotización no encontrada o expirada',
      schema: {
        example: {
          statusCode: 404,
          message: 'La cotización con ID 1 no encontrada',
          error: 'Not Found',
        },
      },
    }),
    ApiUnauthorizedResponse({
      description: 'No autorizado - Token no proporcionado o inválido',
    }),
  );
};

export const ApiGetAllCurrencies = () => {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Obtener todas las monedas disponibles',
      description:
        'Devuelve la lista de todas las monedas soportadas por el sistema',
    }),
    ApiResponse({
      status: 200,
      description: 'Lista de monedas disponibles',
      schema: {
        example: [
          'ARS',
          'ETH',
          'BTC',
          'USDT',
          'XEM',
          'CLP',
          'SHIB',
          'DOGE',
          'XLM',
        ],
      },
    }),
    ApiUnauthorizedResponse({
      description: 'No autorizado - Token no proporcionado o inválido',
    }),
  );
};

export const ApiGetUserQuotes = () => {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Obtener todas las cotizaciones del usuario',
      description:
        'Recupera todas las cotizaciones asociadas al usuario autenticado',
    }),
    ApiResponse({
      status: 200,
      description: 'Lista de cotizaciones del usuario',
      schema: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            from: { type: 'string', example: 'ARS' },
            to: { type: 'string', example: 'ETH' },
            amount: { type: 'number', example: 1000000 },
            rate: { type: 'number', example: 0.0000023 },
            convertedAmount: { type: 'number', example: 2.3 },
            timestamp: {
              type: 'string',
              format: 'date-time',
              example: '2025-02-03T12:00:00Z',
            },
            expiresAt: {
              type: 'string',
              format: 'date-time',
              example: '2025-02-03T12:05:00Z',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              example: '2025-02-03T12:00:00Z',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              example: '2025-02-03T12:00:00Z',
            },
          },
        },
      },
    }),
    ApiUnauthorizedResponse({
      description: 'No autorizado - Token no proporcionado o inválido',
    }),
  );
};
