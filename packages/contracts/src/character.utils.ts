import {
  CharacterConfig,
  CharacterState,
  CharacterStateSchema,
  NewCharacterState,
} from '@pixeltales/database';

export class CharacterUtils {
  static initializeStateFromConfig(
    config: CharacterConfig,
    createdAt: number = Date.now(),
  ): CharacterState {
    const newCharState: NewCharacterState = {
      ...config,
      position: config.initialPosition,
      direction: config.initialDirection,
      action: config.initialAction,
      actionStartedAt: createdAt,
      currentMood: config.initialMood,
    };
    return CharacterStateSchema.parse(newCharState);
  }
}
