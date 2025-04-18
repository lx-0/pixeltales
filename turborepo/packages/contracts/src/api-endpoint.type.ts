// FROM computer-use-nodejs project
// Common API types for both Docker and LLM services

import z from 'zod';

export interface ApiErrorResponse {
  error: string;
  details?: Record<string, unknown>;
  timestamp?: string;
  code?: string;
}

export const ApiRequestMetadataSchema = z.object({
  requestId: z.string().optional().describe('Request ID'),
  timestamp: z.string().optional().describe('Timestamp'),
});
export type ApiRequestMetadata = z.infer<typeof ApiRequestMetadataSchema>;

export const ApiResponseMetadataSchema = z.object({
  requestId: z.string().optional().describe('Request ID'),
  timestamp: z.string().optional().describe('Timestamp'),
  duration: z.number().optional().describe('Response duration in milliseconds'),
});
export type ApiResponseMetadata = z.infer<typeof ApiResponseMetadataSchema>;

// Base types for all API responses
export interface ApiResponse<T> {
  data?: T;
  ok: boolean;
  error?: string;
  message?: string;
  metadata?: ApiResponseMetadata;
}

// Extract the inner type from ApiResponse
export type ExtractResponseType<T> = T extends ApiResponse<infer U> ? U : never;

export interface ApiStreamResponse<T> {
  data: T;
  metadata?: ApiResponseMetadata;
  isComplete: boolean;
}

// HTTP method types
export type ApiMethod = 'GET' | 'PATCH' | 'POST' | 'PUT' | 'DELETE';

// Generic endpoint type
export type ApiEndpoint<
  TRequest = unknown,
  TResponse = unknown,
  TError extends ApiErrorResponse = ApiErrorResponse,
> = {
  request: TRequest & { metadata?: ApiRequestMetadata };
  response: ApiResponse<TResponse>;
  error: TError;
};

export type ApiEndpoints = Record<string, Record<ApiMethod, ApiEndpoint>>;
