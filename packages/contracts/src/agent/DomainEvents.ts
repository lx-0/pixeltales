import { AgentInternalEvent } from './AgentInternalEvents';
import { AgentPerceptionEvent } from './AgentPerceptionEvent';
import { SensoryEvent } from './SensoryEvents';
import { SimulationAgentActionEvent } from './SimulationEvents';

// Define a base type for ALL domain events by unioning specific event types/unions
export type DomainEvent =
  | SimulationAgentActionEvent
  | AgentPerceptionEvent
  | AgentInternalEvent
  | SensoryEvent;
// Add other top-level event unions here as needed
