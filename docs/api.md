# API Reference

PixelTales uses WebSocket-based communication for real-time updates. The backend provides a Socket.IO server that handles all game state and character interactions.

## WebSocket Events

### Connection Events

#### Connect

```typescript
socket.on('connect', () => {
  console.log('Connected to server');
});
```

#### Disconnect

```typescript
socket.on('disconnect', (reason: string) => {
  console.log('Disconnected:', reason);
});
```

### Scene Events

#### Scene State Update

```typescript
socket.on('scene_state', (state: SceneState) => {
  // Handle scene state update
});

interface SceneState {
  characters: Record<string, CharacterState>;
  messages: Array<Message>;
  started_at: number;
  conversation_active: boolean;
  conversation_ended: boolean;
  ended_at: number | null;
  visitor_count: number;
}
```

#### Character State

```typescript
interface CharacterState {
  id: string;
  name: string;
  color: string;
  role: string;
  visual: string;
  llm_config: LLMConfig;
  position: Position;
  direction: Direction;
  current_mood: string;
  action: CharacterAction;
  action_started_at: number;
  action_estimated_duration: number | null;
  end_conversation_requested: boolean;
  end_conversation_requested_at: number | null;
  end_conversation_requested_validity_duration: number | null;
}
```

#### Message Format

```typescript
interface Message {
  character: string;
  content: string | null;
  recipient: string;
  thoughts: string;
  mood: string;
  mood_emoji: string;
  reaction_on_previous_message: string | null;
  timestamp: string;
  unix_timestamp: number;
  calculated_speaking_time: number;
  conversation_rating: number | null;
  end_conversation: boolean;
}
```

## Example Usage

### Connecting to WebSocket

```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:8000', {
  path: '/socket.io',
  transports: ['polling', 'websocket'],
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 2000,
  timeout: 10000,
});

socket.on('connect', () => {
  console.log('Connected to server');
});

socket.on('scene_state', (state: SceneState) => {
  console.log('Received scene state:', state);
});

socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
});
```

## Error Handling

### WebSocket Error Events

```typescript
socket.on('error', (error: Error) => {
  console.error('Socket error:', error);
});

socket.on('connect_error', (error: Error) => {
  console.error('Connection error:', error);
});
```

## Development Guidelines

1. **WebSocket Best Practices**
   - Implement heartbeat mechanism
   - Handle reconnection gracefully
   - Buffer messages during disconnection

2. **Response Format**
   - Use snake_case for JSON keys
   - Include timestamps in ISO 8601 format
   - Provide both string and numeric IDs

## API Changes

Changes to the API will be documented in the [CHANGELOG.md](../CHANGELOG.md) file.
