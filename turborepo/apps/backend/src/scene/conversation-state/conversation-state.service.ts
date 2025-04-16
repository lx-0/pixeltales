import { Injectable } from '@nestjs/common';
import { SceneState } from '@pixeltales/contracts';
import { DBSceneConfig } from '@pixeltales/database';
import { PinoLogger } from 'nestjs-pino';
import { SceneStateService } from '../scene-state/scene-state.service';

@Injectable()
export class ConversationStateService {
  constructor(
    private readonly logger: PinoLogger,
    private readonly sceneStateService: SceneStateService,
  ) {
    this.logger.setContext(ConversationStateService.name);
  }

  /**
   * Handles end conversation requests from characters
   * If all characters have requested to end the conversation, the conversation will be ended
   * Expired end conversation requests will be cleared
   *
   * @param sceneState The current scene state
   * @returns True if state was changed, false otherwise
   */
  async handleEndConversationRequests(sceneState: SceneState): Promise<boolean> {
    if (!sceneState?.characters) return false;
    const now = Date.now();
    let allAgreed = true;
    let changed = false;
    const characters = sceneState.characters;

    for (const charId in characters) {
      const char = characters[charId];
      if (!char) continue;
      const requestedAt =
        typeof char.end_conversation_requested_at === 'number'
          ? char.end_conversation_requested_at
          : null;
      const validityDuration =
        typeof char.end_conversation_requested_validity_duration === 'number'
          ? char.end_conversation_requested_validity_duration
          : null;

      if (char.end_conversation_requested && requestedAt !== null && validityDuration !== null) {
        if (now > requestedAt + validityDuration * 1000) {
          this.logger.info(`End request for ${charId} expired.`);
          this.sceneStateService.updateCharacterState(charId, {
            end_conversation_requested: false,
            end_conversation_requested_at: undefined,
            end_conversation_requested_validity_duration: undefined,
          });
          changed = true;
          allAgreed = false;
        }
      } else {
        allAgreed = false;
      }
    }

    if (allAgreed && Object.keys(characters).length > 0) {
      this.logger.info('All characters agreed to end conversation.');
      this.sceneStateService.updateState({
        conversation_active: false,
        conversation_ended: true,
        ended_at: Date.now(),
      });
      changed = true;
    }

    return changed;
  }

  /**
   * Determines the next speaker in the conversation
   * If there are no messages yet, returns the start character
   * Otherwise, returns a character other than the last speaker
   *
   * @param sceneState The current scene state
   * @param sceneConfig The scene configuration
   * @returns The ID of the next speaker, or null if it cannot be determined
   */
  getNextSpeaker(sceneState: SceneState, sceneConfig: DBSceneConfig): string | null {
    if (!sceneState || !sceneConfig) return null;

    if (!sceneState.messages || sceneState.messages.length === 0) {
      return sceneConfig.config.start_character_id;
    }
    const lastMessage = sceneState.messages?.[sceneState.messages.length - 1];
    if (!lastMessage)
      return this.getOtherCharacterId(sceneState, sceneConfig.config.start_character_id);
    return this.getOtherCharacterId(sceneState, lastMessage.character);
  }

  /**
   * Gets a character ID that is different from the given character ID
   * If there are multiple other characters, one will be chosen randomly
   *
   * @param sceneState The current scene state
   * @param characterId The character ID to exclude
   * @returns The ID of another character, or null if there are no other characters
   */
  getOtherCharacterId(sceneState: SceneState, characterId: string): string | null {
    if (!sceneState) return null;
    const allIds = Object.keys(sceneState.characters);
    const otherIds = allIds.filter((id) => id !== characterId);
    if (otherIds.length === 0) return null;
    const chosenId = otherIds[Math.floor(Math.random() * otherIds.length)];
    return chosenId ?? null;
  }
}
