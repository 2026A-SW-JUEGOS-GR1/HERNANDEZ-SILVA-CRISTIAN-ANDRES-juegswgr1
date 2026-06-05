import Phaser from '../lib/phaser.js';

const GAME_SCENE_KEY = 'GameScene';
const BUTTON_WIDTH = 150;
const BUTTON_HEIGHT = 36;
const BUTTON_FILL_COLOR = 0xb2405e;
const BUTTON_HOVER_COLOR = 0xff2f66;

/**
 * Modal overlay scene shown when the player loses all of their lives. Displays
 * a "GAME OVER" title and a "JUGAR DE NUEVO" button that restarts the
 * GameScene from scratch when clicked.
 */
export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  /**
   * @returns {void}
   */
  create() {
    const { width, height } = this.scale;

    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);

    this.add
      .text(width / 2, height / 2 - 30, 'FIN DEL JUEGO', {
        fontSize: '32px',
        color: '#ff2f66',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const buttonBackground = this.add
      .rectangle(
        width / 2,
        height / 2 + 30,
        BUTTON_WIDTH,
        BUTTON_HEIGHT,
        BUTTON_FILL_COLOR,
        0.9,
      )
      .setStrokeStyle(1, 0xffffff)
      .setInteractive({ useHandCursor: true });

    this.add
      .text(width / 2, height / 2 + 30, 'JUGAR DE NUEVO', {
        fontSize: '14px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    buttonBackground.on('pointerover', () =>
      buttonBackground.setFillStyle(BUTTON_HOVER_COLOR, 1),
    );
    buttonBackground.on('pointerout', () =>
      buttonBackground.setFillStyle(BUTTON_FILL_COLOR, 0.9),
    );
    buttonBackground.on('pointerdown', () => this.#restartGame());
  }

  /**
   * Stops this overlay and restarts the GameScene with fresh state.
   * @returns {void}
   */
  #restartGame() {
    this.scene.stop(GAME_SCENE_KEY);
    this.scene.start(GAME_SCENE_KEY);
    this.scene.stop();
  }
}
