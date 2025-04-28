import { debugSocketService } from '@/services/socket'; // Import debug socket service
import { AgentDebugEventBroadcast } from '@pixeltales/contracts'; // Use contract type
import { Logger } from '@yesterday-ai/logger-frontend';
import { Scene } from 'phaser';
import { ConnectionManager } from '../managers/ConnectionManager'; // Import ConnectionManager

export class FrankensteinUIScene extends Scene {
  private debugText?: Phaser.GameObjects.Text;
  private connectionManager!: ConnectionManager;
  private firstEventReceived = false; // Flag to track if first agent event came in

  constructor() {
    super({ key: 'FrankensteinUIScene', active: false });
  }

  create(): void {
    Logger.info(this.constructor.name, 'create() called');

    // Basic text display area - Start with just initializing text
    this.debugText = this.add
      .text(10, 10, 'Initializing Debug UI...', {
        // Remove connection status
        color: '#00ff00',
        fontSize: '16px',
        backgroundColor: '#00000099',
        padding: { x: 5, y: 3 },
        wordWrap: { width: this.cameras.main.width - 20 }, // Add word wrap
      })
      .setScrollFactor(0)
      .setDepth(100);

    // Initialize ConnectionManager
    this.connectionManager = new ConnectionManager(this);
    this.connectionManager.initialize();

    // Connect WebSocket
    this.connectWebSocket();

    // Listen for status updates from ConnectionManager
    this.events.on('connectionStatusUpdate', this.handleConnectionStatusUpdate, this);

    Logger.info(this.constructor.name, 'FrankensteinUIScene created.');
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
  }

  private connectWebSocket(): void {
    Logger.info(this.constructor.name, 'Initiating Debug WebSocket connection...');
    debugSocketService.connect();

    // Add listener for agent events
    debugSocketService.addListener('agent_event', this.handleAgentEvent);
  }

  // New handler for connection status updates
  private handleConnectionStatusUpdate = (status: string): void => {
    if (!this.firstEventReceived) {
      // Only update text if no agent events have been received yet
      this.debugText?.setText(status); // Display the connection status
    }
  };

  // Use the correct contract type
  private handleAgentEvent = (data: AgentDebugEventBroadcast): void => {
    Logger.debug(this.constructor.name, 'Received agent event for UI:', { eventData: data });

    const timestamp = data?.timestamp
      ? new Date(data.timestamp).toLocaleTimeString()
      : 'unknown time';
    const payloadStr = JSON.stringify(data?.payload ?? {}, null, 2); // Pretty print payload
    const eventLine = `[${timestamp}] ${data?.type ?? 'unknown'}: ${payloadStr}`;

    if (!this.firstEventReceived) {
      // First event: Clear any connection status and display the event
      this.debugText?.setText(eventLine);
      this.firstEventReceived = true;
    } else {
      // Subsequent events: Append to the log
      const currentText = this.debugText?.text ?? '';
      const newText = `${currentText}\n${eventLine}`.split('\n').slice(-10).join('\n');
      this.debugText?.setText(newText);
    }
  };

  private disconnectWebSocket(): void {
    Logger.info(this.constructor.name, 'Disconnecting Debug WebSocket...');
    // Remove specific listener when scene shuts down
    debugSocketService.removeListener('agent_event', this.handleAgentEvent);
  }

  // Phaser scene lifecycle method for cleanup
  shutdown() {
    Logger.info(this.constructor.name, 'Handling scene shutdown...');
    this.events.off('connectionStatusUpdate', this.handleConnectionStatusUpdate, this); // Remove listener
    this.disconnectWebSocket(); // Remove socket listeners
    this.connectionManager?.destroy(); // Destroy manager (removes its listeners)
    this.debugText?.destroy();
  }

  override update(_time: number, _delta: number): void {
    // UI update logic if needed
  }
}
