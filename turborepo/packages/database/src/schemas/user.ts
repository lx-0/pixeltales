import z from 'zod';

export const CommentSchema = z.object({
  user: z.string(),
  comment: z.string(),
  timestamp: z.string().datetime(),
});
export type Comment = z.infer<typeof CommentSchema>;
