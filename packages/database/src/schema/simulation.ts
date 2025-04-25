import z from 'zod';

export const DirectionEnum = ['front', 'right', 'left', 'back'] as const;
export type Direction = (typeof DirectionEnum)[number];

export const PositionSchema = z.object({
  x: z.number(),
  y: z.number(),
});
export type Position = z.infer<typeof PositionSchema>;
