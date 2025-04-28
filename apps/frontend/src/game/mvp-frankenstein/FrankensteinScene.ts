import { Logger } from '@yesterday-ai/logger-frontend';
import { Scene } from 'phaser';
import { EntityManager } from './EntityManager';

export class FrankensteinScene extends Scene {
  private entityManager!: EntityManager;

  constructor() {
    // Use a unique key for this scene
    super({ key: 'FrankensteinScene' });
  }

  preload(): void {
    Logger.info(this.constructor.name, 'preload() called');
    this.load.image('frankenstein_bg', '/assets/scenes/the-lab.room.png');
    // Delegate asset loading to EntityManager
    this.entityManager = new EntityManager(this);
    this.entityManager.preload();
  }

  create(): void {
    Logger.info(this.constructor.name, 'create() called');
    // Add background
    this.add.image(0, 0, 'frankenstein_bg').setOrigin(0, 0);

    // Delegate entity creation to EntityManager
    this.entityManager.create();

    // Launch the UI Scene concurrently
    this.scene.launch('FrankensteinUIScene');

    Logger.info(this.constructor.name, 'FrankensteinScene created and UI scene launched.');

    // Setup listener for UI events (e.g., agent state updates)
    const uiScene = this.scene.get('FrankensteinUIScene');
    if (uiScene) {
      // TODO: Define specific event names and payload structures
      uiScene.events.on('agentStateUpdate', this.handleAgentStateUpdate, this);
    } else {
      Logger.warn(this.constructor.name, 'Could not find FrankensteinUIScene to attach listeners.');
    }

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
  }

  // Handle updates from the UI Scene
  private handleAgentStateUpdate() /* data: AgentState */ /* TODO */ : void {
    Logger.info(this.constructor.name, 'Received agentStateUpdate from UI');
    // Pass data to EntityManager
    // this.entityManager.updateAgentState(data.agentId, data);
  }

  private shutdown(): void {
    Logger.info(this.constructor.name, 'Shutting down...');
    const uiScene = this.scene.get('FrankensteinUIScene');
    if (uiScene) {
      uiScene.events.off('agentStateUpdate', this.handleAgentStateUpdate, this);
    }
    // TODO: Add manager cleanup if needed
  }

  override update(time: number, delta: number): void {
    // Delegate updates (including Z-sorting) to EntityManager
    if (this.entityManager) {
      this.entityManager.update(time, delta);
    }
  }
}
