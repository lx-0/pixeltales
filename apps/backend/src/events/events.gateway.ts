import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { LOGGER_CONTEXT_SHORTEN } from '@yesterday-ai/logger-backend';
import { Server, Socket } from 'socket.io';

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
  constructor() {}

  afterInit(_server: Server) {
    this.logger.log(`🔌 WebSocket Gateway Initialized`);
    // Example: Register this gateway instance with the SceneManagerService (v1)
    // this.sceneManager.registerGateway(this);
    this.logger.log('Gateway registered with xyz');
  }

  handleConnection(client: Socket /*, ...args: any[] */) {
    const clientId = client.id;
    this.logger.log(`🌐 Client connected: ${clientId}`);

    // Example: Register visitor with SceneManager (v1)
    // this.sceneManager.addVisitor(clientId).catch((error) => {
    //   this.logger.error(error, `❌ Error adding visitor ${clientId}`);
    // });
    // // Immediately send current scene state to the new client
    // const currentState = this.sceneStateService.getCurrentState();
    // if (currentState) {
    //   this.logger.log(
    //     `Sending initial scene state to client: ${clientId}\n${SceneStateService.formatForLogging(currentState, this.sceneManager.getActiveVisitorsCount())}`,
    //   );

    //   client.emit('scene_state', currentState);
    // } else {
    //   this.logger.warn(
    //     `⚠️ Cannot send initial state to client ${clientId}: No current state available`,
    //   );
    // }
  }

  handleDisconnect(client: Socket) {
    const clientId = client.id;
    this.logger.log(`⛓️‍💥 Client disconnected: ${clientId}`);

    // Example: Remove visitor with SceneManager (v1)
    // this.sceneManager.removeVisitor(clientId).catch((error) => {
    //   this.logger.error(error, `❌ Error removing visitor ${clientId}`);
    // });
  }

  // Example: Handle explicit requests for scene state
  // // Handle explicit requests for scene state
  // @SubscribeMessage('requestSceneState')
  // handleRequestSceneState(client: Socket, _payload: any): void {
  //   this.logger.log(`Received explicit scene state request from client: ${client.id}`);

  //   this.logger.warn(`⚠️ Cannot fulfill scene state request: No current state available`);
  //   // Send empty state to avoid client hanging
  //   client.emit('scene_state', { characters: {}, messages: [] });
  // }
}
