import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SceneManagerService } from '../scene/scene-manager/scene-manager.service';

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

  private readonly logger = new Logger(EventsGateway.name);

  // TODO: Inject SceneManagerService later
  constructor(private readonly sceneManager: SceneManagerService) {}

  afterInit(_server: Server) {
    this.logger.log('WebSocket Gateway Initialized 🔌');
    // Maybe pass server instance to scene manager if needed?
    // this.sceneManager.setServer(server);
  }

  handleConnection(client: Socket /*, ...args: any[] */) {
    const clientId = client.id;
    this.logger.log(`Client connected: ${clientId}`);
    this.sceneManager.addVisitor(clientId);
  }

  handleDisconnect(client: Socket) {
    const clientId = client.id;
    this.logger.log(`Client disconnected: ${clientId}`);
    this.sceneManager.removeVisitor(clientId);
  }

  // Example message handler
  @SubscribeMessage('messageToServer')
  handleMessage(client: Socket, payload: any): string {
    this.logger.debug(`[${client.id}] Received messageToServer:`, payload);
    // Example: Echo back or broadcast
    this.server.to(client.id).emit('messageToClient', `Server received: ${payload}`);
    return 'Acknowledged!'; // Acknowledgement
  }
}
