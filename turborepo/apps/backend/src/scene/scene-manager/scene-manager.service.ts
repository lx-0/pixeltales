import { Inject, Injectable, InternalServerErrorException, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { DBScene, SceneStateSchema } from '@pixeltales/contracts'; // Import necessary types/schemas
import { DBSceneConfig, dbSchema, NewDBScene } from '@pixeltales/database';
import { PinoLogger } from 'nestjs-pino';
import { DRIZZLE_INSTANCE, DrizzleSqliteDatabase } from '../../db/drizzle.provider';
import { EventsGateway } from '../../events/events.gateway'; // To emit updates
import { LlmService } from '../../llm/llm.service';
import { ScenesService } from '../../scenes/scenes.service'; // Assuming DB access logic is here
import { ConversationOrchestratorService } from '../conversation-orchestrator/conversation-orchestrator.service';
import { SceneStateService } from '../scene-state/scene-state.service';

const CONVERSATION_LOOP_INTERVAL = 'CONVERSATION_LOOP_INTERVAL';
const LOOP_INTERVAL_MS = 500; // Check loop every 500ms
const NEW_CONVERSATION_COOLDOWN_MS = 10 * 60 * 1000; // 10 minutes

@Injectable()
export class SceneManagerService implements OnModuleInit {
  private activeScene: DBScene | null = null;
  private activeSceneConfig: DBSceneConfig | null = null; // Store the DB record WITH parsed config
  private activeVisitors: Set<string> = new Set();
  private conversationLoopTimeout: NodeJS.Timeout | null = null;
  private isLoopRunning = false; // Prevent concurrent loops

  // Reference to the gateway to emit events
  // This is often better handled via events/observables, but direct ref is simpler for now
  private gateway: EventsGateway | null = null;

  constructor(
    private readonly configService: ConfigService,
    @Inject(DRIZZLE_INSTANCE) private readonly db: DrizzleSqliteDatabase,
    private readonly scenesService: ScenesService, // For complex DB operations
    private readonly llmService: LlmService,
    private readonly logger: PinoLogger,
    private readonly schedulerRegistry: SchedulerRegistry, // Inject SchedulerRegistry
    private readonly sceneStateService: SceneStateService,
    private readonly conversationOrchestratorService: ConversationOrchestratorService,
  ) {
    this.logger.setContext(SceneManagerService.name);
  }

  async onModuleInit() {
    this.logger.info('Initializing SceneManagerService...');
    await this.loadActiveScene();
    if (this.activeScene && this.activeSceneConfig) {
      // Only start loop if scene loaded successfully
      this.startConversationLoop();
    } else {
      this.logger.error('SceneManager initialization failed: Could not load active scene.');
      // Optionally throw an error or handle differently
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

      // Save initial snapshot using SceneStateService
      await this.sceneStateService.saveSnapshot(this.activeScene.id);

      this.logger.info(
        `Successfully started new scene ${newScene.id} with config ${targetConfig.id}`,
      );
      // Ensure loop is started for the new scene
      this.startConversationLoop();
    } catch (error: unknown) {
      this.logger.error('Failed to start new scene:', error);
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
      // Maybe try to load/start a scene here?
      return;
    }

    const needsResume = !currentState.conversation_active && this.activeVisitors.size > 0;
    this.sceneStateService.updateState({
      visitor_count: this.activeVisitors.size,
      conversation_active: true,
    });

    // Get updated state for emission
    const updatedState = this.sceneStateService.getCurrentState();
    if (updatedState) {
      await this.emitStateUpdate(sid, true); // Send current state, save snapshot
    }

    if (needsResume) {
      this.logger.info('First visitor joined, ensuring conversation loop is running.');
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

    const shouldPause = this.activeVisitors.size === 0;
    this.sceneStateService.updateState({
      visitor_count: this.activeVisitors.size,
      conversation_active: !shouldPause,
    });

    if (shouldPause) {
      this.logger.info('Last visitor left, pausing conversation loop.');
      this.stopConversationLoop();
      // Save snapshot on pause
      await this.sceneStateService.saveSnapshot(this.activeScene.id);
    } else {
      // Emit update to remaining visitors
      const updatedState = this.sceneStateService.getCurrentState();
      if (updatedState) {
        await this.emitStateUpdate(null, true); // Save snapshot on visitor leave too?
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
        this.logger.error('Failed to save snapshot during emitStateUpdate', e);
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
      this.logger.error('Current scene state failed validation before emit:', validationError);
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
    this.logger.info('Starting conversation loop interval...');
    // Stop any potential previous loop JUST IN CASE (redundant if logic elsewhere is correct)
    this.stopConversationLoop();

    const stepFn = async () => {
      // Get current data at the beginning of each step
      const currentScene = this.activeScene;
      const currentConfig = this.activeSceneConfig;
      const currentState = this.sceneStateService.getCurrentState();

      // Essential data check
      if (!currentScene || !currentConfig || !currentState) {
        this.logger.error('Loop step failed: Missing essential scene data. Stopping loop.');
        this.stopConversationLoop();
        return;
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
            // No need to emit or return here, new loop takes over.
            return; // Exit this interval callback
          } catch (restartError: unknown) {
            this.logger.error(
              'Failed to restart scene after cooldown. Stopping loop.',
              restartError,
            );
            this.stopConversationLoop();
            return;
          }
        }
        // Cooldown not met, ensure loop remains stopped
        this.logger.trace('Conversation ended, waiting for cooldown. Loop should be stopped.');
        if (this.isLoopRunning) this.stopConversationLoop(); // Ensure it's stopped
        return;
      }

      // --- Active Check ---
      if (!currentState.conversation_active) {
        this.logger.trace('Conversation not active. Loop step skipped. Pausing loop.');
        this.stopConversationLoop(); // Pause the loop if no visitors
        return;
      }

      // --- Execute Orchestrator Step ---
      try {
        await this.conversationOrchestratorService.runConversationStep(currentState, currentConfig);
        // Emit state AFTER the orchestrator step completes (save snapshot handled within orchestrator/state service? No, let's save here)
        const finalState = this.sceneStateService.getCurrentState();
        if (finalState) {
          // Let's save snapshot after each successful step for now
          await this.emitStateUpdate(null, true);
        } else {
          this.logger.warn('State became null after conversation step? This should not happen.');
        }
      } catch (error) {
        this.logger.error('Error during conversation step execution. Stopping loop.', error);
        this.stopConversationLoop();
      }
    };

    // Schedule the interval
    const interval = setInterval(() => {
      if (!this.isLoopRunning) {
        clearInterval(interval);
        return;
      }
      // Wrap async stepFn call
      (async () => {
        try {
          await stepFn();
        } catch (e) {
          this.logger.error('Unhandled error in scheduled stepFn execution. Stopping loop.', e);
          this.stopConversationLoop();
        }
      })();
    }, LOOP_INTERVAL_MS);

    // Register interval
    try {
      this.schedulerRegistry.addInterval(CONVERSATION_LOOP_INTERVAL, interval);
      this.isLoopRunning = true;
      this.logger.info(
        `Conversation loop successfully started with interval ${LOOP_INTERVAL_MS}ms.`,
      );
    } catch (error) {
      this.logger.error('Failed to add interval to scheduler registry', error);
      clearInterval(interval);
      this.isLoopRunning = false;
    }
  }

  private stopConversationLoop() {
    if (!this.isLoopRunning) {
      // Avoid redundant logging if already stopped
      return;
    }
    this.logger.info('Attempting to stop conversation loop...');
    try {
      if (this.schedulerRegistry.doesExist('interval', CONVERSATION_LOOP_INTERVAL)) {
        this.schedulerRegistry.deleteInterval(CONVERSATION_LOOP_INTERVAL);
        this.logger.info('Conversation loop interval deleted from registry.');
      } else {
        this.logger.info(
          'Conversation loop interval did not exist in registry (already removed?).',
        );
      }
    } catch (err) {
      this.logger.warn('Error trying to delete conversation loop interval', { err });
    }
    this.isLoopRunning = false;
    if (this.conversationLoopTimeout) {
      clearTimeout(this.conversationLoopTimeout);
      this.conversationLoopTimeout = null;
    }
    this.logger.info('Conversation loop stopped.');
  }
}
