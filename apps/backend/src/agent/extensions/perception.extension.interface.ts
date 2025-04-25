// Define placeholder types for data - replace later with actual simulation data structures
// type VisualData = any;
// type AudioData = any;
// type SensoryData = VisualData | AudioData; // Union type for flexibility

/**
 * Interface for Perception Extensions, which process raw sensory data
 * from the environment simulation and generate AgentPerceptionEvents.
 */
export interface IPerceptionExtension {
  /**
   * The type of sensory input this extension processes (e.g., 'visual', 'auditory').
   */
  readonly perceptionType: string;

  /**
   * Processes raw sensory input from the environment simulation layer.
   * Processes a stream or chunk of raw sensory data.
   * Implementations should parse this data and publish relevant
   * AgentPerceptionEvent(s) via the EventBus for the target agent.
   *
   * @param agentId The ID of the agent perceiving the data.
   * @param data The raw sensory data from the simulation. // TODO: Define specific types later
   */
  processSensoryStream(agentId: string, data: unknown): Promise<void>;
}

// Define injection token if needed later for multi-injection of perception extensions
export const PERCEPTION_EXTENSION = Symbol('IPerceptionExtension');
