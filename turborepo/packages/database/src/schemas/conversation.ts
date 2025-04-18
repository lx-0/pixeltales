import z from 'zod';

export const MessageV2Schema = z.object({
  id: z.string().describe('Unique identifier for the message'),
  timestamp: z.date().default(new Date()),
  sceneId: z.number(),
  characterId: z.string(),
  recipient: z.string().describe('The recipient of the message - from the eyes of the character'),
  modelUsed: z.string().optional().nullable(),
  content: z.string().optional().nullable(),
  thoughts: z.string(),
  mood: z.string(),
  moodEmoji: z.string(),
  reactionOnPrevious: z.string().optional().nullable(),
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
  timestamp: z.string(),
  unix_timestamp: z.number(),
  // scene_id: z.number(),
  // character_id: z.string(),
  character: z.string(),
  recipient: z.string().describe('The recipient of the message - from the eyes of the character'),
  content: z.string().optional().nullable(),
  thoughts: z.string(),
  mood: z.string(),
  mood_emoji: z.string(),
  reaction_on_previous_message: z.string().optional().nullable(),
  calculated_speaking_time: z.number(),
  conversation_rating: z.number().optional().nullable(),
  end_conversation: z.boolean(),
});
export type Message = z.infer<typeof MessageSchema>;
export type NewMessage = Omit<Message, 'timestamp' | 'unix_timestamp'>;

export const ConversationSchema = z.object({
  messages: z.array(MessageSchema),
});
export type Conversation = z.infer<typeof ConversationSchema>;
