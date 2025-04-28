import { scenesApi } from '@/v1/lib/api/scenes-api';
import { IBaseApiServiceOptions } from '@yesterday-ai/api-frontend';
import { authApi, authService, SupabaseAuthConfig, userApi } from '@yesterday-ai/auth-frontend';
import { Logger } from '@yesterday-ai/logger-frontend';
import { configApi } from './config-api';

const apiOptions: IBaseApiServiceOptions = {
  baseURL: import.meta.env.VITE_BACKEND_URL || '',
};

const supabaseConfig: SupabaseAuthConfig = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
};

if (!apiOptions.baseURL) {
  throw new Error('VITE_BACKEND_URL is not set');
}

export const initApiServices = () => {
  Logger.info('initApiServices', 'Initializing API services...', { supabaseConfig });
  scenesApi.options = apiOptions;
  configApi.options = apiOptions;

  const authApiOptions: IBaseApiServiceOptions = {
    ...apiOptions,
    onAuthHeaderTokenChange: (token: string | null) => {
      Logger.info('onAuthHeaderTokenChange', 'onAuthHeaderTokenChange', { token });
      scenesApi.authHeaderToken = token;
      configApi.authHeaderToken = token;
      userApi.authHeaderToken = token;
    },
  };

  // Auth API with token change callback
  authApi.options = authApiOptions;

  authService.initialize(authApi, supabaseConfig);
};
