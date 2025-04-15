import z from 'zod';

export const MessageSchema = z.object({
  timestamp: z.number(),
  character: z.string(),
  recipient: z.string().describe('The recipient of the message - from the eyes of the character'),
  content: z.string().optional().nullable(),
  thoughts: z.string(),
  mood: z.string(),
  mood_emoji: z.string(),
  reaction_on_previous_message: z.string().optional().nullable(),
  unix_timestamp: z.number(),
  calculated_speaking_time: z.number().nullable(),
  conversation_rating: z.number().optional().nullable(),
  end_conversation: z.boolean().nullable(),
});
export type Message = z.infer<typeof MessageSchema>;

export const ConversationSchema = z.object({
  messages: z.array(MessageSchema),
});
export type Conversation = z.infer<typeof ConversationSchema>;
