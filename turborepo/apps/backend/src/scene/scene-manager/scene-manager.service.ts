import { Inject, Injectable, InternalServerErrorException, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import {
  CharacterAction,
  CharacterState,
  CharacterStateSchema,
  DBMessage,
  DBScene,
  DBSceneConfigPopulated,
  Message,
  MessageSchema,
  NewDBMessage,
  NewDBSceneStateSnapshot,
  SceneState,
  SceneStateSchema,
} from '@pixeltales/contracts'; // Import necessary types/schemas
import { dbSchema } from '@pixeltales/database';
import { randomUUID } from 'crypto';
import { desc, eq } from 'drizzle-orm';
import { PinoLogger } from 'nestjs-pino';
import { DRIZZLE_INSTANCE, DrizzleSqliteDatabase } from '../../db/drizzle.provider';
import { EventsGateway } from '../../events/events.gateway'; // To emit updates
import { LlmService } from '../../llm/llm.service';
import { ScenesService } from '../../scenes/scenes.service'; // Assuming DB access logic is here

const CONVERSATION_LOOP_INTERVAL = 'CONVERSATION_LOOP_INTERVAL';
const LOOP_INTERVAL_MS = 500; // Check loop every 500ms
const BASE_PAUSE_TIME_MS = 5000; // 5 seconds - TODO: Use this later
const END_CONVERSATION_REQUEST_VALIDITY_S = 180; // 3 minutes

@Injectable()
export class SceneManagerService implements OnModuleInit {
  private activeScene: DBScene | null = null;
  private activeSceneConfig: DBSceneConfigPopulated | null = null; // Store the DB config record
  private activeState: SceneState | null = null;
  private activeVisitors: Set<string> = new Set();
  private conversationLoopTimeout: NodeJS.Timeout | null = null;
  private isLoopRunning = false; // Prevent concurrent loops

  // Reference to the gateway to emit events
  // This is often better handled via events/observables, but direct ref is simpler for now
  private gateway: EventsGateway | null = null;

  // Store character chains (key: characterId)
  private characterChains: Map<string, any> = new Map(); // TODO: Use actual LangChain Chain type

  constructor(
    private readonly configService: ConfigService,
    @Inject(DRIZZLE_INSTANCE) private readonly db: DrizzleSqliteDatabase,
    private readonly scenesService: ScenesService, // For complex DB operations
    private readonly llmService: LlmService,
    private readonly logger: PinoLogger,
    private readonly schedulerRegistry: SchedulerRegistry, // Inject SchedulerRegistry
  ) {
    this.logger.setContext(SceneManagerService.name);
  }

  async onModuleInit() {
    this.logger.info('Initializing SceneManagerService...');
    await this.loadActiveScene();
    this.startConversationLoop(); // Start the loop automatically
  }

  // Method for the gateway to register itself (alternative to DI if cyclic)
  registerGateway(gatewayInstance: EventsGateway) {
    this.gateway = gatewayInstance;
    this.logger.info('EventsGateway registered with SceneManagerService.');
  }

  private async loadActiveScene() {
    this.logger.info('Attempting to load active scene...');
    try {
      // 1. Find the currently active scene (if any)
      // eslint-disable-next-line @typescript-eslint/await-thenable
      const activeSceneRecord = await this.db
        .select()
        .from(dbSchema.scenesTable)
        // .where(eq(dbSchema.scenesTable.isActive, true))
        .limit(1)
        .get();

      if (activeSceneRecord) {
        this.logger.info(`Found active scene: ${activeSceneRecord.id}`);
        this.activeScene = activeSceneRecord;
        // Load the associated SceneConfig
        const sceneConfigRecord = await this.scenesService.getById(activeSceneRecord.sceneConfigId);
        if (!sceneConfigRecord?.config) {
          this.logger.error(
            `SceneConfig ${activeSceneRecord.sceneConfigId} not found or has no config for active scene ${activeSceneRecord.id}`,
          );
          throw new Error('Scene config not found');
        }
        this.activeSceneConfig = sceneConfigRecord;

        this.logger.info(
          `Found active scene: ${activeSceneRecord.id} with config ${sceneConfigRecord.id}`,
        );

        // 2. Load the latest snapshot for this scene
        // eslint-disable-next-line @typescript-eslint/await-thenable
        const latestSnapshot = await this.db
          .select()
          .from(dbSchema.sceneStateSnapshotsTable)
          .where(eq(dbSchema.sceneStateSnapshotsTable.sceneId, activeSceneRecord.id))
          .orderBy(desc(dbSchema.sceneStateSnapshotsTable.timestamp))
          .limit(1)
          .get();

        if (latestSnapshot && latestSnapshot.state) {
          try {
            const parsedStateResult = SceneStateSchema.safeParse(JSON.parse(latestSnapshot.state));
            if (!parsedStateResult.success) {
              this.logger.error(
                `Failed to parse state for snapshot ${latestSnapshot.id}`,
                parsedStateResult.error.flatten(),
              );
              throw new Error('Corrupted scene state data');
            }
            this.activeState = parsedStateResult.data;
            if (this.activeScene) {
              this.logger.info(
                `Loaded state snapshot ${latestSnapshot.id} for scene ${this.activeScene.id}`,
              );
            }
          } catch (e) {
            this.logger.error(`Failed to parse state JSON for snapshot ${latestSnapshot.id}`, e);
            // Initialize state from config if no snapshot
            this.logger.warn(
              `No valid snapshot for scene ${activeSceneRecord.id}. Initializing state from config.`,
            );
            this.initializeStateFromConfig();
            await this.saveSnapshot();
          }
        } else {
          this.logger.warn(
            `No valid state snapshot found for active scene ${activeSceneRecord.id}. Starting fresh.`,
          );
          await this.startNewScene(activeSceneRecord.sceneConfigId);
        }
      } else {
        this.logger.info('No active scene found. Starting a new one.');
        await this.startNewScene();
      }
    } catch (error) {
      this.logger.error(`Error loading active scene: ${JSON.stringify(error, null, 2)}`, error);
      // Handle error appropriately, maybe retry or shutdown?
      throw new InternalServerErrorException('Failed to initialize scene manager');
    }
  }

  private initializeStateFromConfig() {
    if (!this.activeScene || !this.activeSceneConfig) {
      this.logger.error(`Cannot initialize state: Missing active scene or parsed config.`);
      // This case should ideally not happen if loadActiveScene works correctly
      throw new Error('Cannot initialize scene state without active scene/config.');
    }
    this.logger.info(`Initializing scene state from config ${this.activeScene.sceneConfigId}`);
    const characters: Record<string, CharacterState> = {};
    // Iterate over the characters defined in the config
    for (const charId in this.activeSceneConfig.config.characters_config) {
      const config = this.activeSceneConfig.config.characters_config[charId];
      if (!config) {
        this.logger.error(`Character config for ${charId} not found in activeSceneConfig`);
        continue;
      }
      // Use CharacterStateSchema for parsing/validation
      const characterStateParseResult = CharacterStateSchema.safeParse({
        id: charId,
        name: config.name, // Assuming name is in config
        color: config.color, // Assuming color is in config
        role: config.role,
        visual: config.visual,
        llm_config: config.llm_config,
        position: config.initial_position, // PositionSchema used within CharacterStateSchema
        direction: config.initial_direction,
        current_mood: config.initial_mood ?? 'neutral',
        action: config.initial_action ?? 'idle',
        action_started_at: Date.now(),
        end_conversation_requested: false,
      });
      if (characterStateParseResult.success) {
        characters[charId] = characterStateParseResult.data;
      } else {
        this.logger.error(
          `Failed to parse initial state for character ${charId}`,
          characterStateParseResult.error.flatten(),
        );
        // Skip this character or throw error?
      }
    }

    this.activeState = {
      scene_id: this.activeScene.id,
      config_id: this.activeScene.sceneConfigId,
      characters: characters,
      messages: [], // Start with empty messages
      started_at: Date.now(),
      conversation_active: this.activeVisitors.size > 0,
      conversation_ended: false,
      ended_at: null,
      visitor_count: this.activeVisitors.size,
    };
    this.logger.info('Scene state initialized successfully from config.');
  }

  private async startNewScene(configId?: string) {
    this.logger.info(
      `Starting new scene${configId ? ` with config ${configId}` : ' (default/highest voted)'}...`,
    );
    // TODO: Implement logic to get next/default SceneConfig (using ScenesService?)
    // TODO: Create new DBScene entry
    // TODO: Create initial SceneState based on config
    // TODO: Save initial snapshot
    // TODO: Set this.activeScene, this.activeSceneConfig, this.activeSceneConfig, this.activeState
    throw new Error('startNewScene needs implementation');
  }

  async addVisitor(sid: string) {
    this.logger.info(`Visitor added: ${sid}`);
    this.activeVisitors.add(sid);
    if (this.activeState) {
      this.activeState.visitor_count = this.activeVisitors.size;
      const needsResume = !this.activeState.conversation_active && this.activeVisitors.size > 0;
      this.activeState.conversation_active = true;
      await this.emitStateUpdate(sid); // Send current state to new visitor
      if (needsResume) {
        this.logger.info('First visitor joined, resuming conversation loop.');
        this.startConversationLoop(); // Resume loop if paused
      }
    }
  }

  async removeVisitor(sid: string) {
    this.logger.info(`Visitor removed: ${sid}`);
    this.activeVisitors.delete(sid);
    if (this.activeState) {
      this.activeState.visitor_count = this.activeVisitors.size;
      if (this.activeVisitors.size === 0) {
        this.logger.info('Last visitor left, pausing conversation loop.');
        this.activeState.conversation_active = false;
        this.stopConversationLoop(); // Pause loop
        // Optionally save state snapshot on pause?
        // await this.saveSnapshot();
      }
      // Emit update to remaining visitors (if any)
      await this.emitStateUpdate();
    }
  }

  private async emitStateUpdate(sid: string | null = null, saveSnapshot = true) {
    if (!this.gateway || !this.activeState) {
      this.logger.warn('Cannot emit state update: Gateway not registered or no active state.');
      return;
    }
    this.logger.debug('Emitting scene state update...');

    if (saveSnapshot) {
      await this.saveSnapshot();
    }

    // Use Zod schema to ensure data matches contract before sending
    const validatedState = SceneStateSchema.parse(this.activeState);

    if (sid) {
      this.gateway.server.to(sid).emit('scene_state', validatedState);
    } else {
      this.gateway.server.emit('scene_state', validatedState);
    }
  }

  private async saveSnapshot() {
    if (!this.activeScene || !this.activeState) return;
    this.logger.debug(`Saving snapshot for scene ${this.activeScene.id}...`);
    const newStateSnapshot: NewDBSceneStateSnapshot = {
      id: randomUUID(),
      sceneId: this.activeScene.id,
      state: JSON.stringify(this.activeState),
      // timestamp is defaulted by DB
    };
    try {
      // eslint-disable-next-line @typescript-eslint/await-thenable
      await this.db.insert(dbSchema.sceneStateSnapshotsTable).values(newStateSnapshot);
    } catch (error) {
      this.logger.error(`Failed to save state snapshot for scene ${this.activeScene.id}`, error);
    }
  }

  // --- Conversation Loop Logic (Placeholder) ---
  private startConversationLoop() {
    this.logger.info('Attempting to start conversation loop...');
    if (this.isLoopRunning) {
      this.logger.warn('Loop already running.');
      return;
    }
    this.stopConversationLoop(); // Ensure previous interval is cleared

    // Define the step function synchronously, triggering the async step
    const stepFn = () => {
      this._runConversationStep().catch((error) => {
        this.logger.error('Error caught during conversation step execution:', error);
        // Decide if loop should stop on error or just log and continue
        // this.stopConversationLoop();
      });
    };

    const interval = setInterval(stepFn, LOOP_INTERVAL_MS);
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      this.schedulerRegistry.addInterval(CONVERSATION_LOOP_INTERVAL, interval);
      this.isLoopRunning = true;
      this.logger.info(`Conversation loop started with interval ${LOOP_INTERVAL_MS}ms.`);
    } catch (error) {
      this.logger.error('Failed to add interval to scheduler registry', error);
      clearInterval(interval); // Clean up interval if adding failed
      this.isLoopRunning = false;
    }
  }

  private stopConversationLoop() {
    this.logger.info('Stopping conversation loop...');
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      if (this.schedulerRegistry.doesExist('interval', CONVERSATION_LOOP_INTERVAL)) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        this.schedulerRegistry.deleteInterval(CONVERSATION_LOOP_INTERVAL);
        this.logger.info('Conversation loop interval deleted.');
      } else {
        this.logger.info('Conversation loop interval did not exist in registry.');
      }
      this.isLoopRunning = false;
      // Clear any potential manually stored timeout reference (if we add one later)
      if (this.conversationLoopTimeout) {
        clearTimeout(this.conversationLoopTimeout);
        this.conversationLoopTimeout = null;
      }
    } catch (err) {
      this.logger.warn('Error trying to stop conversation loop', { error: err });
    }
  }

  // --- Character Action & State Helpers ---
  private getCharacterState(characterId: string): CharacterState | undefined {
    return this.activeState?.characters[characterId];
  }

  private updateCharacterState(characterId: string, updates: Partial<CharacterState>) {
    if (!this.activeState || !this.activeState.characters[characterId]) {
      this.logger.warn(`Character ${characterId} not found in active state for update.`);
      return;
    }
    this.activeState.characters[characterId] = {
      ...this.activeState.characters[characterId],
      ...updates,
    };
  }

  private async setCharacterAction(
    characterId: string,
    action: CharacterAction,
    estimatedDurationMs?: number,
    emitUpdate = true,
  ) {
    this.logger.debug(`Setting action for ${characterId}: ${action}`);
    this.updateCharacterState(characterId, {
      action: action,
      action_started_at: Date.now(),
      action_estimated_duration: estimatedDurationMs ? estimatedDurationMs / 1000 : undefined,
    });
    if (emitUpdate) {
      await this.emitStateUpdate(null, false); // Don't save snapshot for frequent action changes
    }
  }

  // --- Conversation Logic Helpers ---

  private _getOtherCharacterId(characterId: string): string | null {
    if (!this.activeState) return null;
    const allIds = Object.keys(this.activeState.characters);
    const otherIds = allIds.filter((id) => id !== characterId);
    if (otherIds.length === 0) return null;
    // Ensure result is string or null
    const chosenId = otherIds[Math.floor(Math.random() * otherIds.length)];
    return chosenId ?? null;
  }

  private _getSceneConfig(): DBSceneConfigPopulated | null {
    return this.activeSceneConfig;
  }

  private async _generateMessage(
    characterId: string,
    recipientId: string | null, // Allow null recipient
  ): Promise<DBMessage | null> {
    const sceneConfig = this._getSceneConfig(); // Get the PARSED config
    const characterConfig = sceneConfig?.config.characters_config[characterId];
    // Check against the PARSED config
    if (!this.activeState || !this.activeScene || !sceneConfig || !characterConfig) {
      this.logger.error(`Could not generate message for ${characterId} - missing state or config`);
      return null;
    }

    await this.setCharacterAction(characterId, 'thinking', undefined, true);

    this.logger.info(`Generating message for ${characterId}...`);
    // TODO: Replace MOCK with actual LangChain call
    // const chain = this.characterChains.get(characterId) ?? await this.llmService.createCharacterChain(...);
    // const response = await chain.call({ input: "..." }); // Need proper input construction
    await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate LLM delay
    const mockContent = `Hello ${recipientId || 'world'}! This is ${characterId} (${this.activeState.messages.length + 1}).`;
    const mockThoughts = 'Thinking about what to say next...'; // Ensure this is never null based on logic
    const mockMood = 'curious';
    const mockMoodEmoji = '🤔';
    const mockEnd = Math.random() < 0.05; // Small chance to request end
    const speakingTimeMs = mockContent.length * 50 + 1000; // Estimate based on length
    const nowTimestamp = Date.now(); // Use number for timestamp_ms

    const newMessageData: NewDBMessage & { content: string } = {
      id: randomUUID(),
      sceneId: this.activeScene.id,
      characterId: characterId,
      content: mockContent,
      timestamp: new Date(nowTimestamp),
      thoughts: mockThoughts ?? '', // Provide default empty string if null
      mood: mockMood,
      moodEmoji: mockMoodEmoji,
      modelUsed: characterConfig.llm_config.model_name,
      recipient: recipientId ?? '', // Provide default empty string if null
      calculatedSpeakingTime: speakingTimeMs / 1000,
      endConversation: mockEnd,
      // TODO: Add other fields like rating, tokens, cost
    };

    try {
      // eslint-disable-next-line @typescript-eslint/await-thenable
      const insertedMessage: DBMessage = await this.db
        .insert(dbSchema.messagesTable)
        .values(newMessageData)
        .returning()
        .get();
      this.logger.info(`Saved message ${insertedMessage.id} from ${characterId}`);

      // Update character state using the App/Zod types
      this.updateCharacterState(characterId, {
        current_mood: mockMood,
        end_conversation_requested: mockEnd,
        end_conversation_requested_at: mockEnd ? nowTimestamp : undefined,
        end_conversation_requested_validity_duration: mockEnd
          ? END_CONVERSATION_REQUEST_VALIDITY_S
          : undefined,
      });

      // Set character to speaking AFTER generating/saving message
      await this.setCharacterAction(characterId, 'speaking', speakingTimeMs, false); // Don't emit yet

      return insertedMessage;
    } catch (error) {
      this.logger.error(`Failed to save message for character ${characterId}`, error);
      await this.setCharacterAction(characterId, 'idle'); // Reset action on error
      return null;
    }
  }

  private _get_next_speaker(): string | null {
    const sceneConfig = this._getSceneConfig(); // Get the PARSED config
    if (!this.activeState || !this.activeScene || !sceneConfig) return null;

    if (!this.activeState.messages || this.activeState.messages.length === 0) {
      // Use start_character_id from the PARSED config
      return sceneConfig.config.start_character_id;
    }
    const lastMessage = this.activeState?.messages?.[this.activeState.messages.length - 1];
    // Use start_character_id from the PARSED config as fallback
    if (!lastMessage) return this._getOtherCharacterId(sceneConfig.config.start_character_id);
    return this._getOtherCharacterId(lastMessage.character);
  }

  private async _wait_until_all_characters_completed_action(
    actionType: CharacterAction = 'speaking',
  ) {
    if (!this.activeState?.characters) return;
    let stillActing = true;
    while (stillActing) {
      stillActing = false;
      const now = Date.now();
      for (const charId in this.activeState.characters) {
        const char = this.getCharacterState(charId);
        if (!char) continue;
        // Ensure properties are numbers before calculation
        const startedAt =
          typeof char.action_started_at === 'number' ? char.action_started_at : null;
        const duration =
          typeof char.action_estimated_duration === 'number'
            ? char.action_estimated_duration
            : null;

        if (char.action === actionType && duration !== null && startedAt !== null) {
          const endTime = startedAt + duration * 1000;
          if (now < endTime) {
            stillActing = true;
            const waitTime = endTime - now;
            this.logger.trace(
              `Character ${charId} still ${actionType}, waiting ${waitTime.toFixed(0)}ms`,
            );
            await new Promise((resolve) => setTimeout(resolve, Math.max(50, waitTime)));
            break;
          } else {
            this.logger.trace(`Character ${charId} finished ${actionType}. Setting idle.`);
            await this.setCharacterAction(charId, 'idle', undefined, false);
          }
        }
      }
      if (stillActing) await new Promise((resolve) => setTimeout(resolve, 50));
    }
    this.logger.debug(`All characters finished ${actionType}.`);
    await this.emitStateUpdate(null, false);
  }

  private async _handle_end_conversation_requests() {
    if (!this.activeState?.characters) return;
    const now = Date.now();
    let all_agreed = true;
    let changed = false;
    for (const charId in this.activeState.characters) {
      const char = this.getCharacterState(charId);
      if (!char) continue;
      // Ensure properties are numbers before calculation
      const requestedAt =
        typeof char.end_conversation_requested_at === 'number'
          ? char.end_conversation_requested_at
          : null;
      const validityDuration =
        typeof char.end_conversation_requested_validity_duration === 'number'
          ? char.end_conversation_requested_validity_duration
          : null;

      if (char.end_conversation_requested && requestedAt !== null && validityDuration !== null) {
        if (now > requestedAt + validityDuration * 1000) {
          this.logger.info(`End request for ${charId} expired.`);
          this.updateCharacterState(charId, {
            end_conversation_requested: false,
            end_conversation_requested_at: undefined,
            end_conversation_requested_validity_duration: undefined,
          });
          changed = true;
          all_agreed = false;
        }
      } else {
        all_agreed = false;
      }
    }

    if (all_agreed && Object.keys(this.activeState.characters).length > 0) {
      // Ensure there are characters to agree
      this.logger.info('All characters agreed to end conversation.');
      this.activeState.conversation_active = false;
      this.activeState.conversation_ended = true;
      this.activeState.ended_at = Date.now();
      changed = true;
      this.stopConversationLoop(); // Stop generating new messages
    }

    if (changed) {
      await this.emitStateUpdate(null, true); // Save snapshot on end/expiry
    }
  }

  // --- Main Conversation Loop Step ---
  private async _runConversationStep() {
    if (
      !this.isLoopRunning ||
      !this.activeState ||
      !this.activeState.conversation_active ||
      this.activeState.conversation_ended
    ) {
      return;
    }

    try {
      this.logger.debug('Running conversation step...');

      // 1. Check for scene restart (simplified from legacy)
      // TODO: Implement proper restart logic based on cooldown

      // 2. Wait for characters to finish speaking/previous actions
      await this._wait_until_all_characters_completed_action('speaking');
      await this._wait_until_all_characters_completed_action('thinking'); // Ensure thinking is also finished

      // Pause after actions complete before next step
      await new Promise((resolve) => setTimeout(resolve, BASE_PAUSE_TIME_MS));

      if (!this.activeState?.conversation_active || this.activeState?.conversation_ended) return; // Re-check state after pauses

      // 3. Determine next speaker
      const nextSpeakerId = this._get_next_speaker();
      if (!nextSpeakerId) {
        this.logger.warn('Could not determine next speaker.');
        return;
      }
      const recipientId = this._getOtherCharacterId(nextSpeakerId);

      this.logger.info(`Next speaker: ${nextSpeakerId}`);

      // 4. Generate message (includes setting thinking, LLM call, saving message, setting speaking)
      const newMessage = await this._generateMessage(nextSpeakerId, recipientId);

      if (newMessage && this.activeState) {
        // Map DBMessage to AppMessage (Zod type)
        const messageForState: Message = {
          // id: newMessage.id,
          // characterId: newMessage.characterId,
          character: newMessage.characterId,
          content: newMessage.content,
          recipient: newMessage.recipient,
          thoughts: newMessage.thoughts ?? '', // Provide default empty string here for Zod validation
          mood: newMessage.mood,
          moodEmoji: newMessage.moodEmoji,
          reactionOnPrevious: newMessage.reactionOnPrevious,
          timestamp: newMessage.timestamp.getTime(),
          unixTimestamp: newMessage.timestamp.getTime(),
          calculatedSpeakingTime: newMessage.calculatedSpeakingTime,
          conversationRating: newMessage.conversationRating,
          endConversation: newMessage.endConversation ?? false,
          // modelUsed: newMessage.modelUsed,
          // tokenCount: newMessage.tokenCount,
          // cost: newMessage.cost,
        };
        // Validate the mapped object before pushing
        const parsedMessage = MessageSchema.safeParse(messageForState);
        if (parsedMessage.success) {
          this.activeState.messages.push(parsedMessage.data);
          await this.emitStateUpdate();
        } else {
          this.logger.error('Mapped message failed Zod validation', parsedMessage.error.flatten());
        }
      } else {
        this.logger.error(`Failed to generate or save message for ${nextSpeakerId}`);
        // Optionally try again or stop the loop?
      }

      if (!this.activeState?.conversation_active || this.activeState?.conversation_ended) return; // Re-check state after generation

      // 7. Handle end conversation requests
      await this._handle_end_conversation_requests();
    } catch (error) {
      this.logger.error('Error in conversation step', error);
      // Consider stopping the loop or implementing retry logic
      this.stopConversationLoop();
    }
  }
}
