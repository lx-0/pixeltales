import { Injectable } from '@nestjs/common';
import { SceneConfig, SceneStateSnapshot } from '@pixeltales/contracts';
import { PinoLogger } from 'nestjs-pino';
import { SceneStateService } from '../../scene/scene-state/scene-state.service';

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
  async handleEndConversationRequests(sceneState: SceneStateSnapshot): Promise<boolean> {
    if (!sceneState?.characters) return false;
    const now = Date.now();
    let allAgreed = true;
    let changed = false;
    const characters = sceneState.characters;

    for (const charId in characters) {
      const char = characters[charId];
      if (!char) continue;
      const requestedAt =
        typeof char.endConversationRequestedAt === 'number'
          ? char.endConversationRequestedAt
          : null;
      const validityDuration =
        typeof char.endConversationRequestedValidityDuration === 'number'
          ? char.endConversationRequestedValidityDuration
          : null;

      if (char.endConversationRequested && requestedAt !== null && validityDuration !== null) {
        if (now > requestedAt + validityDuration * 1000) {
          this.logger.info(`End request for ${charId} expired.`);
          await this.sceneStateService.updateCharacterState(charId, {
            endConversationRequested: false,
            endConversationRequestedAt: undefined,
            endConversationRequestedValidityDuration: undefined,
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
      await this.sceneStateService.updateState({
        conversationActive: false,
        conversationEnded: true,
        endedAt: new Date(),
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
   * @returns The ID of the next speaker, or undefined if it cannot be determined
   */
  getNextSpeaker(sceneState: SceneStateSnapshot, sceneConfig: SceneConfig): string | undefined {
    if (!sceneState || !sceneConfig) return;

    if (!sceneState.messages || sceneState.messages.length === 0) {
      return sceneConfig.startCharacterId;
    }
    const lastMessage = sceneState.messages?.[sceneState.messages.length - 1];
    if (!lastMessage) return this.getOtherCharacterId(sceneState, sceneConfig.startCharacterId);
    return this.getOtherCharacterId(sceneState, lastMessage.character);
  }

  /**
   * Gets a character ID that is different from the given character ID
   * If there are multiple other characters, one will be chosen randomly
   *
   * @param sceneState The current scene state
   * @param characterId The character ID to exclude
   * @returns The ID of another character, or undefined if there are no other characters
   */
  getOtherCharacterId(sceneState: SceneStateSnapshot, characterId: string): string | undefined {
    const allIds = Object.keys(sceneState.characters);
    const otherIds = allIds.filter((id) => id !== characterId);
    if (otherIds.length === 0) return;
    const chosenId = otherIds[Math.floor(Math.random() * otherIds.length)];
    return chosenId;
  }
}
