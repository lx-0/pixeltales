import { Inject, Injectable, InternalServerErrorException, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { DBScene, SceneStateSchema } from '@pixeltales/contracts'; // Import necessary types/schemas
import { DBSceneConfig, dbSchema, NewDBScene } from '@pixeltales/database';
import { PinoLogger } from 'nestjs-pino';
import { CharactersService } from '../../characters/characters.service';
import { DRIZZLE_INSTANCE, DrizzleSqliteDatabase } from '../../db/drizzle.provider';
import { EventsGateway } from '../../events/events.gateway'; // To emit updates
import { ScenesService } from '../../scenes/scenes.service'; // Assuming DB access logic is here
import { ConversationOrchestratorService } from '../conversation-orchestrator/conversation-orchestrator.service';
import { SceneStateService } from '../scene-state/scene-state.service';

const CONVERSATION_LOOP_INTERVAL = 'CONVERSATION_LOOP_INTERVAL';
const LOOP_INTERVAL_MS = 500; // Check loop every 500ms
const BUSY_LOOP_INTERVAL_MS = 2000; // Longer interval when characters are busy (2 seconds)
const NEW_CONVERSATION_COOLDOWN_MS = 10 * 60 * 1000; // 10 minutes
const ALWAYS_RUN_CONVERSATION = false; // Set to true to always run the conversation regardless of visitor count

@Injectable()
export class SceneManagerService implements OnModuleInit {
  private activeScene: DBScene | null = null;
  private activeSceneConfig: DBSceneConfig | null = null; // Store the DB record WITH parsed config
  private activeVisitors: Set<string> = new Set();
  private conversationLoopTimeout: NodeJS.Timeout | null = null;
  private isLoopRunning = false; // Prevent concurrent loops
  private lastSpeakingLogTime = 0; // Track when we last logged about speaking characters

  // Reference to the gateway to emit events
  // This is often better handled via events/observables, but direct ref is simpler for now
  private gateway: EventsGateway | null = null;

  constructor(
    private readonly configService: ConfigService,
    @Inject(DRIZZLE_INSTANCE) private readonly db: DrizzleSqliteDatabase,
    private readonly scenesService: ScenesService, // For complex DB operations
    private readonly logger: PinoLogger,
    private readonly schedulerRegistry: SchedulerRegistry, // Inject SchedulerRegistry
    private readonly sceneStateService: SceneStateService,
    private readonly conversationOrchestratorService: ConversationOrchestratorService,
    private readonly charactersService: CharactersService,
  ) {
    this.logger.setContext(SceneManagerService.name);
  }

  async onModuleInit() {
    this.logger.info('Initializing SceneManagerService...');
    await this.loadActiveScene();

    // Only start the conversation loop if ALWAYS_RUN_CONVERSATION is true
    if (this.activeScene && this.activeSceneConfig && ALWAYS_RUN_CONVERSATION) {
      this.logger.info(
        'ALWAYS_RUN_CONVERSATION is enabled, starting conversation loop immediately',
      );
      this.startConversationLoop();
    } else if (this.activeScene && this.activeSceneConfig) {
      this.logger.info('Scene loaded, waiting for visitors to start conversation loop');
    } else {
      this.logger.error('SceneManager initialization failed: Could not load active scene.');
    }
  }

  // Method for the gateway to register itself (alternative to DI if cyclic)
  registerGateway(gatewayInstance: EventsGateway) {
    this.gateway = gatewayInstance;
    this.logger.info('EventsGateway registered with SceneManagerService.');
  }

  private async loadActiveScene() {
    this.logger.info('Attempting to load active scene...');
    try {
      // 1. Find the latest scene record (assuming latest is active)
      // eslint-disable-next-line @typescript-eslint/await-thenable
      const latestSceneRecord = await this.db
        .select()
        .from(dbSchema.scenesTable)
        .orderBy(dbSchema.scenesTable.createdAt)
        .limit(1)
        .get();

      if (latestSceneRecord) {
        this.logger.info(`Found latest scene: ${latestSceneRecord.id}`);
        this.activeScene = latestSceneRecord;

        // Load the associated SceneConfig
        const sceneConfigRecord = await this.scenesService.getById(latestSceneRecord.sceneConfigId);
        if (!sceneConfigRecord) {
          this.logger.error(
            `Config ${latestSceneRecord.sceneConfigId} not found for latest scene ${latestSceneRecord.id}. Starting new scene. `,
          );
          await this.startNewScene(); // Attempt to start default scene
          return;
        }
        this.activeSceneConfig = sceneConfigRecord;
        this.logger.info(`Loaded config ${sceneConfigRecord.id} for scene ${this.activeScene.id}`);

        // Ensure all characters from config exist in the database
        await this.charactersService.ensureCharactersExistInDatabase(sceneConfigRecord);

        // 2. Load the latest snapshot using SceneStateService
        const loadedState = await this.sceneStateService.loadLatestSnapshotForScene(
          this.activeScene.id,
        );

        if (!loadedState) {
          this.logger.warn(
            `No valid snapshot for scene ${this.activeScene.id}. Initializing state from config.`,
          );
          // Initialize state using SceneStateService (result not needed here)
          this.sceneStateService.initializeStateFromConfig(
            this.activeScene,
            this.activeSceneConfig,
            this.activeVisitors.size,
          );
          // Save initial snapshot using SceneStateService
          await this.sceneStateService.saveSnapshot(this.activeScene.id);
          this.logger.info('Initialized and saved new state snapshot.');
        } else {
          // Update visitor count in loaded state
          this.sceneStateService.updateState({ visitor_count: this.activeVisitors.size });
          this.logger.info('Successfully loaded state from snapshot.');
        }
      } else {
        this.logger.info('No scenes found in DB. Starting a new one.');
        await this.startNewScene();
      }
    } catch (error) {
      this.logger.error(error, `Error loading active scene:`);
      this.activeScene = null; // Reset state on failure
      this.activeSceneConfig = null;
      this.sceneStateService.setCurrentState(null);
      this.stopConversationLoop();
      throw new InternalServerErrorException('Failed to initialize scene manager');
    }
  }

  private async startNewScene(configId?: number) {
    this.logger.info(
      `Starting new scene${configId ? ` with config ${configId}` : ' (default/highest voted)'}...`,
    );
    // Stop any existing loop before starting new scene
    this.stopConversationLoop();
    try {
      const targetConfig = await this.scenesService.getNextConfig(configId);
      if (!targetConfig) {
        this.logger.error('Could not find a suitable scene config to start.');
        throw new InternalServerErrorException('No scene config available to start.');
      }
      this.logger.info(`Selected scene config: ${targetConfig.id}`);

      const newSceneData: NewDBScene = {
        sceneConfigId: targetConfig.id,
      };
      // eslint-disable-next-line @typescript-eslint/await-thenable
      const newScene = await this.db
        .insert(dbSchema.scenesTable)
        .values(newSceneData)
        .returning()
        .get();
      this.logger.info(`Created new scene record: ${newScene.id}`);

      this.activeScene = newScene;
      this.activeSceneConfig = targetConfig;

      // Initialize SceneState using SceneStateService (result not needed)
      this.sceneStateService.initializeStateFromConfig(
        this.activeScene,
        this.activeSceneConfig,
        this.activeVisitors.size, // Pass current visitor count
      );

      // Ensure all characters exist in the database
      await this.charactersService.ensureCharactersExistInDatabase(targetConfig);

      // Save initial snapshot using SceneStateService
      await this.sceneStateService.saveSnapshot(this.activeScene.id);

      this.logger.info(
        `Successfully started new scene ${newScene.id} with config ${targetConfig.id}`,
      );
      // Ensure loop is started for the new scene
      this.startConversationLoop();
    } catch (error: unknown) {
      this.logger.error(error, 'Failed to start new scene:');
      this.activeScene = null;
      this.activeSceneConfig = null;
      this.sceneStateService.setCurrentState(null);
      // Loop should already be stopped from the top of the try block
      throw new InternalServerErrorException('Failed to start a new scene');
    }
  }

  async addVisitor(sid: string) {
    this.logger.info(`Visitor added: ${sid}`);
    this.activeVisitors.add(sid);
    const currentState = this.sceneStateService.getCurrentState();

    if (!currentState || !this.activeScene) {
      this.logger.warn('Cannot process visitor add: No active scene or state.');
      return;
    }

    // Check if this is the first visitor (or if we're already running due to ALWAYS_RUN_CONVERSATION)
    const needsResume =
      !currentState.conversation_active &&
      (this.activeVisitors.size > 0 || ALWAYS_RUN_CONVERSATION);

    // Always update the visitor count
    this.sceneStateService.updateState({
      visitor_count: this.activeVisitors.size,
      conversation_active: needsResume,
    });

    // Get updated state for emission
    const updatedState = this.sceneStateService.getCurrentState();
    if (updatedState) {
      await this.emitStateUpdate(sid, true); // Send current state, save snapshot
    }

    if (needsResume) {
      this.logger.info(
        'Starting conversation loop due to visitor join or ALWAYS_RUN_CONVERSATION setting',
      );
      this.startConversationLoop();
    }
  }

  async removeVisitor(sid: string) {
    this.logger.info(`Visitor removed: ${sid}`);
    this.activeVisitors.delete(sid);
    const currentState = this.sceneStateService.getCurrentState();

    if (!currentState || !this.activeScene) {
      this.logger.warn('Cannot process visitor remove: No active scene or state.');
      return;
    }

    // Only pause if there are no visitors AND ALWAYS_RUN_CONVERSATION is false
    const shouldPause = this.activeVisitors.size === 0 && !ALWAYS_RUN_CONVERSATION;

    this.sceneStateService.updateState({
      visitor_count: this.activeVisitors.size,
      conversation_active: !shouldPause,
    });

    if (shouldPause) {
      this.logger.info(
        'Last visitor left and ALWAYS_RUN_CONVERSATION is false, pausing conversation loop.',
      );
      this.stopConversationLoop();
      // Save snapshot on pause
      await this.sceneStateService.saveSnapshot(this.activeScene.id);
    } else {
      if (this.activeVisitors.size === 0 && ALWAYS_RUN_CONVERSATION) {
        this.logger.info(
          'Last visitor left but ALWAYS_RUN_CONVERSATION is true, keeping conversation active.',
        );
      }

      // Emit update to remaining visitors
      const updatedState = this.sceneStateService.getCurrentState();
      if (updatedState) {
        await this.emitStateUpdate(null, true);
      }
    }
  }

  private async emitStateUpdate(sid: string | null = null, saveSnapshot = true) {
    if (!this.gateway) {
      this.logger.warn('Cannot emit state update: Gateway not registered.');
      return;
    }
    const currentState = this.sceneStateService.getCurrentState();
    if (!currentState) {
      this.logger.warn('Cannot emit state update: No active state.');
      return;
    }
    if (!this.activeScene) {
      this.logger.error(
        'Consistency error: Cannot emit state update without an active scene record.',
      );
      return;
    }

    this.logger.debug(`Emitting scene state update (Save Snapshot: ${saveSnapshot})...`);

    if (saveSnapshot) {
      try {
        await this.sceneStateService.saveSnapshot(this.activeScene.id);
      } catch (e) {
        this.logger.error(e, 'Failed to save snapshot during emitStateUpdate');
        // Continue with emit even if save fails?
      }
    }

    try {
      const validatedState = SceneStateSchema.parse(currentState);
      if (sid) {
        this.gateway.server.to(sid).emit('scene_state', validatedState);
      } else {
        this.gateway.server.emit('scene_state', validatedState);
      }
    } catch (validationError) {
      this.logger.error(validationError, 'Current scene state failed validation before emit:');
      // Consider stopping the loop or other recovery action
    }
  }

  private startConversationLoop() {
    if (!this.activeScene || !this.activeSceneConfig) {
      this.logger.warn('Cannot start conversation loop: Missing active scene or config.');
      return;
    }

    if (this.isLoopRunning) {
      this.logger.warn('Attempted to start loop, but it is already running.');
      return;
    }

    // Check if we have any visitors or if ALWAYS_RUN_CONVERSATION is true
    if (this.activeVisitors.size === 0 && !ALWAYS_RUN_CONVERSATION) {
      this.logger.info(
        'No visitors connected and ALWAYS_RUN_CONVERSATION is false, not starting conversation loop.',
      );
      return;
    }

    this.logger.info('Starting sequential conversation loop...');

    // Stop any potential previous loop JUST IN CASE
    this.stopConversationLoop();

    // Mark as running and start the first iteration
    this.isLoopRunning = true;
    this.scheduleNextStep();
  }

  private scheduleNextStep(useExtendedDelay = false) {
    if (!this.isLoopRunning) {
      this.logger.debug('Loop no longer running, not scheduling next step.');
      return;
    }

    // Use longer interval if characters are busy
    const interval = useExtendedDelay ? BUSY_LOOP_INTERVAL_MS : LOOP_INTERVAL_MS;

    // Use timeout instead of interval for better control
    this.conversationLoopTimeout = setTimeout(() => {
      if (!this.isLoopRunning) {
        this.logger.debug('Loop stopped before executing scheduled step.');
        return;
      }

      // Wrap the async execution in an IIFE to avoid the Promise return lint error
      void (async () => {
        try {
          const isWaiting = await this.executeConversationStep();

          // Only schedule next step if loop is still running
          if (this.isLoopRunning) {
            // If characters are speaking/thinking, use longer interval
            this.scheduleNextStep(isWaiting);
          }
        } catch (error) {
          this.logger.error(error, 'Error in conversation step. Stopping loop.');
          this.stopConversationLoop();
        }
      })();
    }, interval);
  }

  private async executeConversationStep(): Promise<boolean> {
    // Get current data at the beginning of the step
    const currentScene = this.activeScene;
    const currentConfig = this.activeSceneConfig;
    const currentState = this.sceneStateService.getCurrentState();

    // Essential data check
    if (!currentScene || !currentConfig || !currentState) {
      this.logger.error('Loop step failed: Missing essential scene data. Stopping loop.');
      this.stopConversationLoop();
      return false;
    }

    // --- Restart Logic ---
    if (currentState.conversation_ended) {
      const endedAt = currentState.ended_at ?? 0;
      if (Date.now() > endedAt + NEW_CONVERSATION_COOLDOWN_MS) {
        this.logger.info(
          `Conversation cooldown (${NEW_CONVERSATION_COOLDOWN_MS / 1000}s) ended. Restarting scene...`,
        );
        try {
          // startNewScene will stop the current loop and start a new one
          await this.startNewScene();
          return false;
        } catch (restartError: unknown) {
          this.logger.error(restartError, 'Failed to restart scene after cooldown. Stopping loop.');
          this.stopConversationLoop();
          return false;
        }
      }
      // Cooldown not met, ensure loop remains stopped
      this.logger.trace('Conversation ended, waiting for cooldown. Stopping loop.');
      this.stopConversationLoop();
      return false;
    }

    // --- Active Check ---
    // Only pause if there are no visitors AND ALWAYS_RUN_CONVERSATION is false
    if (
      !currentState.conversation_active &&
      !(this.activeVisitors.size > 0 || ALWAYS_RUN_CONVERSATION)
    ) {
      this.logger.trace(
        'Conversation not active and no visitors or ALWAYS_RUN_CONVERSATION is false. Pausing loop.',
      );
      this.stopConversationLoop();
      return false;
    }

    // Check if any character is still speaking or thinking
    const activeCharacters = Object.values(currentState.characters)
      .filter(
        (char) =>
          (char.action === 'speaking' || char.action === 'thinking') &&
          typeof char.action_started_at === 'number' &&
          typeof char.action_estimated_duration === 'number' &&
          Date.now() < char.action_started_at + char.action_estimated_duration * 1000,
      )
      .map((char) => ({
        name: char.name,
        action: char.action,
      }));
    const hasActiveSpeakers = activeCharacters.length > 0;

    if (hasActiveSpeakers) {
      // Only log this message if we haven't logged it recently (every 5 seconds)
      const now = Date.now();
      if (now - this.lastSpeakingLogTime > 5000) {
        this.logger.debug(
          { active: activeCharacters },
          'Characters are still active (speaking/thinking). Waiting for completion before generation.',
        );
        this.lastSpeakingLogTime = now;
      }
      return true; // Return true to indicate we should use longer delay
    }

    // Reset the log timer when there are no active speakers
    this.lastSpeakingLogTime = 0;

    // --- Execute Orchestrator Step ---
    this.logger.debug('Executing conversation orchestrator step...');
    await this.conversationOrchestratorService.runConversationStep(currentState, currentConfig);

    // Emit state AFTER the orchestrator step completes
    const finalState = this.sceneStateService.getCurrentState();
    if (finalState) {
      await this.emitStateUpdate(null, true);
    } else {
      this.logger.warn('State became null after conversation step? This should not happen.');
    }

    return false; // Return false to indicate we should use normal delay
  }

  private stopConversationLoop() {
    if (!this.isLoopRunning) {
      // Avoid redundant logging if already stopped
      return;
    }

    this.logger.info('Stopping conversation loop...');
    this.isLoopRunning = false;

    // Clear the timeout if it exists
    if (this.conversationLoopTimeout) {
      clearTimeout(this.conversationLoopTimeout);
      this.conversationLoopTimeout = null;
    }

    this.logger.info('Conversation loop stopped.');
  }
}
