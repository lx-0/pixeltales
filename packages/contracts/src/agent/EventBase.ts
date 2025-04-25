import { uuid } from '@pixeltales/database';
import { z } from 'zod';

/**
 * Base Zod schema for common event fields.
 */
export const BaseEventSchema = z.object({
  id: z
    .string()
    .uuid()
    .default(() => uuid())
    .describe('Unique event ID'),
  timestamp: z
    .number()
    .int()
    .positive()
    .default(() => Date.now())
    .describe('Timestamp when the event occurred (ms epoch).'),
  source: z.string().describe('Originating subsystem/module name.'),
  topic: z.string().optional().describe('Optional routing topic for the event bus.'),
  correlationId: z
    .string()
    .uuid()
    .optional()
    .describe('Optional ID for request-response tracking.'),
});

/**
 * Base TypeScript type for common event fields.
 * Specific event types should extend this.
 */
export type EventBase = z.infer<typeof BaseEventSchema>;

// Note: The 'type' and 'payload' fields are added in specific event definitions
// to allow for discriminated unions.
