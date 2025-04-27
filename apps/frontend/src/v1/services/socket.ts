import { API_BASE_URL, DEBUG_WEBSOCKET } from '@/config';
import { LOGGER_CONTEXT_SHORTEN } from '@/lib/logger';
import { Logger } from '@/utils/logger';
import { SceneStateSnapshotSchema, type SceneStateSnapshot } from '@pixeltales/contracts';
import { io, Socket } from 'socket.io-client';

type EventData = {
  scene_state: SceneStateSnapshot;
  connect: void;
  disconnect: void;
  connect_error: Error;
};

// Type for debug socket
interface DebugSocketV1 {
  checkHealth: () => {
    connected: boolean;
    socketId: string | null;
    lastData: unknown;
    listeners: Record<string, number>;
  };
  forceReconnect: () => void;
  instance: SocketV1Service;
}

// Extend window interface
declare global {
  interface Window {
    debugSocketV1: DebugSocketV1;
  }
}

class SocketV1Service {
  private static instance: SocketV1Service;
  private socket: Socket | null = null;
  private listeners: Map<keyof EventData, Set<(data: unknown) => void>> = new Map();
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 5;
  private readonly RECONNECT_DELAY = 2000; // 2 seconds
  private isConnecting = false;
  private lastReceivedData: SceneStateSnapshot | null = null; // Store last received data for debugging
  private loggerContext = LOGGER_CONTEXT_SHORTEN ? '📡' : this.constructor.name;

  private constructor() {
    // Private constructor to enforce singleton
  }

  public static getInstance(): SocketV1Service {
    if (!SocketV1Service.instance) {
      SocketV1Service.instance = new SocketV1Service();
    }
    return SocketV1Service.instance;
  }

