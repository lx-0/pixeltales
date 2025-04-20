import { authService } from '@/services/auth';
import { Logger } from '@/utils/logger';
import { User } from '@pixeltales/contracts';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';

// Helper to identify the specific Supabase "no session" error
function isAuthSessionMissingError(error: unknown): boolean {
  return error instanceof Error && error.message.includes('Auth session missing');
}

/**
 * Main authentication hook that provides React state management
 * for authentication data from authService
 */
export function useAuth() {
  // User state
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isRegistrationEnabled, setIsRegistrationEnabled] = useState<boolean | null>(null);

  // Authentication mutation states
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [isResendingVerification, setIsResendingVerification] = useState(false);
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);

  // Authentication error states
  const [loginError, setLoginError] = useState<Error | null>(null);
  const [registerError, setRegisterError] = useState<Error | null>(null);
  const [resetPasswordError, setResetPasswordError] = useState<Error | null>(null);
  const [resendVerificationError, setResendVerificationError] = useState<Error | null>(null);
  const [createAdminError, setCreateAdminError] = useState<Error | null>(null);

  // Initialize and load user on mount
  useEffect(() => {
    Logger.debug('useAuth', 'useEffect mount - Initializing AuthService and subscribing');

    let isMounted = true; // Use simple mount flag
    let initialLoadingState = true; // Track if we are still in the initial loading phase

    // 1. Ensure AuthService listener is attached
    authService.init(); // Safe to call multiple times due to internal check

    // 2. Subscribe to subsequent changes (REMOVED sync check)
    const unsubscribe = authService.subscribe((newUser, newSupabaseUser) => {
      if (isMounted) {
        Logger.info('useAuth', '🔄 Received state update from AuthService subscription', {
          userId: newUser?.id ?? 'null',
          supabaseUserId: newSupabaseUser?.id ?? 'null',
        });
        setUser(newUser);
        setSupabaseUser(newSupabaseUser);

        // Set loading to false only after the first update arrives
        if (initialLoadingState) {
          setLoading(false);
          initialLoadingState = false; // Prevent setting loading state again
          Logger.debug(
            'useAuth',
            'First state update received from subscription, setting loading to false.',
          );
        }
      }
    });

    // 3. Check registration status (can run async after initial render)
    const checkRegistration = async () => {
      try {
        const registrationEnabled = await authService.isRegistrationEnabled();
        if (isMounted) {
          setIsRegistrationEnabled(registrationEnabled);
          Logger.info('useAuth', 'Registration enabled status set:', { registrationEnabled });
        }
      } catch (err) {
        Logger.error('useAuth', '❌ Failed to check registration status', err);
        // Optionally set an error state here if needed
      }
    };
    checkRegistration(); // No need to await here

    // Cleanup subscription and mounted state
    return () => {
      Logger.debug('useAuth', 'useEffect cleanup');
      isMounted = false; // Mark as unmounted
      unsubscribe(); // Unsubscribe from AuthService
    };
  }, []); // Empty dependency array ensures this runs only once on mount

  /**
   * Login with email and password
   */
  const login = async (credentials: { email: string; password: string }) => {
    setIsLoggingIn(true);
    setLoginError(null);

    try {
      Logger.info('useAuth', `Logging in user: ${credentials.email}`);
      const result = await authService.login(credentials);

      // Refresh user data after login
      await refreshUser();

      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setLoginError(error);
      Logger.error('useAuth', '❌ Login failed', error);
      throw error;
    } finally {
      setIsLoggingIn(false);
    }
  };

  /**
   * Register a new user
   */
  const register = async (userData: { email: string; password: string; name?: string }) => {
    setIsRegistering(true);
    setRegisterError(null);

    try {
      Logger.info('useAuth', `Registering new user: ${userData.email}`);
      const result = await authService.register(userData);

      // Refresh user data after registration
      await refreshUser();

      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setRegisterError(error);
      Logger.error('useAuth', '❌ Registration failed', error);
      throw error;
    } finally {
      setIsRegistering(false);
    }
  };

  /**
   * Create a new admin user (requires admin permissions)
   */
  const createAdmin = async (userData: { email: string; password: string; name?: string }) => {
    setIsCreatingAdmin(true);
    setCreateAdminError(null);

    try {
      Logger.info('useAuth', `Creating admin user: ${userData.email}`);
      return await authService.createAdmin(userData);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setCreateAdminError(error);
      Logger.error('useAuth', '❌ Failed to create admin user', error);
      throw error;
    } finally {
      setIsCreatingAdmin(false);
    }
  };

  /**
   * Request password reset
   */
  const resetPassword = async (email: string) => {
    setIsResettingPassword(true);
    setResetPasswordError(null);

    try {
      Logger.info('useAuth', `Requesting password reset for: ${email}`);
      return await authService.resetPassword(email);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setResetPasswordError(error);
      Logger.error('useAuth', '❌ Password reset request failed', error);
      throw error;
    } finally {
      setIsResettingPassword(false);
    }
  };

  /**
   * Resend verification email
   */
  const resendVerification = async (email: string) => {
    setIsResendingVerification(true);
    setResendVerificationError(null);

    try {
      Logger.info('useAuth', `Resending verification email for: ${email}`);
      return await authService.resendVerification(email);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setResendVerificationError(error);
      Logger.error('useAuth', '❌ Failed to resend verification email', error);
      throw error;
    } finally {
      setIsResendingVerification(false);
    }
  };

  /**
   * Get the current user's profile
   */
  const getProfile = async () => {
    try {
      Logger.info('useAuth', 'Getting user profile');
      const profile = await authService.getCurrentUser();
      setUser(profile);
      return profile;
    } catch (err) {
      Logger.error('useAuth', '❌ Failed to get user profile', err);
      throw err;
    }
  };

  // Sign out handler
  const signOut = async () => {
    try {
      Logger.info('useAuth', 'Signing out user');
      await authService.signOut();
      setUser(null);
      setSupabaseUser(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      Logger.error('useAuth', '❌ Failed to sign out', { errorMessage });
      setError(err instanceof Error ? err : new Error('Failed to sign out'));
      throw err; // Re-throw to allow callers to handle the error
    }
  };

  // Force refresh user from backend
  const refreshUser = async () => {
    try {
      Logger.info('useAuth', 'Manually refreshing user data');
      setLoading(true);

      const supabaseUserData = await authService.getSupabaseUser();
      setSupabaseUser(supabaseUserData);

      if (supabaseUserData) {
        const backendUser = await authService.getCurrentUser();
        setUser(backendUser);
      } else {
        setUser(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      // Check if the error indicates a missing session (common case)
      if (isAuthSessionMissingError(err)) {
        Logger.debug('useAuth', '🔴 Refresh user: No active session found.');
        setUser(null);
        setSupabaseUser(null);
        setError(null); // Clear any previous errors
      } else {
        // Handle other unexpected errors during refresh
        Logger.error('useAuth', '❌ Failed to refresh user due to unexpected error', {
          errorMessage,
        });
        setError(err instanceof Error ? err : new Error('Failed to refresh user'));
        // Optionally re-throw if callers need to handle it, or just set state
        // throw err;
      }
    } finally {
      setLoading(false);
    }
  };

  // Check if user is admin
  const isAdmin = () => {
    // First check local user data
    if (user?.role === 'admin') return true;

    // Then check service method as fallback
    return authService.isAdmin();
  };

  return {
    // State
    user,
    supabaseUser,
    loading,
    error,
    isRegistrationEnabled,

    // Auth session methods
    signOut,
    refreshUser,
    validateToken: authService.validateToken.bind(authService),
    refreshToken: authService.refreshToken.bind(authService),
    isAdmin: isAdmin(),
    getProfile,

    // API methods
    login,
    register,
    resetPassword,
    resendVerification,
    createAdmin,

    // Loading states
    isLoggingIn,
    isRegistering,
    isResettingPassword,
    isResendingVerification,
    isCreatingAdmin,

    // Errors
    loginError,
    registerError,
    resetPasswordError,
    resendVerificationError,
    createAdminError,
  };
}
