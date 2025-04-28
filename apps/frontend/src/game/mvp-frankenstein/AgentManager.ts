import { TILE_SIZE } from '@/game/mvp-frankenstein/config';
import { Logger } from '@yesterday-ai/logger-frontend';
import { Scene } from 'phaser';

// TODO: Import AgentState from contracts when needed

interface AgentCharacter {
  id: string;
  // state: AgentState; // Add state later
  sprite: Phaser.GameObjects.Sprite;
}

/**
 * Manages agent characters driven by backend state.
 */
export class AgentManager {
  private agents: Map<string, AgentCharacter> = new Map();

  constructor(private scene: Scene) {}

  preload(): void {
    // Load agent spritesheets (e.g., Frankenstein)
    this.scene.load.spritesheet('frankenstein_sprite', '/assets/characters/Zombie_48x48.png', {
      frameWidth: 48,
      frameHeight: 96,
    });
  }

  create(): void {
    // Agent creation will likely be triggered by an event/state update
    // For MVP, we can pre-create Frankenstein
    this.createFrankensteinAgent('frankenstein-01');
  }

  private createFrankensteinAgent(agentId: string): void {
    if (this.agents.has(agentId)) return;

    Logger.info(AgentManager.name, `Creating agent sprite: ${agentId}`);

    // Create animations (similar to FrankensteinScene logic)
    const keyToUse = 'frankenstein_sprite';
    const directions = ['sides', 'front'] as const;
    directions.forEach((dir, index) => {
      const animKey = `${keyToUse}_idle_${dir}`;
      if (!this.scene.anims.exists(animKey)) {
        this.scene.anims.create({
          key: animKey,
          frames: this.scene.anims.generateFrameNumbers(keyToUse, {
            start: index * 6,
            end: index * 6 + 5,
          }),
          frameRate: 8,
          repeat: -1,
        });
      }
    });

    // Position based on scene logic (can be passed in later)
    const initialTilePosition = { x: 8, y: 5 };
    const sprite = this.scene.add.sprite(
      initialTilePosition.x * TILE_SIZE + TILE_SIZE / 2,
      initialTilePosition.y * TILE_SIZE,
      keyToUse,
    );
    sprite.play(`${keyToUse}_idle_front`);

    this.agents.set(agentId, { id: agentId, sprite });
    Logger.info(AgentManager.name, `Agent sprite ${agentId} created.`);
  }

  update(_time: number, _delta: number): void {
    // Agent sprite updates based on state (e.g., position, animation)
    // This will be driven by `updateAgentState` calls later
  }

  updateAgentState() /* agentId: string, state: AgentState */ /* TODO */ : void {
    const agent = this.agents.get('frankenstein-01' /* replace with agentId */);
    if (!agent) {
      Logger.warn(AgentManager.name, `Agent not found for state update`);
      return;
    }
    // TODO: Update sprite position, animation based on state
    // agent.sprite.setPosition(state.position.x, state.position.y);
    // agent.sprite.play(...);
  }

  getAllSprites(): Phaser.GameObjects.Sprite[] {
    return Array.from(this.agents.values()).map((agent) => agent.sprite);
  }

  getAgentSprite(agentId: string): Phaser.GameObjects.Sprite | undefined {
    return this.agents.get(agentId)?.sprite;
  }
}