  connect(): void {
    if (this.socket?.connected || this.isConnecting) {
      Logger.info(
        this.loggerContext,
        'Socket already connected or connecting, skipping connection attempt',
      );
      return;
    }

    this.isConnecting = true;
    Logger.info(this.loggerContext, 'Attempting to connect to socket server...');

    // In production, use relative path to ensure connection goes through nginx
    const url = process.env.NODE_ENV === 'production' ? undefined : API_BASE_URL;

    this.socket = io(url, {
      path: '/socket.io',
      transports: ['polling', 'websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: this.MAX_RECONNECT_ATTEMPTS,
      reconnectionDelay: this.RECONNECT_DELAY,
      timeout: 10000,
    });

    // Debug all socket events
    this.setupDebugListeners();

    this.socket.on('connect', () => {
      // Internal listener: Handles raw connect event from Socket.IO
      // Updates internal state and notifies application listeners.
      Logger.info(this.loggerContext, `Connected to server with ID: ${this.socket?.id}`);
      Logger.info(this.loggerContext, '🟢 SOCKET CONNECTED:', { sid: this.socket?.id });

      this.reconnectAttempts = 0;
      this.isConnecting = false;
      this.notifyListeners('connect', undefined);
    });

    this.socket.on('connect_error', (error) => {
      // Internal listener: Handles raw connection error from Socket.IO
      // Manages reconnect attempts and notifies application listeners.
      Logger.error(this.loggerContext, `Connection error: ${error.message}`);
      Logger.error(this.loggerContext, '🔴 SOCKET CONNECTION ERROR:', {
        message: error.message,
      });

      this.reconnectAttempts++;
      this.notifyListeners('connect_error', error);

      if (this.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
        Logger.error(
          this.loggerContext,
          'Max reconnection attempts reached, stopping reconnection',
        );
        this.disconnect();
      } else {
        Logger.info(
          this.loggerContext,
          `Reconnection attempt ${this.reconnectAttempts} of ${this.MAX_RECONNECT_ATTEMPTS}`,
        );
      }
    });

    this.socket.on('disconnect', (reason) => {
      // Internal listener: Handles raw disconnect event from Socket.IO
      // Updates internal state and notifies application listeners.
      Logger.info(this.loggerContext, `Disconnected from server. Reason: ${reason}`);
      Logger.warn(this.loggerContext, '🔴 SOCKET DISCONNECTED:', { reason });

      this.isConnecting = false;
      this.notifyListeners('disconnect', undefined);
      if (reason === 'io server disconnect') {
        Logger.info(
          this.constructor.name,
          'Server initiated disconnect, attempting to reconnect...',
        );
        this.socket?.connect();
      }
    });

    this.socket.on('error', (error) => {
      // Internal listener: Handles generic socket errors.
      Logger.error(this.loggerContext, `Socket error: ${error}`);
      Logger.error(this.loggerContext, '🔴 SOCKET ERROR:', error);
      this.isConnecting = false;
    });

    this.socket.on('scene_state', (stateUnparsed: SceneStateSnapshot) => {
      const result = SceneStateSnapshotSchema.safeParse(stateUnparsed);
      if (!result.success) {
        Logger.error(this.loggerContext, '🔴 SOCKET ERROR:', result.error);
        return;
      }
      const state = result.data;

      // Internal listener: Handles raw 'scene_state' event from Socket.IO server.
      // Caches the data and notifies application listeners.
      Logger.info(this.loggerContext, '📥 Received scene state update');
      Logger.info(this.loggerContext, 'RECEIVED SCENE STATE:', {
        valid: state ? 'Valid data' : 'Empty data',
      });
      Logger.info(this.loggerContext, 'SCENE STATE CHARACTERS:', {
        count: state?.characters ? Object.keys(state.characters).length : 0,
      });
      if (state?.characters) {
        Logger.info(this.loggerContext, 'SCENE STATE CHARACTERS:', {
          count: Object.keys(state.characters).length,
        });
        Logger.info(this.loggerContext, 'SCENE STATE CHARACTERS TABLE:', {
          characters: Object.keys(state.characters).map((id) => ({
            id,
            name: state.characters[id]?.name,
            direction: state.characters[id]?.direction,
            action: state.characters[id]?.action,
            position: JSON.stringify(state.characters[id]?.position),
          })),
        });
      }

      this.lastReceivedData = state;
      this.notifyListeners('scene_state', state);
    });
  }

  // Debug helper to monitor all socket events
  private setupDebugListeners(): void {
    if (!this.socket) return;

    // These are standard Socket.IO client-side events.
    // They reflect the state of *this client's* connection to the server.
    // The backend gateway does NOT need explicit handlers for these; they are handled by the underlying Socket.IO library on both sides.
    // We listen to them here purely for client-side debugging/logging.
    const events = [
      'connect',
      'connect_error',
      'connect_timeout',
      'disconnect',
      'error',
      'reconnect',
      'reconnect_attempt',
      'reconnect_error',
      'reconnect_failed',
      'ping',
      'pong',
    ];

    events.forEach((event) => {
      this.socket?.on(event, (...args) => {
        Logger.info(this.loggerContext, `🧩 Socket event [${event}]:`, {
          args: args.length ? args : 'No data',
        });
      });
    });

    // Fix: Use a better approach to monitor all incoming events
    if (this.socket) {
      // Internal listener (DEBUG): Logs *all* incoming events for debugging.
      // Use onAny which is designed for this purpose
      this.socket.onAny((eventName, ...args) => {
        if (eventName && eventName !== 'ping' && eventName !== 'pong') {
          Logger.info(this.loggerContext, `📩 Socket received [${eventName}]:`, {
            data: args,
          });
        }
      });
    }
  }

  // Debug method to check socket health
  checkSocketHealth(): {
    connected: boolean;
    socketId: string | null;
    lastData: SceneStateSnapshot | null;
    listeners: Record<string, number>;
  } {
    const listenerCounts: Record<string, number> = {};
    this.listeners.forEach((value, key) => {
      listenerCounts[key as string] = value.size;
    });

    const health = {
      connected: !!this.socket?.connected,
      socketId: this.socket?.id || null,
      lastData: this.lastReceivedData,
      listeners: listenerCounts,
    };

    Logger.info(this.loggerContext, '🔍 SOCKET HEALTH CHECK:', health);
    return health;
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
    if (DEBUG_WEBSOCKET) {
      Logger.info(
        this.loggerContext,
        `➕ Added listener for event "${String(event)}". Total now: ${this.listeners.get(event)?.size}`,
      );
    }
  }

  removeListener<K extends keyof EventData>(
    event: K,
    callback: (data: EventData[K]) => void,
  ): void {
    this.listeners.get(event)?.delete(callback as (data: unknown) => void);
    if (DEBUG_WEBSOCKET) {
      Logger.info(
        this.loggerContext,
        `➖ Removed listener for event "${String(event)}". Remaining: ${this.listeners.get(event)?.size}`,
      );
    }
  }

  private notifyListeners<K extends keyof EventData>(event: K, data: EventData[K]): void {
    if (DEBUG_WEBSOCKET) {
      const count = this.listeners.get(event)?.size ?? 0;
      Logger.info(
        this.loggerContext,
        `🔔 Emitting event "${String(event)}" to ${count} listener(s)`,
        { event, data },
      );
    }
    this.listeners.get(event)?.forEach((callback) => callback(data));
  }

  // Debug method to force reconnection
  forceReconnect(): void {
    Logger.warn(this.loggerContext, '🔄 FORCE RECONNECTING SOCKET');
    this.disconnect();
    this.connect();
  }
}

// Export a singleton instance
export const socketV1Service = SocketV1Service.getInstance();

// Add global debug access
if (typeof window !== 'undefined') {
  window.debugSocketV1 = {
    checkHealth: () => socketV1Service.checkSocketHealth(),
    forceReconnect: () => socketV1Service.forceReconnect(),
    instance: socketV1Service,
  };
  Logger.info(
    LOGGER_CONTEXT_SHORTEN ? '📡' : SocketV1Service.name,
    '🛠️ Socket debugger available as window.debugSocket',
  );
}
