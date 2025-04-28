import z from 'zod';

// Comments (kept from previous schema)
export const CommentSchema = z.object({
  user: z.string(),
  comment: z.string(),
  timestamp: z.string().datetime(),
});
export type Comment = z.infer<typeof CommentSchema>;
