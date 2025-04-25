import { z } from 'zod';

/**
 * Defines the structure for a gamified learning event notification.
 */
export const LearningNotificationSchema = z
  .object({
    id: z.string().uuid().describe('Unique identifier for the notification.'),
    agentId: z.string().uuid().describe('ID of the agent who experienced the learning event.'),
    timestamp: z.number().int().positive().describe('Timestamp when the learning event occurred.'),
    type: z
      .enum([
        'world_discovery',
        'social_insight',
        'self_discovery',
        'skill_acquisition',
        'conceptual_framework',
      ])
      .describe('Category of the learning event.'),
    description: z
      .string()
      .describe(
        'Human-readable description of the learning event (e.g., "Discovered sunlight affects mood").',
      ),
    xpValue: z
      .number()
      .int()
      .positive()
      .optional()
      .describe('Experience points awarded for this learning event.'),
    skillCategory: z
      .string()
      .optional()
      .describe(
        'Associated skill category for XP allocation (e.g., Environmental Awareness, Social Understanding).',
      ),
    // Optional: Add related evidence or context (e.g., source observation ID)
    relatedEvidenceIds: z.array(z.string()).optional(),
  })
  .describe(
    'Structure for a gamified notification representing a significant agent learning event.',
  );

export type LearningNotification = z.infer<typeof LearningNotificationSchema>;
