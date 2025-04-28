import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { toBoolean } from '@yesterday-ai/utils-shared';
import { Strategy } from 'passport-http-bearer';
import { AuthService } from './auth.service';
import { JwtUser } from './decorators/jwt-user.decorator';

@Injectable()
export class SupabaseStrategy extends PassportStrategy(Strategy, 'supabase') {
  private readonly logger = new Logger(SupabaseStrategy.name);

  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super();
  }

  private debug(message: string) {
    if (toBoolean(this.configService.get('DEBUG_API_SUPABASE_AUTH'))) {
      this.logger.debug(message);
    }
  }

  async validate(token: string): Promise<JwtUser> {
    try {
      this.debug(`Validating token: ${token.substring(0, 10)}...`);

      if (!token) {
        this.logger.warn('Token validation failed: No token provided');
        throw new UnauthorizedException('No authentication token provided');
      }

      const userWithProfile = await this.authService.validateToken(token);

      this.debug(
        `Token validated for user: ${userWithProfile.user.email} (${userWithProfile.profile.role})`,
      );
      return userWithProfile;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Token validation failed: ${errorMessage}`);

      if (errorMessage.includes('not verified')) {
        this.logger.warn(`Auth failed: Email not verified for user associated with this token`);
      } else if (errorMessage.includes('Invalid token')) {
        this.logger.warn(`Auth failed: Invalid or expired token`);
      } else if (errorMessage.includes('not authorized')) {
        this.logger.warn(`Auth failed: User not authorized for this resource`);
      } else if (errorMessage.includes('not found')) {
        this.logger.warn(`Auth failed: User not found in database`);
      }

      throw error;
    }
  }
}
