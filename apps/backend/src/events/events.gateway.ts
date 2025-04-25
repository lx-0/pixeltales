import { Inject, Logger, forwardRef } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { SceneStateSnapshot, SceneStateSnapshotSchema } from '@pixeltales/contracts';
import { Server, Socket } from 'socket.io';
import { LOGGER_CONTEXT_SHORTEN } from '../common/logger/logger.const';

// TODO: Decouple from V1
import { SceneManagerService } from '../v1/scene/scene-manager/scene-manager.service';
import { SceneStateService } from '../v1/scene/scene-state/scene-state.service';

// Configure gateway options (e.g., CORS)
@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGINS?.split(',') ?? '*', // Use env var or allow all
    methods: ['GET', 'POST'],
    credentials: true,
  },
})
export class EventsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server; // Use definite assignment assertion

  private readonly logger = new Logger(LOGGER_CONTEXT_SHORTEN ? '📡' : EventsGateway.name);

  // Inject SceneManagerService using forwardRef
  constructor(
    @Inject(forwardRef(() => SceneManagerService))
    private readonly sceneManager: SceneManagerService,
    private readonly sceneStateService: SceneStateService,
  ) {}

  afterInit(_server: Server) {
    this.logger.log(`🔌 WebSocket Gateway Initialized`);
    // Register this gateway instance with the SceneManagerService
    this.sceneManager.registerGateway(this);
    this.logger.log('Gateway registered with SceneManagerService');
  }

  handleConnection(client: Socket /*, ...args: any[] */) {
    const clientId = client.id;
    this.logger.log(`🌐 Client connected: ${clientId}`);

    // Register visitor with SceneManager
    this.sceneManager.addVisitor(clientId).catch((error) => {
      this.logger.error(error, `❌ Error adding visitor ${clientId}`);
    });

    // Immediately send current scene state to the new client
    const currentState = this.sceneStateService.getCurrentState();
    if (currentState) {
      this.logger.log(
        `Sending initial scene state to client: ${clientId}\n${SceneStateService.formatForLogging(currentState, this.sceneManager.getActiveVisitorsCount())}`,
      );

      client.emit('scene_state', currentState);
    } else {
      this.logger.warn(
        `⚠️ Cannot send initial state to client ${clientId}: No current state available`,
      );
    }
  }

  handleDisconnect(client: Socket) {
    const clientId = client.id;
    this.logger.log(`⛓️‍💥 Client disconnected: ${clientId}`);
    this.sceneManager.removeVisitor(clientId).catch((error) => {
      this.logger.error(error, `❌ Error removing visitor ${clientId}`);
    });
  }

  // Handle explicit requests for scene state
  @SubscribeMessage('requestSceneState')
  handleRequestSceneState(client: Socket, _payload: any): void {
    this.logger.log(`Received explicit scene state request from client: ${client.id}`);

    // Get current scene state
    const currentState = this.sceneStateService.getCurrentState();
    if (currentState) {
      this.logger.log(
        `📤 Re-sending current scene state to client: ${client.id}\n${SceneStateService.formatForLogging(currentState, this.sceneManager.getActiveVisitorsCount())}`,
      );

      client.emit('scene_state', currentState);
    } else {
      this.logger.warn(`⚠️ Cannot fulfill scene state request: No current state available`);
      // Send empty state to avoid client hanging
      client.emit('scene_state', { characters: {}, messages: [] });
    }
  }

  // Example message handler
  @SubscribeMessage('messageToServer')
  handleMessage(client: Socket, payload: any): string {
    this.logger.debug(`[${client.id}] 🌐➡️ Received messageToServer:`, payload);
    // Example: Echo back or broadcast
    this.server.to(client.id).emit('messageToClient', `Server received: ${payload}`);
    return 'Acknowledged!'; // Acknowledgement
  }

  // Public method for SceneManagerService to call for broadcasting state
  public broadcastSceneState(state: SceneStateSnapshot): void {
    try {
      // Validate before emitting (already done in SceneManager, but good practice)
      const validatedState = SceneStateSnapshotSchema.parse(state);
      this.logger.log(
        `📢 Broadcasting 'scene_state' update to all clients\n${SceneStateService.formatForLogging(state, this.sceneManager.getActiveVisitorsCount())}`,
      );
      this.server.emit('scene_state', validatedState);
    } catch (validationError) {
      this.logger.error(
        validationError,
        '❌ Failed validation in gateway before broadcasting scene_state:',
      );
    }
  }

  // Optional: A similar method for sending to a single client if needed
  public sendSceneStateToClient(clientId: string, state: SceneStateSnapshot): void {
    try {
      const validatedState = SceneStateSnapshotSchema.parse(state);
      this.logger.log(
        `📢 Sending 'scene_state' update to client: ${clientId}\n${SceneStateService.formatForLogging(state, this.sceneManager.getActiveVisitorsCount())}`,
      );
      this.server.to(clientId).emit('scene_state', validatedState);
    } catch (validationError) {
      this.logger.error(
        validationError,
        `❌ Failed validation in gateway before sending scene_state to ${clientId}:`,
      );
    }
  }
}
