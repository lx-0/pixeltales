// Interface defining the minimal contract BaseApiService needs for auth
export interface IAuthServiceForToken {
  getCurrentAccessToken(): string | null;
}

// Injection token
export const AUTH_SERVICE_TOKEN = Symbol('AUTH_SERVICE_TOKEN');
