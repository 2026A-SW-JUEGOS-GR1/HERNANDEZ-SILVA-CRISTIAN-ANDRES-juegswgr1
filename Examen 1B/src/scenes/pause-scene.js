import Phaser from '../lib/phaser.js';

const GAME_SCENE_KEY = 'GameScene';

/**
 * Simple modal overlay scene shown when the game is paused. Renders a dimmed
 * background with a "PAUSED" message and reacts to the ESC key to resume the
 * underlying GameScene.
 */
export class PauseScene extends Phaser.Scene {
  /** @type {Phaser.Input.Keyboard.Key} */
  #resumeKey;

  constructor() {
    super({ key: 'PauseScene' });
  }

  /**
   * @returns {void}
   */
  create() {
    const { width, height } = this.scale;

    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.6);

    this.add
      .text(width / 2, height / 2 - 20, 'PAUSED', {
        fontSize: '32px',
        color: '#ff2f66',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height / 2 + 20, 'Press ESC to resume', {
        fontSize: '14px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    this.#resumeKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.#resumeKey.on('down', this.#resume, this);
    this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.#resumeKey.off('down', this.#resume, this);
    });
  }

  /**
   * Stops the PauseScene overlay and resumes the GameScene that triggered it.
   * @returns {void}
   */
  #resume() {
    this.scene.stop();
    this.scene.resume(GAME_SCENE_KEY);
  }
}
