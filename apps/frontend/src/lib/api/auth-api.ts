import { Logger } from '@/utils/logger';
import {
  ApiResponse,
  ApiResponseSchema,
  JwtUser,
  JwtUserSchema,
  LoginResponseSchema,
  LoginSchema,
  RegisterSchema,
  RegistrationEnabledSchema,
  SuccessApiResponse,
  SupabaseUserSessionResponseSchema,
  User,
  UserSchema,
  VoidApiResponse,
  VoidApiResponseSchema,
} from '@pixeltales/contracts';
import { z } from 'zod';
import { BaseApiService } from './base-api';

/**
 * Service for authentication-related API requests
 */
export class AuthApiService extends BaseApiService {
  constructor() {
    super('AuthApi');
  }

  /**
   * Login with email and password
   */
  async login(
    credentials: z.infer<typeof LoginSchema>,
  ): Promise<z.infer<typeof LoginResponseSchema>> {
    Logger.info('AuthApi', `Logging in user: ${credentials.email}`);

    return this.post('/auth/login', credentials, undefined, LoginResponseSchema);
  }

  /**
   * Register a new user
   */
  async register(
    userData: z.infer<typeof RegisterSchema>,
  ): Promise<z.infer<typeof LoginResponseSchema>> {
    Logger.info('AuthApi', `Registering new user: ${userData.email}`);

    return this.post('/auth/register', userData, undefined, LoginResponseSchema);
  }

  /**
   * Create a new admin user (requires admin permissions)
   */
  async createAdmin(
    userData: z.infer<typeof RegisterSchema>,
  ): Promise<z.infer<typeof LoginResponseSchema>> {
    Logger.info('AuthApi', `Creating admin user: ${userData.email}`);

    return this.post('/auth/admin/create', userData, undefined, LoginResponseSchema);
  }

  /**
   * Get the current user's profile
   */
  async getProfile(): Promise<z.infer<typeof UserSchema>> {
    Logger.info('AuthApi', 'Getting user profile');

    return this.get<User>('/auth/me', undefined, UserSchema);
  }

  /**
   * Validate the current authentication token
   */
  async validateToken(): Promise<z.infer<typeof JwtUserSchema>> {
    Logger.info('AuthApi', 'Validating auth token');

    return this.get<JwtUser>('/auth/validate', undefined, JwtUserSchema);
  }

  /**
   * Get session from cookies (used for SSR)
   */
  async getSessionFromCookies(): Promise<z.infer<typeof SupabaseUserSessionResponseSchema>> {
    Logger.info('AuthApi', 'Getting session from cookies');

    return this.get('/auth/session', undefined, SupabaseUserSessionResponseSchema);
  }

  /**
   * Check if registration is currently enabled
   */
  async isRegistrationEnabled(): Promise<ApiResponse<z.infer<typeof RegistrationEnabledSchema>>> {
    Logger.info('AuthApi', 'Checking if registration is enabled');

    try {
      return this.get<ApiResponse<z.infer<typeof RegistrationEnabledSchema>>>(
        '/auth/registration-enabled',
        undefined,
        ApiResponseSchema(RegistrationEnabledSchema),
      );
    } catch (error) {
      Logger.warn('AuthApi', 'Error checking registration status, defaulting to disabled', {
        error,
      });
      return SuccessApiResponse({ enabled: false });
    }
  }

  /**
   * Request password reset
   */
  async resetPassword(email: string): Promise<VoidApiResponse> {
    Logger.info('AuthApi', `Requesting password reset for: ${email}`);

    return this.post<VoidApiResponse>(
      '/auth/reset-password',
      { email },
      undefined,
      VoidApiResponseSchema,
    );
  }

  /**
   * Resend verification email
   */
  async resendVerification(email: string): Promise<VoidApiResponse> {
    Logger.info('AuthApi', `Resending verification email for: ${email}`);

    return this.post<VoidApiResponse>(
      '/auth/resend-verification',
      { email },
      undefined,
      VoidApiResponseSchema,
    );
  }
}

// Export singleton instance
export const authApi = new AuthApiService();
