import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { toBoolean } from '@yesterday-ai/utils-shared';
import { NextFunction, Request, Response } from 'express';

/**
 * A configurable request logger middleware
 * Logs HTTP request details based on environment configuration
 */
@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');
  private isVerboseLogging: boolean;
  private skipPaths: string[] = ['/api/health', '/api/metrics'];

  constructor(private configService: ConfigService) {
    // Get log level from environment variables
    this.isVerboseLogging =
      configService.get<string>('NODE_ENV') !== 'production' ||
      configService.get<string>('LOG_LEVEL') === 'verbose';

    // Add any paths to skip from environment (comma-separated list)
    const skipPathsEnv = configService.get<string>('LOG_SKIP_PATHS');
    if (skipPathsEnv) {
      this.skipPaths = this.skipPaths.concat(skipPathsEnv.split(','));
    }
  }

  use(req: Request, res: Response, next: NextFunction): void {
    // Skip logging for certain paths
    if (this.skipPaths.some((path) => req.path.startsWith(path))) {
      return next();
    }

    const startTime = Date.now();
    const { method, originalUrl, ip } = req;
    const userAgent = req.get('user-agent') || '';

    // Check if this is an auth-related request
    const isAuthRequest =
      originalUrl.includes('/auth/') ||
      originalUrl.includes('/login') ||
      originalUrl.includes('/admin/') ||
      originalUrl.includes('/validate');

    // For auth requests, log more details about headers and tokens
    if (isAuthRequest && toBoolean(this.configService.get('DEBUG_API_AUTH'))) {
      this.logger.log(`[AUTH REQUEST] ${method} ${originalUrl} - ${ip}`);

      // Log authorization header (partially redacted)
      const authHeader = req.headers.authorization;
      if (authHeader) {
        const redactedToken = authHeader.startsWith('Bearer ')
          ? `Bearer ${authHeader.substring(7, 15)}...`
          : 'Present but not Bearer';
        this.logger.debug(`Authorization: ${redactedToken}`);
      } else {
        this.logger.debug(`No Authorization header present for auth request`);
      }
    } else if (this.isVerboseLogging) {
      // Standard request logging for non-auth requests in verbose mode
      this.logger.log(`[REQ] ${method} ${originalUrl} - ${ip} - ${userAgent}`);
    }

    // Log request body in development, but sanitize sensitive data
    if (
      this.isVerboseLogging &&
      req.body &&
      Object.keys(req.body).length > 0 &&
      toBoolean(this.configService.get('DEBUG_API_REQUEST_BODY'))
    ) {
      const sanitizedBody = this.sanitizeSensitiveData({ ...req.body });
      this.logger.debug(`Request body: ${JSON.stringify(sanitizedBody)}`);
    }

    // Capture response details after the request is processed
    res.on('finish', () => {
      const { statusCode } = res;
      const contentLength = res.get('content-length') || 0;
      const responseTime = Date.now() - startTime;

      // Always log basic request details regardless of environment
      const logLevel = statusCode >= 400 ? 'error' : 'log';
      const message = `${method} ${originalUrl} ${statusCode} - ${responseTime}ms - ${contentLength}b`;

      // For auth requests with error responses, provide extra detail
      if (isAuthRequest && statusCode >= 400) {
        this.logger.error(`[AUTH ERROR] ${message}`);

        // Log specific details for common auth status codes
        if (statusCode === 401) {
          this.logger.error(`Authentication failed (401): Token invalid or missing`);
        } else if (statusCode === 403) {
          this.logger.error(`Authorization failed (403): Insufficient permissions`);
        }
      } else if (logLevel === 'error') {
        this.logger.error(message);
      } else {
        this.logger.log(message);
      }

      // Add detailed logging in verbose mode
      if (this.isVerboseLogging && statusCode >= 400) {
        const params = JSON.stringify(req.params);
        const query = JSON.stringify(req.query);
        this.logger.debug(`Request params: ${params}, query: ${query}`);
      }
    });

    next();
  }

  /**
   * Sanitize sensitive data from the request object
   * Remove passwords, tokens, keys, etc.
   */
  private sanitizeSensitiveData(data: Record<string, any>): Record<string, any> {
    const sensitiveFields = [
      'password',
      'token',
      'key',
      'secret',
      'authorization',
      'auth',
      'apiKey',
      'api_key',
      'access_token',
      'refresh_token',
    ];

    const sanitized = { ...data };

    for (const key of Object.keys(sanitized)) {
      const lowerKey = key.toLowerCase();

      // Check if the field is sensitive
      if (sensitiveFields.some((field) => lowerKey.includes(field))) {
        sanitized[key] = '[REDACTED]';
      } else if (sanitized[key] && typeof sanitized[key] === 'object') {
        // Recursively sanitize nested objects
        sanitized[key] = this.sanitizeSensitiveData(sanitized[key]);
      }
    }

    return sanitized;
  }
}
