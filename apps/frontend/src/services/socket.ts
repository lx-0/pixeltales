import { API_BASE_URL, DEBUG_WEBSOCKET } from '@/config';
import { LOGGER_CONTEXT_SHORTEN } from '@/lib/logger';
import { AgentDebugEventBroadcast } from '@pixeltales/contracts';
import { Logger } from '@yesterday-ai/logger-frontend';
import { io, Socket } from 'socket.io-client';

// EventData type for the Debug Gateway
type DebugEventData = {
  agent_event: AgentDebugEventBroadcast; // Use contract type
  connection_ack: { message: string }; // Ack from gateway
  messageAck: { received: unknown }; // Ack for messages sent TO gateway
  connect: void;
  disconnect: string; // Disconnect reason is a string
  connect_error: Error;
};

// Type for debug socket
interface DebugSocket {
  checkHealth: () => {
    connected: boolean;
    socketId: string | null;
    lastData: unknown;
    listeners: Record<string, number>;
  };
  forceReconnect: () => void;
  instance: SocketService;
}

// Extend window interface
declare global {
  interface Window {
    debugSocket: DebugSocket;
  }
}

class SocketService {
  private static instance: SocketService;
  private socket: Socket | null = null;
  private listeners: Map<keyof DebugEventData, Set<(data: unknown) => void>> = new Map();
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 5;
  private readonly RECONNECT_DELAY = 3000; // Increase slightly
  private isConnecting = false;
  private lastReceivedData: AgentDebugEventBroadcast | null = null; // Use contract type
  private loggerContext = LOGGER_CONTEXT_SHORTEN ? '📡-D' : 'DebugSocketService'; // Use correct name

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
      Logger.info(this.loggerContext, 'Debug socket already connected/connecting');
      return;
    }
    this.isConnecting = true;
    Logger.info(this.loggerContext, 'Attempting debug socket connection...');

    // In production, use relative path to ensure connection goes through nginx
    const url = process.env.NODE_ENV === 'production' ? undefined : API_BASE_URL;
    const debugNamespaceUrl = `${url}/debug`; // Connect to the /debug namespace
    Logger.info(this.loggerContext, `Connecting to: ${debugNamespaceUrl}`);

    this.socket = io(debugNamespaceUrl, {
      path: '/socket.io', // Standard path
      transports: ['websocket'], // Prefer websocket
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: this.MAX_RECONNECT_ATTEMPTS,
      reconnectionDelay: this.RECONNECT_DELAY,
      timeout: 10000,
    });

    // Remove existing listeners before adding new ones to prevent duplicates on reconnect
    this.socket.off();
    this.setupDebugListeners(); // Re-setup base listeners

    // --- Standard Connection Listeners ---
    this.socket.on('connect', () => {
      Logger.info(this.loggerContext, `🟢 Connected to Debug Gateway with ID: ${this.socket?.id}`);
      this.reconnectAttempts = 0;
      this.isConnecting = false;
      // Don't notify general 'connect' listeners, use 'connection_ack' instead
    });

    this.socket.on('connect_error', (error) => {
      Logger.error(this.loggerContext, `🔴 Debug Connection error: ${error.message}`);
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
      Logger.info(this.loggerContext, `🔴 Disconnected from Debug Gateway. Reason: ${reason}`);
      this.isConnecting = false;
      this.notifyListeners('disconnect', reason); // Pass reason string
      if (reason === 'io server disconnect') {
        Logger.info(
          this.constructor.name,
          'Server initiated disconnect, attempting to reconnect...',
        );
        this.socket?.connect();
      }
    });

    this.socket.on('error', (error) => {
      Logger.error(this.loggerContext, `🔴 Debug Socket error: ${error}`);
      this.isConnecting = false;
    });

    // --- Custom Event Listeners for Debug Gateway ---
    this.socket.on('connection_ack', (data: { message: string }) => {
      Logger.info(this.loggerContext, `🟢 Received connection ack: ${data.message}`);
      this.notifyListeners('connection_ack', data);
    });

    this.socket.on('agent_event', (data: AgentDebugEventBroadcast) => {
      // TODO: Add proper validation using a Zod schema if contracts define one
      Logger.info(this.loggerContext, `📥 Received agent event: ${data.type}`);
      this.lastReceivedData = data; // Store last received data
      this.notifyListeners('agent_event', data);
    });

    this.socket.on('messageAck', (data: { received: unknown }) => {
      Logger.info(this.loggerContext, `Received message ack:`, data);
      this.notifyListeners('messageAck', data);
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
    lastData: AgentDebugEventBroadcast | null;
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

    Logger.info(this.loggerContext, '🔍 DEBUG SOCKET HEALTH CHECK:', health);
    return health;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnecting = false;
    }
  }

  addListener<K extends keyof DebugEventData>(
    event: K,
    callback: (data: DebugEventData[K]) => void,
  ): void {
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

  removeListener<K extends keyof DebugEventData>(
    event: K,
    callback: (data: DebugEventData[K]) => void,
  ): void {
    this.listeners.get(event)?.delete(callback as (data: unknown) => void);
    if (DEBUG_WEBSOCKET) {
      Logger.info(
        this.loggerContext,
        `➖ Removed listener for event "${String(event)}". Remaining: ${this.listeners.get(event)?.size}`,
      );
    }
  }

  private notifyListeners<K extends keyof DebugEventData>(event: K, data: DebugEventData[K]): void {
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

  // Method to send data TO the debug gateway (if needed)
  sendMessageToServer(eventName: string, payload: unknown): void {
    if (!this.socket || !this.socket.connected) {
      Logger.warn(this.loggerContext, 'Cannot send message, socket not connected.');
      return;
    }
    Logger.info(this.loggerContext, `📤 Sending [${eventName}] to server:`, { payload });
    this.socket.emit(eventName, payload);
  }

  // Debug method to force reconnection
  forceReconnect(): void {
    Logger.warn(this.loggerContext, '🔄 FORCE RECONNECTING SOCKET');
    this.disconnect();
    this.connect();
  }
}

// Export a singleton instance
export const debugSocketService = SocketService.getInstance();

// Add global debug access
if (typeof window !== 'undefined') {
  window.debugSocket = {
    checkHealth: () => debugSocketService.checkSocketHealth(),
    forceReconnect: () => debugSocketService.forceReconnect(),
    instance: debugSocketService,
  };
  Logger.info(
    LOGGER_CONTEXT_SHORTEN ? '📡-D' : 'DebugSocketService',
    '🛠️ Debug socket debugger available as window.debugSocket',
  );
}
