import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import z from 'zod';
import { sqlNow } from '../sql';

// Define role types
export const UserRoleEnum = ['admin', 'user'] as const;
export const UserRoleSchema = z.enum(UserRoleEnum);
export type UserRole = z.infer<typeof UserRoleSchema>;

// User schema
export const UserSchema = z.object({
  id: z.string().describe('Supabase auth ID'),
  role: UserRoleSchema.default('user').describe('Role of the user'),
  email: z.string().email().describe('Email address of the user (from Supabase)'),
  name: z.string().nullable().default(null).describe('Name of the user'),
  createdAt: z.coerce.date().describe('Datetime when the user was created'),
  updatedAt: z.coerce.date().describe('Datetime when the user was last updated'),
});
export type User = z.output<typeof UserSchema>; // z.output = z.infer
export type NewUser = Omit<z.input<typeof UserSchema>, 'createdAt' | 'updatedAt'>; // z.input -> defaults are optional
export type UpdateUser = Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>;

// Comments (kept from previous schema)
export const CommentSchema = z.object({
  user: z.string(),
  comment: z.string(),
  timestamp: z.string().datetime(),
});
export type Comment = z.infer<typeof CommentSchema>;

// Users table for authentication and role management
export const usersTable = sqliteTable(
  'users',
  {
    id: text('id').primaryKey(), // Supabase auth ID
    email: text('email').notNull().unique(),
    name: text('name'),
    role: text('role', { enum: UserRoleEnum }).default('user').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).default(sqlNow).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).default(sqlNow).notNull(),
  },
  (table) => [index('user_email_idx').on(table.email)],
);
export type DbUser = typeof usersTable.$inferSelect;
export type NewDbUser = typeof usersTable.$inferInsert;
