import Phaser from '../../lib/phaser.js';

const BUTTON_WIDTH = 70;
const BUTTON_HEIGHT = 24;

/**
 * Simple UI button positioned at the top right of the screen that toggles the
 * Phaser sound manager mute state. Updates its label and color to reflect the
 * current audio state.
 */
export class SoundButton extends Phaser.GameObjects.Container {
  /** @type {Phaser.GameObjects.Text} */
  #label;
  /** @type {Phaser.GameObjects.Rectangle} */
  #background;
  /** @type {boolean} */
  #isMuted;

  /**
   * @param {Phaser.Scene} scene
   */
  constructor(scene) {
    const x = scene.scale.width - BUTTON_WIDTH / 2 - 5;
    const y = 20;
    super(scene, x, y, []);

    this.#isMuted = false;
    this.#background = scene.add
      .rectangle(0, 0, BUTTON_WIDTH, BUTTON_HEIGHT, 0x000000, 0.55)
      .setStrokeStyle(1, 0xb2405e);
    this.#label = scene.add
      .text(0, 0, 'SOUND ON', {
        fontSize: '12px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add([this.#background, this.#label]);
    this.setInteractive(
      new Phaser.Geom.Rectangle(-BUTTON_WIDTH / 2, -BUTTON_HEIGHT / 2, BUTTON_WIDTH, BUTTON_HEIGHT),
      Phaser.Geom.Rectangle.Contains
    );
    this.setDepth(10);

    this.on('pointerover', () => this.#background.setFillStyle(0xb2405e, 0.85));
    this.on('pointerout', () => this.#updateBackground());
    this.on('pointerdown', () => this.toggleMute());

    scene.add.existing(this);
  }

  /**
   * Toggles the global sound manager mute state and refreshes the button visuals.
   * Public so it can also be triggered from external input handlers (e.g. the
   * "M" keyboard shortcut).
   * @returns {void}
   */
  toggleMute() {
    this.#isMuted = !this.#isMuted;
    this.scene.sound.mute = this.#isMuted;
    this.#refreshLabel();
  }

  /**
   * @returns {void}
   */
  #refreshLabel() {
    this.#label.setText(this.#isMuted ? 'SOUND OFF' : 'SOUND ON');
    this.#updateBackground();
  }

  /**
   * @returns {void}
   */
  #updateBackground() {
    this.#background.setFillStyle(this.#isMuted ? 0x4a4a4a : 0x000000, this.#isMuted ? 0.75 : 0.55);
  }
}
