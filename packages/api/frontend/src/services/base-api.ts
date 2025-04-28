import { ApiResponse } from '@yesterday-ai/api-contracts';
import { Logger } from '@yesterday-ai/logger-frontend';
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';
import { z } from 'zod';

export interface IBaseApiServiceOptions {
  baseURL?: string;
  authHeaderToken?: string;
  onAuthHeaderTokenChange?: (token: string | null) => void;
}

/**
 * Base API service for making HTTP requests
 * Includes error handling, logging, and optional auth header injection.
 */
export class BaseApiService {
  protected readonly api: AxiosInstance;
  protected readonly context: string;
  protected _baseURL: string | undefined;

  // Auth header token
  private _authHeaderToken: string | null = null;
  private onAuthHeaderTokenChangeCallback: ((token: string | null) => void) | null = null;

  constructor(context: string, options?: IBaseApiServiceOptions) {
    this.context = context;
    this._baseURL = options?.baseURL;
    this._authHeaderToken = options?.authHeaderToken ?? null;
    this.onAuthHeaderTokenChangeCallback = options?.onAuthHeaderTokenChange ?? null;
    this.api = axios.create({
      baseURL: this._baseURL,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    Logger.info(this.context, `Initialized with Base URL: ${this._baseURL}`);

    // Add response interceptor for logging
    this.api.interceptors.response.use(
      (response) => {
        Logger.debug(this.context, `🛬 Response: ${response.status} from ${response.config.url}`);
        return response;
      },
      (error: AxiosError) => {
        this.handleApiError(error);
        return Promise.reject(error);
      },
    );
  }

  set baseURL(baseURL: string | undefined) {
    this._baseURL = baseURL;
    this.api.defaults.baseURL = baseURL;
    Logger.debug(this.context, `🔄 Base URL set to: ${baseURL}`);
  }

  set options(options: IBaseApiServiceOptions) {
    this.baseURL = options.baseURL;
    this.authHeaderToken = options.authHeaderToken ?? null;
    this.onAuthHeaderTokenChangeCallback = options.onAuthHeaderTokenChange ?? null;
  }

  public getOptions(): IBaseApiServiceOptions {
    return {
      baseURL: this._baseURL,
      authHeaderToken: this._authHeaderToken ?? undefined,
      onAuthHeaderTokenChange: this.onAuthHeaderTokenChangeCallback ?? undefined,
    };
  }

  set authHeaderToken(token: string | null) {
    if (token === this._authHeaderToken) {
      return;
    }
    Logger.debug(this.context, `🔑 Setting header auth token`);
    this._authHeaderToken = token;

    if (this._authHeaderToken) {
      this.api.defaults.headers.common.Authorization = `Bearer ${this._authHeaderToken}`;
      Logger.info(this.context, `🔑 Auth header token set to: ${this._authHeaderToken}`);
    } else {
      this.api.defaults.headers.common.Authorization = undefined;
      Logger.info(this.context, '⭕️ Auth header token removed.');
    }

    // Call the callback if it exists
    if (this.onAuthHeaderTokenChangeCallback) {
      this.onAuthHeaderTokenChangeCallback(token);
    }
  }

  /**
   * Handle API errors with detailed logging
   */
  protected handleApiError(error: AxiosError): void {
    const status = error.response?.status;
    const url = error.config?.url;
    const method = error.config?.method?.toUpperCase() || 'UNKNOWN';

    if (error.response) {
      // The server responded with a status code outside the 2xx range
      const data = error.response.data as ApiResponse<unknown>;
      const errorMessage = data?.error || 'Unknown error';

      Logger.error(
        this.context,
        `API Error (${status}) for ${method} ${url}: ${errorMessage}`,
        error,
        {
          status,
          url,
          method,
          data: error.response.data,
        },
      );
    } else if (error.request) {
      // The request was made but no response was received
      Logger.error(this.context, `API No Response for ${method} ${url}: ${error.message}`, error, {
        url,
        method,
      });
    } else {
      // Something happened in setting up the request
      Logger.error(this.context, `API Request Setup Error: ${error.message}`, error);
    }
  }

  /**
   * Validate response data with Zod schema
   * @param schema Zod schema to validate against
   * @param data Data to validate
   * @param requestInfo Information about the request for error reporting
   * @returns Validated data with correct typing
   * @throws Error if validation fails
   */
  protected validateResponse<T>(schema: z.ZodType<T>, data: unknown, requestInfo: string): T {
    const result = schema.safeParse(data);

    if (!result.success) {
      // Log validation errors with details
      Logger.error(this.context, `Validation error for ${requestInfo}:`, result.error, {
        data,
        errors: result.error.format(),
      });

      throw new Error(`Invalid response format for ${requestInfo}: ${result.error.message}`);
    }

    return result.data;
  }

  /**
   * GET with Zod schema validation - returns the proper output type
   */
  protected async get<Schema extends z.ZodType<unknown>>(
    url: string,
    config: AxiosRequestConfig | undefined,
    schema: Schema,
  ): Promise<z.output<Schema>>;

  /**
   * Generic GET request without schema validation
   */
  protected async get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T>;

  /**
   * Implementation of both GET overloads
   */
  protected async get<T = unknown, Schema extends z.ZodType<unknown> = z.ZodType<T>>(
    url: string,
    config?: AxiosRequestConfig,
    schema?: Schema,
  ): Promise<T | z.output<Schema>> {
    try {
      const response = await this.api.get(url, config);
      const data = response.data;

      // Validate response data if schema is provided
      if (schema) {
        return this.validateResponse(schema, data, `GET ${url}`);
      }

      return data as T;
    } catch (error) {
      throw this.transformError(error as AxiosError, `GET ${url}`);
    }
  }

  /**
   * GET with Zod schema validation - returns the proper output type
   */
  protected async post<Schema extends z.ZodType<unknown>, D = unknown>(
    url: string,
    data: D | undefined,
    config: AxiosRequestConfig | undefined,
    schema: Schema,
  ): Promise<z.output<Schema>>;

  /**
   * Generic GET request without schema validation
   */
  protected async post<T = unknown, D = unknown>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig,
  ): Promise<T>;

  /**
   * Generic POST request with type safety and optional Zod validation
   */
  protected async post<T = unknown, D = unknown, Schema extends z.ZodType<unknown> = z.ZodType<T>>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig,
    schema?: Schema,
  ): Promise<T | z.output<Schema>> {
    try {
      const response = await this.api.post(url, data, config);
      const responseData = response.data;

      // Validate response data if schema is provided
      if (schema) {
        return this.validateResponse(schema, responseData, `POST ${url}`);
      }

      return responseData as T;
    } catch (error) {
      throw this.transformError(error as AxiosError, `POST ${url}`);
    }
  }

