import { Controller, Get, Logger, UseGuards } from '@nestjs/common';
import { ApiResponse, SuccessApiResponse, User } from '@pixeltales/contracts';
import { SupabaseAuthGuard } from '../auth/auth.guard';
import { JwtUser } from '../auth/decorators/jwt-user.decorator';

/**
 * Controller for operations related to the current authenticated user
 * Handles the /me/* endpoints
 */
@Controller('me')
export class MeController {
  private readonly logger = new Logger(MeController.name);

  constructor() {}

  // Add an endpoint that requires authentication for testing
  @UseGuards(SupabaseAuthGuard)
  @Get('profile')
  async getUserProfile(@JwtUser() user: JwtUser): Promise<ApiResponse<User>> {
    this.logger.log('Protected user profile accessed');
    this.logger.debug(`User: ${JSON.stringify(user)}`);

    return SuccessApiResponse(user.profile, 'Protected user profile data');
  }

  @UseGuards(SupabaseAuthGuard)
  @Get('user/profile')
  legacyProfile(@JwtUser() user: JwtUser) {
    this.logger.log('Legacy user profile path accessed');
    return this.getUserProfile(user);
  }
}
