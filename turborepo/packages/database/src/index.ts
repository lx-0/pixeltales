import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import * as schema from './schema';

// === Schema Export ===
// Export the schema object itself for the backend provider
export * from './schema';

// === TypeScript Type Exports ===
// Export inferred TS types for usage in contracts/other packages
export type Conversation = typeof schema.conversationsTable.$inferSelect;
export type NewConversation = typeof schema.conversationsTable.$inferInsert;
export type Message = typeof schema.messagesTable.$inferSelect;
export type NewMessage = typeof schema.messagesTable.$inferInsert;

// === Zod Schema Exports ===
// Generate and export Zod schemas derived from Drizzle schemas

// -- Conversation Schemas --
export const selectConversationSchema: z.ZodObject<any> = createSelectSchema(
  schema.conversationsTable,
  {
    createdAt: z.date(),
  },
);
export const insertConversationSchema: z.ZodObject<any> = createInsertSchema(
  schema.conversationsTable,
  {
    // createdAt is refined to date, optionality inferred from Drizzle default
    createdAt: z.date(),
  },
);

// -- Message Schemas --
export const selectMessageSchema: z.ZodObject<any> = createSelectSchema(schema.messagesTable, {
  timestamp: z.date(),
});
export const insertMessageSchema: z.ZodObject<any> = createInsertSchema(schema.messagesTable, {
  conversationId: z.string().uuid(), // FK is required
  // timestamp is refined to date, optionality inferred from Drizzle default
  timestamp: z.date(),
});

// Add exports for other table schemas here...
