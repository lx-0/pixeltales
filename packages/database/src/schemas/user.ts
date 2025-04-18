import z from 'zod';

// Define role types
export const UserRoleEnum = ['admin', 'user'] as const;
export const UserRoleSchema = z.enum(UserRoleEnum);
export type UserRole = z.infer<typeof UserRoleSchema>;

// User schema
export const UserSchema = z.object({
  id: z.string().describe('Supabase auth ID'),
  role: UserRoleSchema.describe('Role of the user'),
  email: z.string().email().describe('Email address of the user (from Supabase)'),
  name: z.string().nullable().optional().describe('Name of the user'),
  createdAt: z.date().describe('Timestamp when the user was created'),
  updatedAt: z.date().describe('Timestamp when the user was last updated'),
});
export type User = z.infer<typeof UserSchema>;
export type NewUser = Omit<User, 'createdAt' | 'updatedAt'>;
export type UpdateUser = Partial<Omit<User, 'id'>>;

// Comments (kept from previous schema)
export const CommentSchema = z.object({
  user: z.string(),
  comment: z.string(),
  timestamp: z.string().datetime(),
});
export type Comment = z.infer<typeof CommentSchema>;
