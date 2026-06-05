import Phaser from '../../lib/phaser.js';
import { CUSTOM_EVENTS, EventBusComponent } from '../../components/events/event-bus-component.js';

const GAME_SCENE_KEY = 'GameScene';
const BUTTON_WIDTH = 150;
const BUTTON_HEIGHT = 36;
const BUTTON_FILL_COLOR = 0xb2405e;
const BUTTON_HOVER_COLOR = 0xff2f66;
const TITLE_OFFSET_Y = -30;
const BUTTON_OFFSET_Y = 30;

/**
 * UI overlay shown when the player loses all of their lives. Displays a
 * "GAME OVER" title and a "PLAY AGAIN" button that restarts the GameScene
 * from scratch when clicked.
 */
export class GameOverScreen extends Phaser.GameObjects.Container {
  /** @type {EventBusComponent} */
  #eventBusComponent;
  /** @type {Phaser.GameObjects.Rectangle} */
  #buttonBackground;

  /**
   * @param {Phaser.Scene} scene
   * @param {EventBusComponent} eventBusComponent
   */
  constructor(scene, eventBusComponent) {
    const { width, height } = scene.scale;
    super(scene, width / 2, height / 2, []);
    this.#eventBusComponent = eventBusComponent;
    this.setVisible(false);
    this.setDepth(20);

    const backdrop = scene.add
      .rectangle(0, 0, width, height, 0x000000, 0.7)
      .setOrigin(0.5);

    const title = scene.add
      .text(0, TITLE_OFFSET_Y, 'GAME OVER', {
        fontSize: '32px',
        color: '#ff2f66',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.#buttonBackground = scene.add
      .rectangle(0, BUTTON_OFFSET_Y, BUTTON_WIDTH, BUTTON_HEIGHT, BUTTON_FILL_COLOR, 0.9)
      .setStrokeStyle(1, 0xffffff)
      .setInteractive(
        new Phaser.Geom.Rectangle(-BUTTON_WIDTH / 2, -BUTTON_HEIGHT / 2, BUTTON_WIDTH, BUTTON_HEIGHT),
        Phaser.Geom.Rectangle.Contains
      );

    const buttonLabel = scene.add
      .text(0, BUTTON_OFFSET_Y, 'PLAY AGAIN', {
        fontSize: '14px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.#buttonBackground.on('pointerover', () => this.#buttonBackground.setFillStyle(BUTTON_HOVER_COLOR, 1));
    this.#buttonBackground.on('pointerout', () => this.#buttonBackground.setFillStyle(BUTTON_FILL_COLOR, 0.9));
    this.#buttonBackground.on('pointerdown', () => this.#restartGame());

    this.add([backdrop, title, this.#buttonBackground, buttonLabel]);
    scene.add.existing(this);

    this.#eventBusComponent.on(CUSTOM_EVENTS.GAME_OVER, this.#show, this);
  }

  /**
   * @returns {void}
   */
  #show() {
    this.setVisible(true);
  }

  /**
   * Restarts the GameScene so the player can play again with fresh state.
   * @returns {void}
   */
  #restartGame() {
    this.scene.restart(GAME_SCENE_KEY);
  }
}
