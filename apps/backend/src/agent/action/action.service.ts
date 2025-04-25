import { Inject, Injectable, Logger } from '@nestjs/common';
import { AgentAction } from '@pixeltales/contracts';
import {
  CAPABILITY_EXTENSION,
  ICapabilityExtension,
} from '../extensions/capability.extension.interface';
import { IActionService } from './action.interface';

@Injectable()
export class ActionService implements IActionService {
  private readonly logger = new Logger(ActionService.name);
  private readonly capabilitiesMap = new Map<string, ICapabilityExtension>();

  constructor(
    // Inject all providers tagged with CAPABILITY_EXTENSION
    @Inject(CAPABILITY_EXTENSION) capabilityExtensions: ICapabilityExtension[],
  ) {
    // Create a map for easy lookup by capabilityName (action type)
    capabilityExtensions.forEach((ext) => {
      if (ext.capabilityName) {
        if (this.capabilitiesMap.has(ext.capabilityName)) {
          this.logger.warn(`Duplicate capability extension found for type: ${ext.capabilityName}`);
        }
        this.capabilitiesMap.set(ext.capabilityName, ext);
        this.logger.log(`Registered capability: ${ext.capabilityName}`);
      } else {
        this.logger.error(
          `Capability extension ${ext.constructor.name} is missing capabilityName property.`,
        );
      }
    });
    this.logger.log(`ActionService initialized with ${this.capabilitiesMap.size} capabilities.`);
  }

  async dispatchAction(agentId: string, action: AgentAction): Promise<void> {
    this.logger.debug(`[${agentId}] Dispatching action: ${action.type}`);

    const capability = this.capabilitiesMap.get(action.type);

    if (!capability) {
      this.logger.error(
        `[${agentId}] No capability extension found to handle action type: ${action.type}`,
      );
      // TODO: Optionally publish an error event
      return; // Or throw error?
    }

    try {
      const result = await capability.execute(agentId, action.payload);
      this.logger.verbose(
        `[${agentId}] Executed action ${action.type} with capability ${capability.constructor.name}. Success: ${result.success}`,
      );
      if (!result.success) {
        this.logger.warn(
          `[${agentId}] Capability execution failed for action ${action.type}: ${result.message}`,
        );
        // TODO: Optionally publish failure event, trigger replanning?
      }
      // TODO: Publish action execution result event?
    } catch (error) {
      this.logger.error(
        `[${agentId}] Error executing action ${action.type} with capability ${capability.constructor.name}`,
        error instanceof Error ? error.stack : error,
      );
      // TODO: Optionally publish failure event, trigger replanning?
      // Potentially re-throw
    }
  }
}
