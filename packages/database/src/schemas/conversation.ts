import z from 'zod';
import { uuid } from '../db-schema';

export const MessageV2Schema = z.object({
  id: z
    .string()
    .default(() => uuid())
    .describe('Unique identifier for the message'),
  timestamp: z.coerce.date().default(new Date()),
  sceneId: z.string(),
  characterId: z.string(),
  recipient: z.string().describe('The recipient of the message - from the eyes of the character'),
  modelUsed: z.string().optional().nullable(),
  content: z.string().optional().nullable(),
  thoughts: z.string(),
  mood: z.string(),
  moodEmoji: z.string(),
  reactionOnPreviousMessage: z.string().optional().nullable(),
  calculatedSpeakingTime: z.number(),
  conversationRating: z.number().optional().nullable(),
  endConversation: z.boolean().default(false),
  tokenCount: z.number().optional().nullable(),
  cost: z.number().optional().nullable(),
});
export type MessageV2 = z.infer<typeof MessageV2Schema>;
export type NewMessageV2 = Omit<MessageV2, 'id' | 'timestamp'>;

// Inline message in scene state snapshot
export const MessageSchema = z.object({
  timestamp: z.coerce.date().default(new Date()),
  characterId: z.string().describe('The character that sent the message'),
  recipient: z.string().describe('The recipient of the message - from the eyes of the character'),
  content: z.string().optional().nullable(),
  thoughts: z.string(),
  mood: z.string(),
  moodEmoji: z.string(),
  reactionOnPreviousMessage: z.string().optional().nullable(),
  calculatedSpeakingTime: z.number(),
  conversationRating: z.number().optional().nullable(),
  endConversation: z.boolean(),
});
export type Message = z.infer<typeof MessageSchema>;
export type NewMessage = Omit<Message, 'timestamp' | 'unix_timestamp'>;

export const ConversationSchema = z.object({
  messages: z.array(MessageSchema),
});
export type Conversation = z.infer<typeof ConversationSchema>;
