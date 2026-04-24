import { io, type Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '@/api/socket-events';
import type { SceneState } from '@/types/scene';
import { Logger } from '../utils/logger';

type EventData = {
  scene_state: SceneState;
  connect: undefined;
  disconnect: undefined;
  connect_error: Error;
};

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

class SocketService {
  private static instance: SocketService;
  private socket: TypedSocket | null = null;
  private listeners: Map<keyof EventData, Set<(data: unknown) => void>> = new Map();
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 5;
  private readonly RECONNECT_DELAY = 2000; // 2 seconds
  private isConnecting = false;

  private constructor() {
    // Private constructor to enforce singleton
  }

  public static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  connect(): void {
    if (this.socket?.connected || this.isConnecting) {
      Logger.info(
        this.constructor.name,
        'Socket already connected or connecting, skipping connection attempt'
      );
      return;
    }

    this.isConnecting = true;
    Logger.info(this.constructor.name, 'Attempting to connect to socket server...');

    // In production, use relative path to ensure connection goes through nginx
    const url =
      process.env.NODE_ENV === 'production' ? undefined : import.meta.env.VITE_BACKEND_URL;

    this.socket = io(url, {
      path: '/socket.io',
      transports: ['polling', 'websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: this.MAX_RECONNECT_ATTEMPTS,
      reconnectionDelay: this.RECONNECT_DELAY,
      timeout: 10000,
    });

    this.socket.on('connect', () => {
      Logger.info(this.constructor.name, `Connected to server with ID: ${this.socket?.id}`);
      this.reconnectAttempts = 0;
      this.isConnecting = false;
      this.notifyListeners('connect', undefined);
    });

    this.socket.on('connect_error', (error) => {
      Logger.error(this.constructor.name, `Connection error: ${error.message}`);
      this.reconnectAttempts++;
      this.notifyListeners('connect_error', error);

      if (this.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
        Logger.error(
          this.constructor.name,
          'Max reconnection attempts reached, stopping reconnection'
        );
        this.disconnect();
      } else {
        Logger.info(
          this.constructor.name,
          `Reconnection attempt ${this.reconnectAttempts} of ${this.MAX_RECONNECT_ATTEMPTS}`
        );
      }
    });

    this.socket.on('disconnect', (reason) => {
      Logger.info(this.constructor.name, `Disconnected from server. Reason: ${reason}`);
      this.isConnecting = false;
      this.notifyListeners('disconnect', undefined);
      if (reason === 'io server disconnect') {
        Logger.info(
          this.constructor.name,
          'Server initiated disconnect, attempting to reconnect...'
        );
        this.socket?.connect();
      }
    });

    this.socket.on('scene_state', (state) => {
      Logger.info(this.constructor.name, 'Received scene state update');
      // Bridge: generated SceneState has all fields optional (Pydantic
      // fields with defaults), the in-app SceneState marks them required
      // because the server always populates them. Safe at runtime.
      this.notifyListeners('scene_state', state as unknown as SceneState);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnecting = false;
    }
  }

  addListener<K extends keyof EventData>(event: K, callback: (data: EventData[K]) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback as (data: unknown) => void);
  }

  removeListener<K extends keyof EventData>(
    event: K,
    callback: (data: EventData[K]) => void
  ): void {
    this.listeners.get(event)?.delete(callback as (data: unknown) => void);
  }

  private notifyListeners<K extends keyof EventData>(event: K, data: EventData[K]): void {
    this.listeners.get(event)?.forEach((callback) => callback(data));
  }
}

// Export a singleton instance
export const socketService = SocketService.getInstance();
