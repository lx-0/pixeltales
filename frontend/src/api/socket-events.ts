import type { Schemas } from './client';

/**
 * Catalog of Socket.IO events. Backend defines the shapes via Pydantic
 * (app/api/endpoints/socket_events.py); we consume them through the
 * generated types — single source of truth.
 */
export type ServerToClientEvents = {
  scene_state: (state: Schemas['SceneState']) => void;
};

// No client-emitted events yet. Add handlers here when the backend's
// `ClientToServerEvents` Pydantic model gains its first field; the
// `Record<never, never>` placeholder keeps `Socket<…>` typing happy
// without using the banned `{}` empty-object type.
export type ClientToServerEvents = Record<never, never>;

export type SceneState = Schemas['SceneState'];
