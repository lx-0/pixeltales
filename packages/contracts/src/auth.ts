import { type User, UserSchema } from '@pixeltales/database';
import type { Session as SupabaseSession, User as SupabaseUser } from '@supabase/supabase-js';
import { z } from 'zod';
import { ApiResponseSchema } from './api-types.type';

export const SupabaseUserSchema = z.object({
  id: z.string(),
  app_metadata: z.record(z.string(), z.any()),
  user_metadata: z.record(z.string(), z.any()),
  aud: z.string(),
  confirmation_sent_at: z.string().optional(),
  recovery_sent_at: z.string().optional(),
  email_change_sent_at: z.string().optional(),
  new_email: z.string().optional(),
  new_phone: z.string().optional(),
  invited_at: z.string().optional(),
  action_link: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  created_at: z.string(),
  confirmed_at: z.string().optional(),
  email_confirmed_at: z.string().optional(),
  phone_confirmed_at: z.string().optional(),
  last_sign_in_at: z.string().optional(),
  role: z.string().optional(),
  updated_at: z.string().optional(),
  identities: z
    .array(
      z.object({
        id: z.string(),
        user_id: z.string(),
        identity_data: z.record(z.string(), z.any()).optional(),
        identity_id: z.string(),
        provider: z.string(),
        created_at: z.string().optional(),
        last_sign_in_at: z.string().optional(),
        updated_at: z.string().optional(),
      }),
    )
    .optional(),
  is_anonymous: z.boolean().optional(),
  is_sso_user: z.boolean().optional(),
  factors: z
    .array(
      z.object({
        id: z.string(),
        friendly_name: z.string().optional(),
        factor_type: z.string(),
        status: z.enum(['verified', 'unverified']),
        created_at: z.string(),
        updated_at: z.string(),
      }),
    )
    .optional(),
}) satisfies z.ZodType<SupabaseUser>;
export type { SupabaseUser };

export const SupabaseSessionSchema = z.object({
  provider_token: z
    .string()
    .nullable()
    .optional()
    .describe(
      'The oauth provider token. If present, this can be used to make external API requests to the oauth provider used.',
    ),
  provider_refresh_token: z
    .string()
    .nullable()
    .optional()
    .describe(
      "The oauth provider refresh token. If present, this can be used to refresh the provider_token via the oauth provider's API. Not all oauth providers return a provider refresh token. If the provider_refresh_token is missing, please refer to the oauth provider's documentation for information on how to obtain the provider refresh token.",
    ),
  access_token: z
    .string()
    .describe(
      'The access token jwt. It is recommended to set the JWT_EXPIRY to a shorter expiry value.',
    ),
  refresh_token: z.string().describe('A one-time used refresh token that never expires.'),
  expires_in: z
    .number()
    .describe(
      'The number of seconds until the token expires (since it was issued). Returned when a login is confirmed.',
    ),
  expires_at: z
    .number()
    .optional()
    .describe('A timestamp of when the token will expire. Returned when a login is confirmed.'),
  token_type: z.string().describe('The type of token, typically `Bearer`.'),
  user: SupabaseUserSchema.describe('The user object.'),
}) satisfies z.ZodType<SupabaseSession>;
export type { SupabaseSession };

export const JwtUserSchema = z.object({
  profile: UserSchema,
  user: SupabaseUserSchema,
});
export type JwtUser = {
  profile: User;
  user: SupabaseUser;
};

export const SupabaseUserSessionSchema = z.object({
  session: SupabaseSessionSchema,
  user: JwtUserSchema,
});
export type SupabaseUserSession = z.infer<typeof SupabaseUserSessionSchema>;

export const SupabaseUserSessionResponseSchema = ApiResponseSchema(
  z.object({
    session: SupabaseSessionSchema.nullable(),
    user: JwtUserSchema.nullable(),
  }),
);
export type SupabaseUserSessionResponse = z.infer<typeof SupabaseUserSessionResponseSchema>;

// Define schemas for API requests and responses

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional(),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const LoginResponseSchema = z.object({
  user: JwtUserSchema,
  token: z.string(),
  session: SupabaseSessionSchema.optional(),
  // refactor below (use proper ApiResponse type)
  requiresEmailConfirmation: z.boolean().optional(),
  message: z.string().optional(),
});

export const RegistrationEnabledSchema = z.object({
  enabled: z.boolean(),
});
