import { z } from 'zod';

export const ApiResponseSchema = <T = unknown, Schema extends z.ZodType<unknown> = z.ZodType<T>>(
  dataSchema: Schema,
) =>
  z.object({
    statusCode: z.number().describe('HTTP status code'),
    success: z.boolean().describe('Whether the request was successful'),
    session: z.string().optional().describe('Session token'),
    message: z.string().optional().describe('Message'),
    error: z.string().optional().describe('Error'),
    details: z.unknown().optional().describe('Error details'),
    warning: z.string().optional().describe('Warning'),
    data: (dataSchema ?? z.void()).optional().describe('Data'),
  });
export type ApiResponse<T = void> = z.infer<ReturnType<typeof ApiResponseSchema<T>>>;

export const SuccessApiResponse = <T>(data?: T, message?: string): ApiResponse<T> =>
  ({
    statusCode: 200,
    success: true,
    message: message ?? 'Request successful',
    data,
  }) as ApiResponse<T>;

export const BadRequestApiResponse = (message?: string): ApiResponse<undefined> => ({
  statusCode: 400,
  success: false,
  message: message ?? 'Bad request',
});

export const UnauthorizedApiResponse = (message?: string): ApiResponse<undefined> => ({
  statusCode: 401,
  success: false,
  message: message ?? 'Unauthorized',
});

export const ForbiddenApiResponse = (message?: string): ApiResponse<undefined> => ({
  statusCode: 403,
  success: false,
  message: message ?? 'Forbidden',
});

export const InternalServerErrorApiResponse = (
  error?: Error | unknown,
  message?: string,
): ApiResponse<undefined> => ({
  statusCode: 500,
  success: false,
  message: message ?? 'Internal server error',
  error: error instanceof Error ? error.message : 'Internal server error',
  details: { error },
});

export const VoidApiResponseSchema = ApiResponseSchema(z.void());
export type VoidApiResponse = z.infer<typeof VoidApiResponseSchema>;
/**
 * Paginated response wrapper
 */
export const PaginatedResponseSchema = <T>(dataSchema: z.ZodType<T>) =>
  ApiResponseSchema(
    z.object({
      total: z.number().describe('Total number of items'),
      page: z.number().describe('Current page number'),
      pageSize: z.number().describe('Number of items per page'),
      totalPages: z.number().describe('Total number of pages'),
      data: z.array(dataSchema).describe('Array of items'),
    }),
  );
export type PaginatedResponse<T> = z.infer<ReturnType<typeof PaginatedResponseSchema<T>>>;
