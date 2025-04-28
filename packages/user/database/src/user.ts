import { UserRoleEnum } from '@yesterday-ai/user-contracts';
import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

const sqlNow = sql`(cast(strftime('%s', 'now') as integer) * 1000)`;

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
