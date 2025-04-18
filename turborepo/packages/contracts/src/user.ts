import { UserRoleEnum } from '@pixeltales/database';
import { z } from 'zod';

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
