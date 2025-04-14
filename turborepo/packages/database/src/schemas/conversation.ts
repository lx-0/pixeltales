import z from 'zod';

export const MessageSchema = z.object({
  character: z.string(),
  content: z.string().optional().nullable(),
  recipient: z.string(),
  thoughts: z.string(),
  mood: z.string(),
  moodEmoji: z.string(),
  reactionOnPrevious: z.string().optional().nullable(),
  timestamp: z.number(),
  unixTimestamp: z.number(),
  calculatedSpeakingTime: z.number().nullable(),
  conversationRating: z.number().optional().nullable(),
  endConversation: z.boolean().nullable(),
});
export type Message = z.infer<typeof MessageSchema>;

export const ConversationSchema = z.object({
  messages: z.array(MessageSchema),
});
export type Conversation = z.infer<typeof ConversationSchema>;