  /**
   * Generic PUT request with type safety and optional Zod validation
   */
  protected async put<T = unknown, D = unknown>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig,
    schema?: z.ZodType<T>,
  ): Promise<T> {
    try {
      const response = await this.api.put(url, data, config);
      const responseData = response.data;

      // Validate response data if schema is provided
      if (schema) {
        return this.validateResponse(schema, responseData, `PUT ${url}`);
      }

      return responseData as T;
    } catch (error) {
      throw this.transformError(error as AxiosError, `PUT ${url}`);
    }
  }

  /**
   * Generic DELETE request with type safety and optional Zod validation
   */
  protected async delete<T = unknown>(
    url: string,
    config?: AxiosRequestConfig,
    schema?: z.ZodType<T>,
  ): Promise<T> {
    try {
      const response = await this.api.delete(url, config);
      const data = response.data;

      // Validate response data if schema is provided
      if (schema) {
        return this.validateResponse(schema, data, `DELETE ${url}`);
      }

      return data as T;
    } catch (error) {
      throw this.transformError(error as AxiosError, `DELETE ${url}`);
    }
  }

  /**
   * Transform axios error to a user-friendly error
   */
  private transformError(error: AxiosError, requestInfo: string): Error {
    if (error.response) {
      // The server responded with an error
      const data = error.response.data as ApiResponse<unknown>;
      const errorMessage =
        data?.error || `${requestInfo} failed with status ${error.response.status}`;
      return new Error(errorMessage);
    } else if (error.request) {
      // No response received
      return new Error(`${requestInfo}: No response received from server`);
    } else {
      // Request setup error
      return new Error(`${requestInfo}: ${error.message}`);
    }
  }
}
