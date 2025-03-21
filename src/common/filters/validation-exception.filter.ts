import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ValidationError } from 'class-validator';
import { Response } from 'express';

@Catch(ValidationError)
export class ValidationExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ValidationExceptionFilter.name);

  catch(exception: ValidationError[], host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const errorMessages = this.formatValidationErrors(exception);
    const statusCode = HttpStatus.BAD_REQUEST;

    this.logger.error(
      `Errores de validación: ${JSON.stringify(errorMessages)}`,
    );

    response.status(statusCode).json({
      statusCode,
      timestamp: new Date().toISOString(),
      message: 'Error de validación',
      errors: errorMessages,
    });
  }

  private formatValidationErrors(
    errors: ValidationError[],
  ): Record<string, string[]> {
    const result: Record<string, string[]> = {};

    errors.forEach((error) => {
      if (error.constraints) {
        result[error.property] = Object.values(error.constraints);
      }

      if (error.children && error.children.length > 0) {
        const childErrors = this.formatValidationErrors(error.children);
        Object.keys(childErrors).forEach((key) => {
          result[`${error.property}.${key}`] = childErrors[key];
        });
      }
    });

    return result;
  }
}
