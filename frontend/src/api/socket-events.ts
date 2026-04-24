import type { Schemas } from './client';

/**
 * Catalog of Socket.IO events. Backend defines the shapes via Pydantic
 * (app/api/endpoints/socket_events.py); we consume them through the
 * generated types — single source of truth.
 */
export type ServerToClientEvents = {
  scene_state: (state: Schemas['SceneState']) => void;
};

export type ClientToServerEvents = {
  // No client-emitted events yet. Add as Pydantic models in
  // backend's ClientToServerEvents and regen.
};

export type SceneState = Schemas['SceneState'];
