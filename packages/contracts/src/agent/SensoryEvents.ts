import { z } from 'zod';
import { BaseEventSchema } from './EventBase'; // Import Base

// --- Payload Schemas ---

// Raw Auditory Input
export const RawAuditoryPayloadSchema = z.object({
  agentId: z.string().uuid(),
  source: z.string().describe('Origin of the sound'),
  intensity: z.number().min(0).max(1).describe('Loudness, 0 to 1'),
  pitch: z.number().describe('Sound frequency in Hz, approximate'),
  description: z.string().optional().describe('Optional description (e.g., word spoken)'),
});
export type RawAuditoryPayload = z.infer<typeof RawAuditoryPayloadSchema>;

// Raw Visual Input
export const RawVisualPayloadSchema = z.object({
  agentId: z.string().uuid(),
  pixels: z.array(z.number()).describe('Flattened array of pixel data (e.g., RGB values)'),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  format: z.enum(['RGB', 'Grayscale']).describe('Pixel format'),
  // TODO: Add camera position/orientation if relevant
});
export type RawVisualPayload = z.infer<typeof RawVisualPayloadSchema>;

// Raw Haptic Input
export const RawHapticPayloadSchema = z.object({
  agentId: z.string().uuid(),
  location: z.string().describe('Body part or sensor location'),
  pressure: z.number().min(0).optional().describe('Pressure intensity, if applicable'),
  vibration: z.number().min(0).optional().describe('Vibration intensity, if applicable'),
  temperature: z.number().optional().describe('Temperature in Celsius, if applicable'),
});
export type RawHapticPayload = z.infer<typeof RawHapticPayloadSchema>;

// Raw Olfactory Input (Smell)
export const RawOlfactoryPayloadSchema = z.object({
  agentId: z.string().uuid(),
  chemical: z.string().describe('Detected chemical compound or scent name'),
  concentration: z.number().min(0).describe('Concentration level (unit depends on sensor)'),
});
export type RawOlfactoryPayload = z.infer<typeof RawOlfactoryPayloadSchema>;

// Raw Gustatory Input (Taste)
export const RawGustatoryPayloadSchema = z.object({
  agentId: z.string().uuid(),
  taste: z.enum(['sweet', 'sour', 'salty', 'bitter', 'umami']).describe('Primary taste sensation'),
  intensity: z.number().min(0).max(1).describe('Intensity of the taste'),
});
export type RawGustatoryPayload = z.infer<typeof RawGustatoryPayloadSchema>;

// --- Specific Event Schemas (Extending Base) ---

export const RawAuditoryEventSchema = BaseEventSchema.extend({
  type: z.literal('sensory.auditory.raw'),
  payload: RawAuditoryPayloadSchema,
});
export type RawAuditoryEvent = z.infer<typeof RawAuditoryEventSchema>;

export const RawVisualEventSchema = BaseEventSchema.extend({
  type: z.literal('sensory.visual.raw'),
  payload: RawVisualPayloadSchema,
});
export type RawVisualEvent = z.infer<typeof RawVisualEventSchema>;

export const RawHapticEventSchema = BaseEventSchema.extend({
  type: z.literal('sensory.haptic.raw'),
  payload: RawHapticPayloadSchema,
});
export type RawHapticEvent = z.infer<typeof RawHapticEventSchema>;

export const RawOlfactoryEventSchema = BaseEventSchema.extend({
  type: z.literal('sensory.olfactory.raw'),
  payload: RawOlfactoryPayloadSchema,
});
export type RawOlfactoryEvent = z.infer<typeof RawOlfactoryEventSchema>;

export const RawGustatoryEventSchema = BaseEventSchema.extend({
  type: z.literal('sensory.gustatory.raw'),
  payload: RawGustatoryPayloadSchema,
});
export type RawGustatoryEvent = z.infer<typeof RawGustatoryEventSchema>;

// --- Discriminated Union Schema for Sensory Events ---

export const SensoryEventSchema = z.discriminatedUnion('type', [
  RawAuditoryEventSchema,
  RawVisualEventSchema,
  RawHapticEventSchema,
  RawOlfactoryEventSchema,
  RawGustatoryEventSchema,
]);

// Final Union Type for Sensory Events
export type SensoryEvent = z.infer<typeof SensoryEventSchema>;
