import {
  CharacterState,
  NewSceneStateSnapshot,
  Scene,
  SceneConfig,
  SceneStateSnapshot,
  SceneStateSnapshotSchema,
} from '@pixeltales/database';
import { CharacterUtils } from './character.utils';

export class SceneUtils {
  static initializeStateFromConfig(
    sceneConfig: SceneConfig,
    sceneId: Scene['id'],
    isActive: boolean = false,
    createdAt: Date = new Date(),
  ): Omit<SceneStateSnapshot, 'id'> {
    // initialize characters from config
    const characters: Record<string, CharacterState> = Object.fromEntries(
      Object.entries(sceneConfig.charactersConfig).map(([charId, config]) => {
        const characterState = CharacterUtils.initializeStateFromConfig(config);
        return [charId, characterState];
      }),
    );

    const newSceneStateSnapshot: NewSceneStateSnapshot = {
      timestamp: createdAt,
      sceneId,
      configId: sceneConfig.id,
      characters,
      startedAt: createdAt,
      conversationActive: isActive,
    };

    return SceneStateSnapshotSchema.parse(newSceneStateSnapshot);
  }
}
