/**
 * Scene-related types — re-exported from the generated OpenAPI schema so the
 * frontend has one source of truth. Touch the backend models, run
 * `pnpm codegen`, and consumers see the change automatically.
 *
 * `Direction` and `CharacterAction` aren't extracted as standalone schemas by
 * openapi-typescript (they're inline Literal unions on Pydantic fields), so we
 * pull them out via indexed access into the generated types — still no manual
 * duplication.
 */

import type { Schemas } from '@/api/client';

export type Position = Schemas['Position'];
export type Message = Schemas['Message'];
export type LLMConfig = Schemas['LLMConfig'];
export type CharacterState = Schemas['CharacterState'];
export type CharacterConfig = Schemas['CharacterConfig'];
export type SceneState = Schemas['SceneState'];
export type SceneConfig = Schemas['SceneConfig'];

export type Direction = Schemas['CharacterState']['direction'];
export type CharacterAction = Schemas['CharacterState']['action'];
