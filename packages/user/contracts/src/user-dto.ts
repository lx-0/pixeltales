import { z } from 'zod';
import { UserRoleEnum } from './user';

// DTO for creating a new user
export const CreateUserDTOSchema = z.object({
  id: z.string(), // Supabase auth ID
  email: z.string().email(),
  name: z.string().optional(),
});
export type CreateUserDTO = z.infer<typeof CreateUserDTOSchema>;

// DTO for updating a user
export const UpdateUserDTOSchema = z.object({
  name: z.string().optional(),
  role: z.enum(UserRoleEnum).optional(),
});
export type UpdateUserDTO = z.infer<typeof UpdateUserDTOSchema>;

export const CommentPayloadSchema = z.object({
  user: z.string().min(2).max(50),
  comment: z.string().min(1).max(1000),
});
export type CommentPayload = z.infer<typeof CommentPayloadSchema>;
