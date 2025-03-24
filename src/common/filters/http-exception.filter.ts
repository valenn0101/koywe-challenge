import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Error interno del servidor';
    let details = null;
    let errors = {};

    if (
      exception?.name === 'ValidationError' ||
      exception?.name === 'BadRequestException'
    ) {
      status = HttpStatus.BAD_REQUEST;
      message = 'Error de validación';

      if (Array.isArray(exception.response?.message)) {
        exception.response.message.forEach((error) => {
          errors[error.property] = error.constraints;
        });
      }
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object') {
        message = exceptionResponse['message'] || exception.message;
        details = exceptionResponse['details'] || null;
      } else {
        message = exceptionResponse || exception.message;
      }
    }

    this.logger.error(`Error: ${request.method} ${request.url} - ${status}`);
    this.logger.error(`Detalles: ${details}`);

    response.status(status).json({
      status,
      message,
      details,
      errors: Object.keys(errors).length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
    });
  }
}
