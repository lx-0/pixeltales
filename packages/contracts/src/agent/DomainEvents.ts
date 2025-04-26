import { AgentInternalEvent } from './AgentInternalEvents';
import { AgentPerceptionEvent } from './AgentPerceptionEvent';
import { SensoryEvent } from './SensoryEvents';
import { RawSimulationEvent, SimulationAgentActionEvent } from './SimulationEvents';

// Define a base type for ALL domain events by unioning specific event types/unions
export type DomainEvent =
  | SimulationAgentActionEvent // Actions agents *take* that affect the simulation
  | AgentPerceptionEvent // Events agents *perceive* after processing
  | AgentInternalEvent // Events internal to an agent's cognitive process
  | SensoryEvent // Raw sensory input (potentially)
  | RawSimulationEvent; // Raw simulation state changes/events published FOR perception systems
// Add other top-level event unions here as needed
