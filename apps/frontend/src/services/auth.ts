import { authApi } from '@/lib/api';
import { userApi } from '@/lib/api/user-api';
import { Logger } from '@/utils/logger';
import {
  CreateUserDTO,
  JwtUser,
  SupabaseSession,
  SupabaseUser,
  User,
  VoidApiResponse,
} from '@pixeltales/contracts';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '../config';
import { supabase } from './supabase';

// Helper to identify the specific Supabase "no session" error
function isAuthSessionMissingError(error: unknown): boolean {
  return error instanceof Error && error.message.includes('Auth session missing');
}

// Type for the state change listener callback
type AuthStateListener = (user: User | null, supabaseUser: SupabaseUser | null) => void;

/**
 * AuthService manages authentication and user data
 * It uses Supabase for auth but stores user data in our backend
 */
export class AuthService {
  private static instance: AuthService;
  private currentSessionToken: string | null = null;
  private currentUser: User | null = null;
  private currentSupabaseUser: SupabaseUser | null = null; // Store supabase user too
  private authStateListenerAttached = false; // <-- Add flag here
  private isRegistrationEnabledCache: boolean | null = null;
  private tokenRefreshTimer: ReturnType<typeof setTimeout> | null = null;
  private stateListeners: Set<AuthStateListener> = new Set(); // Store listeners

  // Expose supabase for direct access
  public readonly supabase = supabase;

  private constructor() {}

  /**
   * Get singleton instance of AuthService
   */
  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Check if Supabase is properly configured with valid URL and key
   */
  public isSupabaseConfigured(): boolean {
    const supabaseUrl = SUPABASE_URL;
    const supabaseAnonKey = SUPABASE_ANON_KEY;

    const isConfigured = !!supabaseUrl && !!supabaseAnonKey;

    if (!isConfigured) {
      Logger.error('AuthService', '❌ Supabase environment variables are missing');
    }

    return isConfigured;
  }

  /**
   * Initialize auth service by checking for current session
   */
  public async init(): Promise<void> {
    // Ensure listener is attached only once (idempotent)
    if (this.authStateListenerAttached) {
      return;
    }

    Logger.info('AuthService', 'Attaching Supabase onAuthStateChange listener...');

    // Setup auth state change listener
    supabase.auth.onAuthStateChange(async (event, session) => {
      Logger.info('AuthService', `Auth state changed: ${event}, user: ${!!session?.user}`);
      this.currentSessionToken = session?.access_token ?? null;
      this.currentSupabaseUser = session?.user ?? null;

      if (session?.user) {
        // Only sync if the user wasn't already logged in or the ID changed
        if (!this.currentUser || this.currentUser.id !== session.user.id) {
          Logger.info('AuthService', 'New user session detected, syncing with backend...');
          await this.syncUserWithBackend(session.user);
        } else {
          Logger.debug('AuthService', 'User session already known, skipping redundant sync.');
        }

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          this.setupTokenRefresh(session);
        }
      } else {
        this.currentUser = null;
        this.clearTokenRefresh();
        this.currentSessionToken = null;
      }
      // Notify listeners about the state change
      this.notifyListeners();
    });

    this.authStateListenerAttached = true;

