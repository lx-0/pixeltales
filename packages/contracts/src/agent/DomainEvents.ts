import { z } from 'zod';
import { AgentInternalEventSchema } from './AgentInternalEvents';
import { AgentPerceptionEventSchema } from './AgentPerceptionEvent';
import { SensoryEventSchema } from './SensoryEvents';
import { RawSimulationEventSchema, SimulationAgentActionEventSchema } from './SimulationEvents';

// Define a base type for ALL domain events by unioning specific event types/unions
// Define the Zod schema corresponding to the DomainEvent type union
export const DomainEventSchema = z.union([
  SimulationAgentActionEventSchema, // Actions agents *take* that affect the simulation
  AgentPerceptionEventSchema, // Events agents *perceive* after processing
  AgentInternalEventSchema, // Events internal to an agent's cognitive process
  SensoryEventSchema, // Raw sensory input (potentially)
  RawSimulationEventSchema, // Raw simulation state changes/events published FOR perception systems
  // Add other top-level event unions here as needed
]);
export type DomainEvent = z.infer<typeof DomainEventSchema>;
