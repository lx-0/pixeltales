import { Inject, Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { DomainEvent } from '@pixeltales/contracts'; // Import DomainEvent
import { Server, Socket } from 'socket.io'; // Use socket.io types
import { EVENT_BUS, IEventBus } from '../core/event-bus.interface';

// Configure the gateway (port, cors, etc.) - Adjust port/namespace as needed
@WebSocketGateway({
  namespace: 'debug', // Use a namespace for separation
  cors: {
    origin: '*', // Allow all origins for local dev, restrict in production!
  },
})
export class DebugGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(DebugGateway.name);

  @WebSocketServer()
  server!: Server; // Use ! for definite assignment assertion if init logic guarantees it

  constructor(@Inject(EVENT_BUS) private readonly eventBus: IEventBus) {}

  afterInit(server: Server) {
    this.logger.log(`Debug WebSocket Gateway Initialized on namespace 'debug'.`);
    // Subscribe to relevant events from the backend EventBus
    this.subscribeToAgentEvents();
  }

  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Debug Client connected: ${client.id}`);
    // Optional: Send initial state or confirmation
    client.emit('connection_ack', { message: 'Connected to Debug Gateway' });
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Debug Client disconnected: ${client.id}`);
  }

  private subscribeToAgentEvents(): void {
    // Explicitly list all specific event literals we want to forward
    const specificEventTypesToForward: DomainEvent['type'][] = [
      // Agent Lifecycle
      'agent.lifecycle.spawned',
      // Cognitive Cycle
      'agent.cognitive.cycle.phase_completed',
      'agent.cognitive.cycle.error',
      // State Changes
      'agent.state.dynamic.updated',
      'agent.state.self_model_updated',
      // Actions & Perceptions
      'perception.message',
      'perception.agent_moved',
      // Reflection & Learning
      'agent.reflection.completed',
      'learning.reward.recorded',
      'learning.policy.updated',
      // Simulation (Raw)
      'simulation.event.speech_occurred',
      'simulation.state.agent_moved',
    ];

    this.logger.log(
      `Subscribing DebugGateway to ${specificEventTypesToForward.length} specific event types...`,
    );

    specificEventTypesToForward.forEach((eventType) => {
      // Subscribe to each specific literal type
      this.eventBus.subscribe(eventType, (event: DomainEvent) => {
        // TODO: Add proper type validation/casting here based on event.type
        // Using DomainEvent directly is less safe than a dedicated broadcast schema.
        const broadcastPayload = {
          type: event.type,
          timestamp: event.timestamp,
          payload: event.payload, // Forwarding raw payload
          source: event.source,
        };
        this.server.emit('agent_event', broadcastPayload);
      });
    });
  }

  // Optional: Add a message handler if clients need to send messages TO the gateway
  @SubscribeMessage('messageToServer')
  handleMessage(client: Socket, payload: any): void {
    this.logger.log(`Received message from ${client.id}:`, payload);
    // Acknowledge receipt
    client.emit('messageAck', { received: payload });
  }
}
