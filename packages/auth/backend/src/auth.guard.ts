import { ExecutionContext, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { toBoolean } from '@yesterday-ai/utils-shared';
import { IS_PUBLIC_KEY } from './decorators/public.decorator';

@Injectable()
export class SupabaseAuthGuard extends AuthGuard('supabase') {
  private readonly logger = new Logger(SupabaseAuthGuard.name);

  constructor(
    private reflector: Reflector,
    private configService: ConfigService,
  ) {
    super();
  }

  private debug(message: string) {
    if (toBoolean(this.configService.get('DEBUG_API_SUPABASE_AUTH'))) {
      this.logger.debug(message);
    }
  }

  override canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      this.debug('Skipping auth check for public endpoint');
      return true;
    }

    // Log the protected endpoint request
    const req = context
      .switchToHttp()
      .getRequest<Request & { headers: { authorization: string } }>();
    const path = req.url || 'unknown';
    const method = req.method || 'unknown';
    this.debug(`Auth required for: ${method} ${path}`);

    if (!req.headers.authorization) {
      this.logger.warn(`Auth failed: No authorization header for ${method} ${path}`);
    } else {
      this.debug(`Authorization header found for ${method} ${path}`);
    }

    // Continue with passport authentication
    return super.canActivate(context);
  }

  override handleRequest<TUser>(
    err: unknown,
    user: TUser,
    info: unknown,
    context: ExecutionContext,
  ): TUser {
    // Handle authentication errors with detailed logging
    if (err || !user) {
      const errorMessage = err instanceof Error ? err.message : 'No user found';
      const path = context?.switchToHttp().getRequest<Request>().url || 'unknown path';

      this.logger.error(`Authentication failed for ${path}: ${errorMessage}`);

      // Add more detailed log based on error type
      if (errorMessage.includes('expired')) {
        this.logger.warn(`Auth failed: Token expired`);
      } else if (errorMessage.includes('not found')) {
        this.logger.warn(`Auth failed: User not found`);
      } else if (errorMessage.includes('role')) {
        this.logger.warn(`Auth failed: Insufficient permissions (role issue)`);
      }

      throw new UnauthorizedException(errorMessage);
    }

    return user;
  }
}
