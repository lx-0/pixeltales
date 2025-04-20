import z from 'zod';

// Character response schema for LLM
export const CharacterResponseSchema = z.object({
  recipient: z.string().describe('The recipient of the message'),
  reactionOnPreviousMessage: z
    .string()
    .nullable()
    .describe('A single unicode emoji that best represents your reaction on the previous message'),
  conversationRating: z
    .number()
    .int()
    .min(1)
    .max(10)
    .nullable()
    .describe(
      'How would you rate the conversation until now, from 1 to 10? You can use this to emphasize your feelings about the conversation.',
    ),
  mood: z.string().describe('A descriptive word or short phrase for your current emotional state'),
  moodEmoji: z.string().describe('A single unicode emoji that best represents your mood'),
  thoughts: z.string().describe('Your thoughts about the conversation'),
  content: z.string().nullable().describe('Your spoken response'),
  endConversation: z.boolean().describe('Whether your response ends the conversation'),
});
export type CharacterResponse = z.infer<typeof CharacterResponseSchema>;
