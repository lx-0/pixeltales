import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { toBoolean } from '@pixeltales/utils';
import { Request } from 'express';
import { JwtUser } from '../decorators/jwt-user.decorator';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(
    private reflector: Reflector,
    private configService: ConfigService,
  ) {}

  private debug(message: string) {
    if (toBoolean(this.configService.get('DEBUG_API_AUTH'))) {
      this.logger.debug(message);
    }
  }

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles are required, allow access
    if (!requiredRoles) {
      return true;
    }

    const { user }: { user: JwtUser } = context.switchToHttp().getRequest();

    // Get the endpoint information for better logging
    const req = context.switchToHttp().getRequest<Request>();
    const endpoint = `${req.method} ${req.url}`;

    if (!user) {
      this.logger.warn(`Role check failed: No user object found for ${endpoint}`);
      throw new UnauthorizedException('User authentication required');
    }

    // Log the role check
    this.debug(
      `Checking roles for ${endpoint}: user role=${
        user.profile.role
      }, required=${requiredRoles.join(',')}`,
    );

    // Ensure user exists and has a role
    if (!user || !user.profile.role) {
      return false;
    }

    // Check if the user's role is in the required roles
    const hasRole = requiredRoles.includes(user.profile.role);

    if (!hasRole) {
      this.logger.warn(
        `Role check failed: User ${user.profile.email} has role '${
          user.profile.role
        }' but endpoint ${endpoint} requires one of [${requiredRoles.join(', ')}]`,
      );
      throw new UnauthorizedException(
        `Not authorized as ${requiredRoles.join(
          ' or ',
        )}. Your account has role: ${user.profile.role || 'none'}`,
      );
    }

    this.debug(`Role check passed for ${user.profile.email} with role ${user.profile.role}`);
    return true;
  }
}
