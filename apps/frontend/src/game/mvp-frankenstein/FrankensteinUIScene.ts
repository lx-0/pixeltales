import { debugSocketService } from '@/services/socket'; // Import debug socket service
import { Logger } from '@/utils/logger';
import { AgentDebugEventBroadcast } from '@pixeltales/contracts'; // Use contract type
import { Scene } from 'phaser';
import { ConnectionManager } from '../managers/ConnectionManager'; // Import ConnectionManager

export class FrankensteinUIScene extends Scene {
  // Removed instance logger
  private debugText?: Phaser.GameObjects.Text; // For displaying raw data
  private connectionManager!: ConnectionManager; // Add manager instance

  constructor() {
    super({ key: 'FrankensteinUIScene', active: false }); // Start inactive, launched by main scene
  }

  create(): void {
    Logger.info(this.constructor.name, 'create() called');

    // Basic text display area for debug messages
    this.debugText = this.add
      .text(10, 10, 'Initializing Debug UI...\nConnecting to WebSocket...', {
        color: '#00ff00',
        fontSize: '16px',
        backgroundColor: '#00000099',
        padding: { x: 5, y: 3 },
      })
      .setScrollFactor(0)
      .setDepth(100);

    // Initialize ConnectionManager (will show connection status)
    this.connectionManager = new ConnectionManager(this);
    this.connectionManager.initialize();

    // Connect WebSocket
    this.connectWebSocket(); // Connection status handled by manager

    Logger.info(this.constructor.name, 'FrankensteinUIScene created.');
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
  }

  private connectWebSocket(): void {
    Logger.info(this.constructor.name, 'Initiating Debug WebSocket connection...');
    debugSocketService.connect();

    // Add listener for agent events to forward them to the main scene
    debugSocketService.addListener('agent_event', this.handleAgentEvent);
  }

  // Use the correct contract type
  private handleAgentEvent = (data: AgentDebugEventBroadcast): void => {
    Logger.debug(this.constructor.name, 'Received agent event for UI:', { eventData: data });

    // --- Update local debug text ---
    const currentText = this.debugText?.text ?? 'WebSocket Connected...'; // Start fresh after connection
    const timestamp = data?.timestamp
      ? new Date(data.timestamp).toLocaleTimeString()
      : 'unknown time';
    const payloadStr = JSON.stringify(data?.payload ?? {}, null, 2); // Pretty print payload
    const newText = `${currentText}\n[${timestamp}] ${data?.type ?? 'unknown'}: ${payloadStr}`
      .split('\n')
      .slice(-10) // Show fewer lines to prevent overflow
      .join('\n');
    this.debugText?.setText(newText);

    // --- Emit event to the main scene (FrankensteinScene) ---
    try {
      const mainScene = this.scene.get('FrankensteinScene');
      if (mainScene) {
        // TODO: Define a more specific event name and structure if needed
        mainScene.events.emit('agentStateUpdate', data);
        Logger.debug(this.constructor.name, 'Emitted agentStateUpdate to FrankensteinScene');
      } else {
        Logger.warn(this.constructor.name, 'Could not find FrankensteinScene to emit event to.');
      }
    } catch (error) {
      Logger.error(this.constructor.name, 'Error emitting event to main scene:', error);
    }
  };

  private disconnectWebSocket(): void {
    Logger.info(this.constructor.name, 'Disconnecting Debug WebSocket...');
    // We don't necessarily disconnect the shared service here, just remove listeners
  }

  // Phaser scene lifecycle method for cleanup
  shutdown() {
    Logger.info(this.constructor.name, 'Handling scene shutdown...');
    this.disconnectWebSocket(); // Remove listeners specific to this scene
    this.connectionManager?.destroy(); // Destroy manager (removes its listeners)
    this.debugText?.destroy();
  }

  override update(time: number, delta: number): void {
    // UI update logic if needed
  }
}
