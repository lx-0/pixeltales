import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Request, Response } from 'express'; // Import Express types
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
    // const { httpAdapter } = this.httpAdapterHost; // No longer needed
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const httpStatus =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException ? exception.message : 'Internal server error';

    // Log the error using PinoLogger
    // Use error level for server errors, warn for client errors (optional)
    const logLevel = httpStatus >= 500 ? 'error' : 'warn';
    this.logger[logLevel](
      {
        exception, // Log the full exception object for details
        stack: exception instanceof Error ? exception.stack : undefined,
        path: request.url, // Use standard request property
        method: request.method, // Use standard request property
        statusCode: httpStatus,
        // Optionally add request body, headers etc. (be careful with sensitive data)
        // body: request.body,
        // headers: request.headers,
      },
      // Prepend context manually
      `[${AllExceptionsFilter.name}] Unhandled Exception: ${message}`,
    );

    const responseBody = {
      statusCode: httpStatus,
      timestamp: new Date().toISOString(),
      path: request.url, // Use standard request property
      message,
    };

    // Use response directly, httpAdapter.reply might not be needed with explicit types
    response.status(httpStatus).json(responseBody);
  }
}
