import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import {
  InternalServerErrorApiResponse,
  LoginResponseSchema,
  LoginSchema,
  RegisterSchema,
  SupabaseUserSessionResponse,
  UnauthorizedApiResponse,
  User,
} from '@pixeltales/contracts';
import { Request } from 'express';
import { z } from 'zod';
import { AuthService } from './auth.service';
import { JwtUser } from './decorators/jwt-user.decorator';
import { Public } from './decorators/public.decorator';
import { Roles } from './decorators/roles.decorator';

/**
 * This controller is used to handle all authentication related requests
 * It is used for the mobile app and the web app
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Mobile app login route (restored)
  @Public()
  @Post('login')
  async login(
    @Body() credentials: z.infer<typeof LoginSchema>,
  ): Promise<z.infer<typeof LoginResponseSchema>> {
    return this.authService.login(credentials, false);
  }

  // Mobile app registration route (restored)
  @Public()
  @Post('register')
  async register(
    @Body() userData: z.infer<typeof RegisterSchema>,
  ): Promise<z.infer<typeof LoginResponseSchema>> {
    return this.authService.register(userData);
  }

  @Roles('admin')
  @Post('admin/create')
  async createAdmin(@Body() userData: { email: string; password: string; name?: string }) {
    return this.authService.createAdminUser(userData);
  }

  @Get('me')
  async getProfile(@JwtUser() user: JwtUser): Promise<User> {
    return this.authService.getProfile(user);
  }

  @Get('validate')
  async validateUser(@JwtUser() user: JwtUser): Promise<JwtUser> {
    // This endpoint returns the user for any authenticated user
    return user;
  }

  @Public()
  @Get('session')
  async getSessionFromCookies(@Req() request: Request): Promise<SupabaseUserSessionResponse> {
    try {
      console.log('Attempting to restore session from cookies');
      // Extract cookies from request
      const cookies = request.headers.cookie;

      if (!cookies) {
        console.log('No cookies found in request');
        return UnauthorizedApiResponse('No cookies found');
      }

      console.log('Cookies present, attempting to restore session');
      // Try to restore session using Supabase
      const session = await this.authService.restoreSessionFromCookies(cookies);

      return session;
    } catch (error) {
      console.error('Failed to restore session from cookies:', error);
      if (error instanceof Error) {
        return InternalServerErrorApiResponse(error, 'Failed to restore session from cookies');
      }
      return InternalServerErrorApiResponse(
        new Error('Unknown error'),
        'Failed to restore session from cookies',
      );
    }
  }

  @Public()
  @Get('registration-enabled')
  async isRegistrationEnabled() {
    return this.authService.isRegistrationEnabled();
  }

  @Public()
  @Post('reset-password')
  async resetPassword(@Body() userData: { email: string }) {
    return this.authService.resetPassword(userData.email);
  }

  @Public()
  @Post('resend-verification')
  async resendVerification(@Body() userData: { email: string }) {
    return this.authService.resendVerificationEmail(userData.email);
  }
}
