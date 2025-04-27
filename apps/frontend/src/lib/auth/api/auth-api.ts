import { BaseApiService } from '@/lib/api';
import { Logger } from '@/utils/logger';
import {
  ApiResponse,
  ApiResponseSchema,
  JwtUser,
  JwtUserSchema,
  Login,
  LoginResponse,
  LoginResponseSchema,
  Register,
  RegistrationEnabled,
  RegistrationEnabledSchema,
  SuccessApiResponse,
  SupabaseUserSessionResponse,
  SupabaseUserSessionResponseSchema,
  User,
  UserSchema,
  VoidApiResponse,
  VoidApiResponseSchema,
} from '@pixeltales/contracts';

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
  async login(credentials: Login): Promise<LoginResponse> {
    Logger.info('AuthApi', `Logging in user: ${credentials.email}`);

    const result = await this.post('/auth/login', credentials, undefined, LoginResponseSchema);
    return result as LoginResponse;
  }

  /**
   * Register a new user
   */
  async register(userData: Register): Promise<LoginResponse> {
    Logger.info('AuthApi', `Registering new user: ${userData.email}`);

    const result = await this.post('/auth/register', userData, undefined, LoginResponseSchema);
    return result as LoginResponse;
  }

  /**
   * Create a new admin user (requires admin permissions)
   */
  async createAdmin(userData: Register): Promise<LoginResponse> {
    Logger.info('AuthApi', `Creating admin user: ${userData.email}`);

    const result = await this.post('/auth/admin/create', userData, undefined, LoginResponseSchema);
    return result as LoginResponse;
  }

  /**
   * Get the current user's profile
   */
  async getProfile(): Promise<User> {
    Logger.info('AuthApi', 'Getting user profile');

    return this.get('/auth/me', undefined, UserSchema);
  }

  /**
   * Validate the current authentication token
   */
  async validateToken(): Promise<JwtUser> {
    Logger.info('AuthApi', 'Validating auth token');

    return this.get('/auth/validate', undefined, JwtUserSchema);
  }

  /**
   * Get session from cookies (used for SSR)
   */
  async getSessionFromCookies(): Promise<SupabaseUserSessionResponse> {
    Logger.info('AuthApi', 'Getting session from cookies');

    return this.get('/auth/session', undefined, SupabaseUserSessionResponseSchema);
  }

  /**
   * Check if registration is currently enabled
   */
  async isRegistrationEnabled(): Promise<ApiResponse<RegistrationEnabled>> {
    Logger.info('AuthApi', 'Checking if registration is enabled');

    try {
      return this.get(
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

    return this.post('/auth/reset-password', { email }, undefined, VoidApiResponseSchema);
  }

  /**
   * Resend verification email
   */
  async resendVerification(email: string): Promise<VoidApiResponse> {
    Logger.info('AuthApi', `Resending verification email for: ${email}`);

    return this.post('/auth/resend-verification', { email }, undefined, VoidApiResponseSchema);
  }
}

// Export singleton instance
export const authApi = new AuthApiService();
