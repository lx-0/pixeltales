import { Body, Controller, Get, Logger, Post, UseGuards } from '@nestjs/common';
import { CreateUserDTO } from '@pixeltales/contracts';
import { ApiResponse, SuccessApiResponse } from '@yesterday-ai/api-contracts';
import { JwtUser, SupabaseAuthGuard } from '@yesterday-ai/auth-backend';
import { User } from '@yesterday-ai/user-contracts';
import { UsersService } from '../users/users.service';

/**
 * Controller for operations related to the current authenticated user
 * Handles the /me/* endpoints
 */
@Controller('me')
export class MeController {
  private readonly logger = new Logger(MeController.name);

  constructor(private readonly usersService: UsersService) {}

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

  /**
   * Endpoint called by frontend after Supabase login/state change
   * to ensure the user exists in the backend DB.
   */
  @Post('sync')
  @UseGuards(SupabaseAuthGuard)
  async syncUserProfile(
    @JwtUser() jwtUser: JwtUser,
    @Body() body: CreateUserDTO,
  ): Promise<ApiResponse<User>> {
    this.logger.log(`Syncing profile for user ID: ${jwtUser.profile.id}`);

    if (body.id !== jwtUser.profile.id) {
      this.logger.warn(
        `Mismatch between JWT user ID (${jwtUser.profile.id}) and sync body ID (${body.id})`,
      );
    }

    const syncedUser = await this.usersService.findOrCreateUser({
      id: jwtUser.profile.id,
      email: jwtUser.user.email || '',
      name: body.name,
    });

    return SuccessApiResponse(syncedUser, 'User profile synced successfully');
  }
}
