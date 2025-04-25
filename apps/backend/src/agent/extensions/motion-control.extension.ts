import { Inject, Injectable, Logger } from '@nestjs/common';
import { AgentAction } from '@pixeltales/contracts';
import { EVENT_BUS, IEventBus } from '../../core/event-bus.interface'; // Import EventBus
import { EventBusService } from '../../core/event-bus.service'; // Import EventBusService
import { CapabilityExecutionResult, ICapabilityExtension } from './capability.extension.interface';

// Define payload type based on AgentAction contract
// Assuming AgentAction has a type like: { type: 'move', payload: { targetX: number, targetY: number } | { targetObjectId: string } }
type MovePayload = Extract<AgentAction, { type: 'move' }>['payload'];

/**
 * Handles 'move' actions.
 * In a real implementation, this would interface with the scene/physics engine.
 */
@Injectable()
export class MotionControlExtension implements ICapabilityExtension {
  private readonly logger = new Logger(MotionControlExtension.name);
  readonly capabilityName = 'move';

  // Inject EventBus
  constructor(@Inject(EVENT_BUS) private readonly eventBus: IEventBus) {}

  async execute(agentId: string, payload: MovePayload): Promise<CapabilityExecutionResult> {
    try {
      this.logger.log(
        `[${agentId}] Executing ${this.capabilityName} towards target: ${JSON.stringify(payload.target)}`,
      );

      // Use EventBusService.createEvent
      const simulationEvent = EventBusService.createEvent(
        'MotionControlExtension', // source
        'simulation.agent.move', // type
        {
          // payload object
          agentId: agentId,
          target: payload.target,
          pathfinding: payload.pathfinding,
        },
        // No topic needed
      );

      this.eventBus.publish(simulationEvent);

      // TODO: Implement actual movement logic
      // - Calculate path?
      // - Send command to scene/physics engine?
      // - Update agent state in simulation?

      // Simulate success
      await new Promise((resolve) => setTimeout(resolve, 15)); // Simulate async work
      return { success: true, message: 'Move event emitted.' };
    } catch (error) {
      this.logger.error(`[${agentId}] Error executing move action`, error);
      return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}
