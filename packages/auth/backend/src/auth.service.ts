import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createClient,
  AuthError as SupabaseAuthError,
  SupabaseClient,
  Session as SupabaseSession,
} from '@supabase/supabase-js';
import {
  ApiResponse,
  BadRequestApiResponse,
  InternalServerErrorApiResponse,
  SuccessApiResponse,
  UnauthorizedApiResponse,
} from '@yesterday-ai/api-contracts';
import {
  LoginResponseSchema,
  LoginSchema,
  RegisterSchema,
  RegistrationEnabledSchema,
  SupabaseUserSessionResponse,
} from '@yesterday-ai/auth-contracts';
import { User } from '@yesterday-ai/user-contracts';
import { UsersDbService } from '@yesterday-ai/user-database';
import { getMessageFromUnknownError, toBoolean } from '@yesterday-ai/utils-shared';
import { z } from 'zod';
import { JwtUser } from './decorators/jwt-user.decorator';

export type SupabaseUserSession = { session: SupabaseSession; user: JwtUser };

@Injectable()
export class AuthService {
  private supabase: SupabaseClient;
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private configService: ConfigService,
    private usersDbService: UsersDbService,
  ) {
    this.supabase = createClient(
      this.configService.get<string>('SUPABASE_URL') || '',
      this.configService.get<string>('SUPABASE_ANON_KEY') || '',
    );
  }

  private debug(message: string) {
    if (toBoolean(this.configService.get('DEBUG_API_AUTH'))) {
      this.logger.debug(message);
    }
  }

  async login(
    credentials: z.infer<typeof LoginSchema>,
    requireAdmin = false,
  ): Promise<z.infer<typeof LoginResponseSchema>> {
    try {
      this.debug(`Login attempt: ${credentials.email}${requireAdmin ? ' (admin login)' : ''}`);

      // Standard login for all users
      const { data, error } = await this.supabase.auth.signInWithPassword(credentials);

      if (error) {
        // Provide more specific error messages based on the error code/message
        if (
          error.message.includes('not confirmed') ||
          error.message.includes('email has not been confirmed') ||
          error.code === 'email_not_confirmed'
        ) {
          this.logger.error(`Login failed: Email not verified for ${credentials.email}`);
          throw new UnauthorizedException(
            'Email not verified. Please check your inbox for a verification link and confirm your email before logging in.',
          );
        }

        if (error.message.includes('Invalid login credentials')) {
          this.logger.error(`Login failed: Invalid credentials for ${credentials.email}`);
          throw new UnauthorizedException('Invalid email or password.');
        }

        // Generic error with the original message but no stack trace
        this.logger.error(`Login failed: ${error.message} for ${credentials.email}`);
        throw new UnauthorizedException(`Authentication failed: ${error.message}`);
      }

      // Check if user exists in our database for role validation
      const dbUser = await this.usersDbService.findByEmail(credentials.email);

      if (!dbUser) {
        this.logger.error(`Login failed: User ${credentials.email} not found in database`);
        throw new UnauthorizedException('User not found in system. Please contact support.');
      }

      // If admin login is required, validate the role
      if (requireAdmin && dbUser.role !== 'admin') {
        this.logger.error(
          `Admin login failed: User ${credentials.email} does not have admin role (has: ${dbUser.role})`,
        );
        throw new UnauthorizedException(
          'Not authorized as admin. Your account does not have administrator privileges.',
        );
      }

      this.logger.log(`Login successful: ${credentials.email}`);
      return {
        user: {
          user: data.user,
          profile: dbUser,
        },
        session: data.session,
        token: data.session?.access_token,
      };
    } catch (error) {
      // If it's our UnauthorizedException, just log the message without stack trace
      if (error instanceof UnauthorizedException) {
        this.logger.error(`Login error: ${error.message}`);
        throw error; // Rethrow our detailed exception
      }
      if (error instanceof Error) {
        this.logger.error(`Unexpected login error for ${credentials.email}: ${error.message}`);
        throw new UnauthorizedException(error.message || 'Authentication failed');
      }
      this.logger.error(`Unexpected login error for ${credentials.email}`);
      throw new UnauthorizedException('Authentication failed');
    }
  }

  private isPreregisteredAdmin(email: string): boolean {
    return ['wegener.alexander@gmail.com', 'sidwach@gmail.com'].includes(email.toLowerCase());
  }

  async register(
    userData: z.infer<typeof RegisterSchema>,
  ): Promise<z.infer<typeof LoginResponseSchema>> {
    try {
      this.logger.log(`Starting registration for user: ${userData.email}`);

      // Standard registration for mobile app users
      const { data, error } = await this.supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            name: userData.name,
          },
        },
      });

      if (error) {
        this.logger.error('Supabase auth signup error:', error);
        throw new UnauthorizedException('Registration failed: ' + error.message);
      }

      this.logger.log(`Supabase auth user created successfully for: ${userData.email}`);

      // Ensure we have a proper response with both session and user
      if (!data || !data.user) {
        this.logger.error('Invalid user data received from Supabase:', data);
        throw new Error('User registration failed: Invalid user data received');
      }

      // Check if user already exists in our database
      let dbUser = await this.usersDbService.findByEmail(userData.email);

      if (!dbUser) {
        this.logger.log(`Creating database record for new user: ${userData.email}`);

        try {
          // Create new user with the ID from Supabase auth
          dbUser = await this.usersDbService.create({
            id: data.user.id,
            email: userData.email,
            name: userData.name || data.user.email,
            role: this.isPreregisteredAdmin(userData.email) ? 'admin' : 'user', // Default role for regular users
          });

          this.logger.log(
            `Database record created successfully for user: ${userData.email}, ID: ${dbUser.id}`,
          );
        } catch (dbError) {
          this.logger.error('Error creating database record for user:', dbError);
          // Even if db creation fails, we want to return the auth user so frontend has token
          this.logger.warn('Continuing with auth-only user for now');
        }
      } else {
        this.logger.log(`User ${userData.email} already exists in database with ID: ${dbUser.id}`);
      }

      // If we don't have a session (email confirmation required), create a sign-in session
      if (!data.session && dbUser) {
        this.logger.log('No session in signup response, attempting to sign in user');
        try {
          const signInResult = await this.supabase.auth.signInWithPassword({
            email: userData.email,
            password: userData.password,
          });

          if (signInResult.error) {
            this.logger.warn('Could not auto-login after registration:', signInResult.error);

            // Check if this is due to email confirmation requirement
            if (
              signInResult.error.message.includes('not confirmed') ||
              signInResult.error.code === 'email_not_confirmed'
            ) {
              // Return special response indicating email confirmation is needed
              return {
                user: {
                  user: data.user,
                  profile: dbUser,
                },
                token: '',
                requiresEmailConfirmation: true,
                message: 'Registration successful, but email confirmation required',
              };
            }
            // Return what we have, frontend will handle this
          } else {
            // Return the session and merge our database user with Supabase user
            return {
              session: signInResult.data.session,
              token: signInResult.data.session?.access_token,
              user: {
                user: signInResult.data.user,
                profile: dbUser,
              },
            };
          }
        } catch (signInError: any) {
          this.logger.warn('Error during auto-login after registration:', signInError);

          // Return a clear message about email confirmation if that's the issue
          if (signInError instanceof SupabaseAuthError) {
            if (
              signInError.message &&
              (signInError.message.includes('not confirmed') ||
                signInError.code === 'email_not_confirmed')
            ) {
              return {
                user: {
                  user: data.user,
                  profile: dbUser,
                },
                token: '',
                requiresEmailConfirmation: true,
                message: 'Registration successful, but email confirmation required',
              };
            }
          }
        }
      }

      if (!data.session) {
        this.logger.error('No session in registration response');
        throw new UnauthorizedException('No session in registration response');
      }

      if (!dbUser) {
        this.logger.error('User not found in database after registration');
        throw new UnauthorizedException('User not found in database after registration');
      }

      // Return the session and merge our database user with Supabase user
      return {
        session: data.session,
        token: data.session?.access_token,
        user: {
          user: data.user,
          profile: dbUser,
        },
        ...(data.user?.email_confirmed_at === null ? { requiresEmailConfirmation: true } : {}),
      };
    } catch (error) {
      this.logger.error('Registration error:', error);
      throw error;
    }
  }

  async validateToken(token: string): Promise<JwtUser> {
    try {
      if (this.configService.get('DEBUG_SUPABASE_AUTH')) {
        this.logger.debug(`Validating token: ${token.substring(0, 10)}...`);
      }

      if (!token || token.length < 20) {
        this.logger.error(`Invalid token format: Token too short or missing`);
        throw new UnauthorizedException(`Invalid token format`);
      }

      // Print token format info for debugging
      this.debug(`Token format check: Starts with eyJ: ${token.startsWith('eyJ')}`);
      this.debug(`Token format check: Contains periods: ${token.includes('.')}`);

      const {
        data: { user },
        error,
      } = await this.supabase.auth.getUser(token);

      if (error || !user) {
        this.logger.error(`Token validation error: ${error?.message || 'No user found for token'}`);
        this.logger.error(`Error code: ${error?.code || 'unknown'}`);
        this.logger.error(`Error status: ${error?.status || 'unknown'}`);
        throw new UnauthorizedException(`Invalid token: ${error?.message || 'No user found'}`);
      }

      // Check if user exists in our database
      if (!user.email) {
        this.logger.error(`User email not found in Supabase user object`);
        throw new UnauthorizedException(`Invalid token: User email not found`);
      }
      let dbUser = await this.usersDbService.findByEmail(user.email);

      // If user doesn't exist in our database, create them with default role
      if (!dbUser) {
        this.logger.warn(
          `User ${user.email} exists in Supabase auth but not in database, creating record`,
        );
        try {
          dbUser = await this.usersDbService.create({
            id: user.id,
            email: user.email,
            name: user.user_metadata?.name || user.email,
            role: 'user', // Default role
          });
          this.logger.log(`Created database record for user ${user.email} with ID ${dbUser.id}`);
        } catch (dbError) {
          this.logger.error(
            { dbError },
            `Failed to create user in database: ${getMessageFromUnknownError(dbError)}`,
          );
          throw new UnauthorizedException('User validation failed: Database error');
        }
      } else {
        this.debug(`User ${user.email} found in database with role: ${dbUser.role}`);
      }

      // Check if email is verified for production environments
      if (process.env.NODE_ENV === 'production' && !user.email_confirmed_at) {
        this.logger.warn(`User ${user.email} has not verified their email`);
        throw new UnauthorizedException(
          'Email not verified. Please check your inbox for a verification link.',
        );
      }
      const validatedUser = {
        user,
        profile: dbUser,
      };

      this.debug(
        `Token successfully validated for ${validatedUser.user.email} with role: ${validatedUser.profile.role}`,
      );
      return validatedUser;
    } catch (error) {
      this.logger.error({ error }, `Token validation failed: ${getMessageFromUnknownError(error)}`);
      throw error;
    }
  }

  async createAdminUser(userData: z.infer<typeof RegisterSchema>): Promise<User> {
    // First, create user in Supabase
    const { data, error } = await this.supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          name: userData.name,
        },
      },
    });

    if (error || !data.user) {
      throw new UnauthorizedException(
        `Admin creation failed: ${getMessageFromUnknownError(error)}`,
      );
    }

    // Then, create or update user in our database with admin role
    const dbUser = await this.usersDbService.findByEmail(userData.email);

    if (dbUser) {
      // Update to admin role if user already exists
      const updatedUser = await this.usersDbService.update(dbUser.id, { role: 'admin' });
      if (!updatedUser) {
        throw new UnauthorizedException('Admin creation failed: Database error');
      }
      return updatedUser;
    } else {
      // Create new admin user
      return await this.usersDbService.create({
        id: data.user.id,
        email: userData.email,
        name: userData.name || data.user.email,
        role: 'admin',
      });
    }
  }

  async getProfile(user: JwtUser): Promise<User> {
    if (!user?.user?.id) {
      throw new UnauthorizedException('User not authenticated');
    }

    const dbUser = await this.usersDbService.findById(user.user.id);

    if (!dbUser) {
      throw new UnauthorizedException('User not found in database');
    }

    return dbUser;
  }

  /**
   * Attempts to restore a session from cookies
   * This helps when localStorage and cookies get out of sync
   */
  async restoreSessionFromCookies(cookieHeader: string): Promise<SupabaseUserSessionResponse> {
    try {
      this.logger.log('Attempting to restore session from cookies');

      // Parse the auth cookie - looking for sb-* cookies
      const cookies = cookieHeader.split(';').map((cookie) => cookie.trim());
      const authCookie = cookies.find((cookie) => cookie.startsWith('sb-'));

      if (!authCookie) {
        this.logger.log('No Supabase auth cookie found');
        return UnauthorizedApiResponse('No auth cookie found');
      }

      this.logger.log('Found Supabase auth cookie');

      // Use Supabase admin API to create a new session from cookies
      // Note: This is an approximation - you may need to adjust according to Supabase SDK
      try {
        const { data, error } = await this.supabase.auth.getSession();

        if (error) {
          this.logger.error('Error getting session from Supabase:', error);
          return { success: false, statusCode: 500, error: error.message };
        }

        if (data.session) {
          this.logger.log('Successfully restored session from cookies');

          // If user exists in session, try to get user details from our database
          if (data.session.user && data.session.user.email) {
            const dbUser = await this.usersDbService.findByEmail(data.session.user.email);

            if (dbUser) {
              // Combine Supabase user with our database user
              const user = {
                user: data.session.user,
                profile: dbUser,
              };

              return SuccessApiResponse({
                session: data.session,
                user,
              });
            } else {
              // User exists in Supabase but not in our database
              return SuccessApiResponse({
                session: data.session,
                // user: {
                //   user: data.session.user,
                //   profile: null,
                // },
                user: null,
              });
            }
          }

          // Just return the session if no user data
          return SuccessApiResponse({
            session: data.session,
            user: null,
          });
        }

        return UnauthorizedApiResponse('No session found in cookies');
      } catch (supabaseError) {
        this.logger.error('Error in Supabase getSession:', supabaseError);
        return InternalServerErrorApiResponse(supabaseError, 'Error in Supabase getSession');
      }
    } catch (error) {
      this.logger.error('Error restoring session from cookies:', error);
      return InternalServerErrorApiResponse(error, 'Error restoring session from cookies');
    }
  }

  async isRegistrationEnabled(): Promise<ApiResponse<z.infer<typeof RegistrationEnabledSchema>>> {
    try {
      // In a real implementation, this might check a database setting
      // For now, we'll use a simple return value
      // Later this could be updated to check the admin settings table
      return SuccessApiResponse({ enabled: true }); // Default to enabled for development
    } catch (error) {
      throw new Error('Could not check registration status');
    }
  }

  async resendVerificationEmail(email: string) {
    try {
      this.logger.log(`Resending verification email for: ${email}`);

      // Use the resend method with type "signup" to resend the verification email
      const { data, error } = await this.supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${this.configService.get<string>('FRONTEND_URL') || ''}/login`,
        },
      });

      if (error) {
        this.logger.error('Error resending verification email:', error);
        return BadRequestApiResponse(`Failed to send verification email: ${error.message}`);
      }

      this.logger.log(`Verification email resent to: ${email}`);
      return SuccessApiResponse(undefined, 'Verification email sent. Please check your inbox.');
    } catch (error) {
      this.logger.error('Error in resendVerificationEmail:', error);
      return InternalServerErrorApiResponse(error, 'Error in resendVerificationEmail');
    }
  }

  async resetPassword(email: string) {
    try {
      this.logger.log(`Sending password reset email for: ${email}`);

      // This is specifically for password reset
      const { data, error } = await this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${this.configService.get<string>('FRONTEND_URL') || ''}/reset-password`,
      });

      if (error) {
        this.logger.error('Error sending password reset email:', error);
        return BadRequestApiResponse(`Failed to send password reset email: ${error.message}`);
      }

      this.logger.log(`Password reset email sent to: ${email}`);
      return SuccessApiResponse(undefined, 'Password reset email sent. Please check your inbox.');
    } catch (error) {
      this.logger.error('Error in resetPassword:', error);
      return InternalServerErrorApiResponse(error, 'Error in resetPassword');
    }
  }
}
