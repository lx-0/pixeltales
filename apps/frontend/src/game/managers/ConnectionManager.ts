import { debugSocketService } from '@/services/socket';
import { Scene } from 'phaser';

export class ConnectionManager {
  private isConnected: boolean = false;
  private reconnectAttempt: number = 0;
  private scene: Scene;

  constructor(scene: Scene) {
    this.scene = scene;
  }

  initialize(): void {
    // Set up event listeners
    this.setupEventListeners();

    // Check initial connection status immediately after listeners are set up
    const health = debugSocketService.checkSocketHealth();
    this.isConnected = health.connected;
    this.reconnectAttempt = 0; // Reset attempts on initial check
    this.emitConnectionStatus(); // Emit initial status
  }

  private setupEventListeners(): void {
    // Listen for connection events
    // Purpose: Emit status updates based on socket lifecycle.
    debugSocketService.addListener('connect', this.onConnect);
    debugSocketService.addListener('disconnect', this.onDisconnect);
    debugSocketService.addListener('connect_error', this.onConnectError);
  }

  private readonly onConnect = () => {
    this.isConnected = true;
    this.reconnectAttempt = 0;
    this.emitConnectionStatus();
  };

  private readonly onDisconnect = () => {
    this.isConnected = false;
    this.emitConnectionStatus();
  };

  private readonly onConnectError = () => {
    this.reconnectAttempt++;
    this.emitConnectionStatus();
  };

  private emitConnectionStatus(): void {
    let statusString = '';
    if (this.isConnected) {
      statusString = '🟢 Connected';
    } else if (this.reconnectAttempt > 0) {
      statusString = `🟡 Reconnecting (${this.reconnectAttempt}/5)...`;
    } else {
      statusString = '🔴 Disconnected';
    }
    // Emit event via scene's emitter
    this.scene.events.emit('connectionStatusUpdate', statusString);
  }

  destroy(): void {
    debugSocketService.removeListener('connect', this.onConnect);
    debugSocketService.removeListener('disconnect', this.onDisconnect);
    debugSocketService.removeListener('connect_error', this.onConnectError);
  }
}
