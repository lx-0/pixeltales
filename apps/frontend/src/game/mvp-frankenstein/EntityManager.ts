import { Logger } from '@yesterday-ai/logger-frontend';
import { Scene } from 'phaser';
import { AgentManager } from './AgentManager';
import { NpcManager } from './NpcManager';

/**
 * Manages different types of entities within the FrankensteinScene.
 * Coordinates AgentManager, NpcManager, etc.
 */
export class EntityManager {
  private agentManager: AgentManager;
  private npcManager: NpcManager;

  constructor(private scene: Scene) {
    this.agentManager = new AgentManager(scene);
    this.npcManager = new NpcManager(scene);
  }

  preload(): void {
    Logger.info(EntityManager.name, 'Preloading entities...');
    this.agentManager.preload();
    this.npcManager.preload();
  }

  create(): void {
    Logger.info(EntityManager.name, 'Creating entities...');
    this.agentManager.create();
    this.npcManager.create();
  }

  update(time: number, delta: number): void {
    // Update managers
    this.agentManager.update(time, delta);
    this.npcManager.update(time, delta);

    // Simple Z-sorting based on Y coordinate
    // Get all relevant sprites from managers
    const allSprites = [...this.agentManager.getAllSprites(), ...this.npcManager.getAllSprites()];
    allSprites.forEach((sprite) => {
      // Add a small offset if needed to avoid flickering on exact same Y
      sprite.setDepth(sprite.y + sprite.height * 0.5);
    });
  }

  // --- Agent Specific Methods (Delegated) ---
  updateAgentState() /* agentId: string, state: AgentState */ /* Add state type */ : void {
    // TODO: Pass state updates from UI Scene to Agent Manager
    // this.agentManager.updateAgentState(agentId, state);
    Logger.warn(EntityManager.name, 'updateAgentState needs implementation');
  }

  // Get the main agent sprite if needed elsewhere
  getAgentSprite(agentId: string): Phaser.GameObjects.Sprite | undefined {
    return this.agentManager.getAgentSprite(agentId);
  }
}
