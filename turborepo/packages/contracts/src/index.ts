// This package will contain shared types, interfaces, schemas, etc.

// --- Database Types (Re-exported) ---
// We only export TYPES from the database package to avoid runtime dependency
export type { Conversation, Message, NewConversation, NewMessage } from '@pixeltales/database';

// --- Zod Schemas (Re-exported from database package) ---
// Re-export the Zod schemas generated in the database package
export {
  insertConversationSchema,
  insertMessageSchema,
  selectConversationSchema,
  selectMessageSchema,
} from '@pixeltales/database';

// --- Zod Infered Types (Optional Convenience) ---
// Optionally re-export inferred types from Zod schemas if needed directly
// import { z } from 'zod';
// export type MessageInput = z.infer<typeof selectMessageSchema>;

// --- Other Shared Constants/Types ---

export const EXAMPLE_CONSTANT = 'Hello from Shared Contracts!';

// Add your shared types and constants here
