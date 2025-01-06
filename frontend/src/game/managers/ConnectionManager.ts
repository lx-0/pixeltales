import { Scene } from 'phaser';
import { socketService } from '../../services/socket';

export class ConnectionManager {
  private connectionStatus!: Phaser.GameObjects.Text;
  private isConnected: boolean = false;
  private reconnectAttempt: number = 0;
  private scene: Scene;

  constructor(scene: Scene) {
    this.scene = scene;
  }

  initialize(): void {
    // Create connection status indicator
    this.connectionStatus = this.scene.add.text(10, 10, '', {
      fontSize: '12px',
      color: '#ffffff',
      backgroundColor: '#333333',
      padding: { x: 8, y: 4 },
    });
    this.connectionStatus.setDepth(1000);

    // Set up event listeners
    this.setupEventListeners();

    // Initial status update
    this.updateConnectionStatus();
  }

  private setupEventListeners(): void {
    // Listen for connection events
    socketService.addListener('connect', this.onConnect);
    socketService.addListener('disconnect', this.onDisconnect);
    socketService.addListener('connect_error', this.onConnectError);
  }

  private readonly onConnect = () => {
    this.isConnected = true;
    this.reconnectAttempt = 0;
    this.updateConnectionStatus();
  };

  private readonly onDisconnect = () => {
    this.isConnected = false;
    this.updateConnectionStatus();
  };

  private readonly onConnectError = () => {
    this.reconnectAttempt++;
    this.updateConnectionStatus();
  };

  private updateConnectionStatus(): void {
    if (this.isConnected) {
      this.connectionStatus.setText('🟢 Connected');
      this.connectionStatus.setBackgroundColor('#28a745');
    } else if (this.reconnectAttempt > 0) {
      this.connectionStatus.setText(
        `🟡 Reconnecting (${this.reconnectAttempt}/5)...`,
      );
      this.connectionStatus.setBackgroundColor('#ffc107');
    } else {
      this.connectionStatus.setText('🔴 Disconnected');
      this.connectionStatus.setBackgroundColor('#dc3545');
    }

    // Position in top-right corner with padding
    this.connectionStatus.setPosition(
      this.scene.cameras.main.width - this.connectionStatus.width - 10,
      10,
    );

    // Fade out after 3 seconds if connected
    if (this.isConnected) {
      this.scene.tweens.add({
        targets: this.connectionStatus,
        alpha: 0,
        duration: 1000,
        delay: 3000,
        ease: 'Power2',
      });
    } else {
      this.connectionStatus.setAlpha(1);
    }
  }

  destroy(): void {
    socketService.removeListener('connect', this.onConnect);
    socketService.removeListener('disconnect', this.onDisconnect);
    socketService.removeListener('connect_error', this.onConnectError);
    this.connectionStatus.destroy();
  }
}