    // Important: The onAuthStateChange listener fires immediately with the current state,
    // so we don't need to explicitly getSession() or notifyListeners() here.
    // The initial state will be pushed through the listener itself.
  }

  /**
   * Setup token refresh mechanism
   */
  private setupTokenRefresh(session: SupabaseSession): void {
    // Clear any existing timer
    this.clearTokenRefresh();

    try {
      // Calculate time until token expiry (with 5 minute buffer)
      const expiresAt = session.expires_at;
      if (!expiresAt) return;

      const expiresAtDate = new Date(expiresAt * 1000);
      const now = new Date();

      // Calculate time until expiry minus 5 minute buffer
      const timeUntilExpiry = expiresAtDate.getTime() - now.getTime() - 5 * 60 * 1000;

      // Don't setup refresh if token is already expired or will expire in less than a minute
      if (timeUntilExpiry < 60 * 1000) {
        Logger.warn('AuthService', '🟡 Token expiring too soon, initiating immediate refresh');
        this.refreshToken();
        return;
      }

      Logger.info(
        'AuthService',
        `Setting up token refresh in ${Math.floor(timeUntilExpiry / 60000)} minutes`,
      );

      // Setup timer to refresh token
      this.tokenRefreshTimer = setTimeout(() => {
        this.refreshToken();
      }, timeUntilExpiry);
    } catch (err) {
      Logger.error('AuthService', '❌ Error setting up token refresh', err);
    }
  }

  /**
   * Clear token refresh timer
   */
  private clearTokenRefresh(): void {
    if (this.tokenRefreshTimer) {
      clearTimeout(this.tokenRefreshTimer);
      this.tokenRefreshTimer = null;
    }
  }

  /**
   * Refresh authentication token
   */
  public async refreshToken(): Promise<boolean> {
    try {
      Logger.info('AuthService', 'Refreshing authentication token');
      const { data, error } = await supabase.auth.refreshSession();

      if (error) {
        throw error;
      }

      if (data.session) {
        Logger.info('AuthService', '✅ Token refreshed successfully');
        this.setupTokenRefresh(data.session);
        return true;
      } else {
        Logger.warn('AuthService', '🔴 No session returned from token refresh');
        return false;
      }
    } catch (err) {
      const errorData = err instanceof Error ? err : new Error('Unknown error');
      Logger.error('AuthService', '❌ Failed to refresh token', errorData);
      return false;
    }
  }

  /**
   * Sync Supabase user with backend database
   */
  private async syncUserWithBackend(supabaseUser: SupabaseUser): Promise<User | null> {
    try {
      if (!supabaseUser) {
        Logger.warn('AuthService', '🔴 [syncUserWithBackend] No Supabase user provided for sync');
        return null;
      }

      // Create/update user in backend
      const userData: CreateUserDTO = {
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        name: (supabaseUser.user_metadata?.name as string) || '',
      };

      // Skip if no email (should not happen)
      if (!userData.email) {
        Logger.warn('AuthService', '🔴 [syncUserWithBackend] No email found for user');
        return null;
      }

      Logger.info(
        'AuthService',
        `[syncUserWithBackend] Calling userApi.syncProfile for: ${userData.email}`,
      );

      // Use the dedicated API service
      const syncedUser = await userApi.syncProfile(userData);

      this.currentUser = syncedUser;
      Logger.info(
        'AuthService',
        `✅ [syncUserWithBackend] User synced successfully: ${this.currentUser?.id || 'unknown'}`,
      );
      return this.currentUser;
    } catch (error) {
      Logger.error('AuthService', '❌ [syncUserWithBackend] Error syncing user', error);
      return null;
    }
  }

  /**
   * Get the current authenticated user from the backend
   */
  public async getCurrentUser(): Promise<User | null> {
    try {
      const { data, error } = await supabase.auth.getUser();

      if (error) {
        // Log session missing as debug, other errors as error
        if (isAuthSessionMissingError(error)) {
          Logger.debug('AuthService', '🔴 getCurrentUser: No active session found in Supabase.');
        } else {
          Logger.error('AuthService', '❌ Error getting current user from Supabase', error);
        }
        return null;
      }

      if (!data.user) {
        Logger.info('AuthService', '🔴 No authenticated user found');
        return null;
      }

      // Check if we need to sync with backend
      if (!this.currentUser || this.currentUser.id !== data.user.id) {
        Logger.info('AuthService', '🟡 Current user needs sync with backend');
        // Sync happens via onAuthStateChange, just return potentially stale currentUser for now
        // OR force sync here if immediate data is critical upon first call?
        // Let's rely on onAuthStateChange for now.
        // return this.syncUserWithBackend(data.user);
      }

      return this.currentUser;
    } catch (error) {
      Logger.error('AuthService', '❌ Error getting current user', error);
      return null;
    }
  }

  /**
   * Get the current authenticated Supabase user
   */
  public async getSupabaseUser(): Promise<SupabaseUser | null> {
    try {
      const { data, error } = await supabase.auth.getUser();

      if (error) {
        // Log session missing as debug, other errors as error
        if (isAuthSessionMissingError(error)) {
          Logger.debug('AuthService', '🔴 getSupabaseUser: No active session found in Supabase.');
        } else {
          Logger.error('AuthService', '❌ Error getting Supabase user', error);
        }
        this.currentSupabaseUser = null; // Clear on error
        return null;
      }

      return data.user;
    } catch (error) {
      Logger.error('AuthService', '❌ Error getting Supabase user', error);
      this.currentSupabaseUser = null; // Clear on error
      return null;
    }
  }

  /**
   * Sign out the user
   */
  public async signOut(): Promise<void> {
    try {
      this.clearTokenRefresh();
      Logger.info('AuthService', 'Signing out user');
      await supabase.auth.signOut();
      this.currentUser = null;
      this.currentSupabaseUser = null;
      this.currentSessionToken = null;
      this.notifyListeners(); // Notify about sign out
      Logger.info('AuthService', '✅ User signed out successfully');
    } catch (error) {
      Logger.error('AuthService', '❌ Error signing out', error);
      throw error;
    }
  }

  /**
   * Check if user has admin role
   */
  public isAdmin(): boolean {
    return this.currentUser?.role === 'admin';
  }

  /**
   * Check if registration is enabled
   */
  public async isRegistrationEnabled(): Promise<boolean> {
    if (this.isRegistrationEnabledCache !== null) {
      return this.isRegistrationEnabledCache;
    }

    try {
      Logger.info('AuthService', 'Checking if registration is enabled');
      const result = await authApi.isRegistrationEnabled();
      this.isRegistrationEnabledCache = result.data?.enabled || false;
      return this.isRegistrationEnabledCache;
    } catch (error) {
      const errorData = error instanceof Error ? error : new Error('Unknown error');
      Logger.warn('AuthService', '🔴 Error checking registration status, defaulting to disabled', {
        errorData,
      });
      return false;
    }
  }

  /**
   * Validate current authentication token with backend
   */
  public async validateToken(): Promise<JwtUser | null> {
    try {
      return await authApi.validateToken();
    } catch (error) {
      Logger.error('AuthService', '❌ Token validation failed', error);
      return null;
    }
  }

  /**
   * Login with email and password via the backend API
   */
  public async login(credentials: {
    email: string;
    password: string;
  }): Promise<{ token: string; session?: object }> {
    try {
      Logger.info('AuthService', `Logging in user: ${credentials.email}`);
      return await authApi.login(credentials);
    } catch (error) {
      Logger.error('AuthService', '❌ Login failed', error);
      throw error;
    }
  }

  /**
   * Register a new user via the backend API
   */
  public async register(userData: {
    email: string;
    password: string;
    name?: string;
  }): Promise<{ token: string; session?: object }> {
    try {
      Logger.info('AuthService', `Registering new user: ${userData.email}`);
      return await authApi.register(userData);
    } catch (error) {
      Logger.error('AuthService', '❌ Registration failed', error);
      throw error;
    }
  }

  /**
   * Request password reset
   */
  public async resetPassword(email: string): Promise<VoidApiResponse> {
    try {
      Logger.info('AuthService', `Requesting password reset for: ${email}`);
      return await authApi.resetPassword(email);
    } catch (error) {
      Logger.error('AuthService', '❌ Password reset request failed', error);
      throw error;
    }
  }

  /**
   * Resend verification email
   */
  public async resendVerification(email: string): Promise<VoidApiResponse> {
    try {
      Logger.info('AuthService', `Resending verification email for: ${email}`);
      return await authApi.resendVerification(email);
    } catch (error) {
      Logger.error('AuthService', '❌ Failed to resend verification email', error);
      throw error;
    }
  }

  /**
   * Create a new admin user (requires admin permissions)
   */
  public async createAdmin(userData: {
    email: string;
    password: string;
    name?: string;
  }): Promise<{ token: string; session?: object }> {
    try {
      Logger.info('AuthService', `Creating admin user: ${userData.email}`);
      return await authApi.createAdmin(userData);
    } catch (error) {
      Logger.error('AuthService', '❌ Failed to create admin user', error);
      throw error;
    }
  }

  /**
   * Synchronously get the current Supabase session access token, if available.
   */
  public getCurrentAccessToken(): string | null {
    return this.currentSessionToken;
  }

  // Method for components/hooks to subscribe to state changes
  public subscribe(listener: AuthStateListener): () => void {
    this.stateListeners.add(listener);
    // Return an unsubscribe function
    return () => {
      this.stateListeners.delete(listener);
    };
  }

  // Notify all registered listeners
  private notifyListeners(): void {
    Logger.debug(
      'AuthService',
      `Notifying ${this.stateListeners.size} listeners of auth state change.`,
    );
    this.stateListeners.forEach((listener) => listener(this.currentUser, this.currentSupabaseUser));
  }

  // Synchronous getter for current Supabase user (used by useAuth for initial state)
  public getSupabaseUserNow(): SupabaseUser | null {
    return this.currentSupabaseUser;
  }

  // Synchronous getter for current backend user (used by useAuth for initial state)
  public getCurrentUserNow(): User | null {
    return this.currentUser;
  }
}

// Export singleton instance
export const authService = AuthService.getInstance();
