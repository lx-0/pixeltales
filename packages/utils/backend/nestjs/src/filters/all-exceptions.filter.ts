import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Request, Response } from 'express';
import { PinoLogger } from 'nestjs-pino';

@Catch() // Catch all exceptions
@Injectable() // Make the filter injectable
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AllExceptionsFilter.name);
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const httpStatus =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    // Extract useful information from the exception
    const errorInfo = this.extractErrorInfo(exception);

    // Use error level for server errors, warn for client errors
    const logLevel = httpStatus >= 500 ? 'error' : 'warn';

    // Format string log message without dumping entire objects
    const logMessage = `${errorInfo.name}: ${errorInfo.message} [${request.method} ${request.url}]`;

    // Log only the message without attaching the entire object structure
    this.logger[logLevel](logMessage);

    // Optionally log more detailed information at trace level for debugging
    if (logLevel === 'error') {
      this.logger.debug({
        errorName: errorInfo.name,
        errorMessage: errorInfo.message,
        path: request.url,
        method: request.method,
        stack: errorInfo.stack,
      });
    }

    const responseBody = {
      statusCode: httpStatus,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: errorInfo.message,
    };

    response.status(httpStatus).json(responseBody);
  }

  private extractErrorInfo(exception: unknown): { name: string; message: string; stack?: string } {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      let message = exception.message;

      // If response is an object with a message property, use that instead
      if (typeof response === 'object' && response !== null && 'message' in response) {
        message = Array.isArray(response.message)
          ? response.message.join(', ')
          : String(response.message);
      }

      return {
        name: exception.name,
        message: message,
        stack: exception.stack,
      };
    }

    if (exception instanceof Error) {
      return {
        name: exception.name,
        message: exception.message,
        stack: exception.stack,
      };
    }

    // For non-Error objects
    return {
      name: 'UnknownException',
      message: typeof exception === 'string' ? exception : 'An unknown error occurred',
      stack: undefined,
    };
  }
}
