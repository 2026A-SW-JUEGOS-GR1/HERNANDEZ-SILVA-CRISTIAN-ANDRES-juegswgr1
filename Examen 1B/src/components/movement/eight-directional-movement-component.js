import Phaser from '../../lib/phaser.js';
import { isSpriteWithDynamicBody } from '../../types/typedef.js';
import { InputComponent } from '../input/input-component.js';
import * as CONFIG from '../../config.js';

const DIAGONAL_NORMALIZATION = 1 / Math.SQRT2;

/**
 * Component that allows movement in 8 directions (cardinal + diagonals) in a
 * Phaser 3 game. The component reads up, down, left and right inputs and
 * applies velocity to the physics body on both axes. When the input is
 * diagonal the per-axis velocity is scaled by `1 / sqrt(2)` so the resulting
 * movement speed is the same as cardinal movement.
 */
export class EightDirectionalMovementComponent {
  /** @type {Phaser.Physics.Arcade.Sprite | Phaser.GameObjects.Container} */
  #gameObject;
  /** @type {InputComponent} */
  #inputComponent;
  /** @type {number} */
  #velocity;

  /**
   * @param {Phaser.Physics.Arcade.Sprite | Phaser.GameObjects.Container} gameObject
   * @param {InputComponent} inputComponent
   * @param {number} velocity
   */
  constructor(gameObject, inputComponent, velocity) {
    this.#gameObject = gameObject;
    this.#inputComponent = inputComponent;
    this.#velocity = velocity;

    if (!isSpriteWithDynamicBody(this.#gameObject.body)) {
      return;
    }
    this.#gameObject.body.setDamping(true);
    this.#gameObject.body.setDrag(
      CONFIG.COMPONENT_MOVEMENT_HORIZONTAL_DRAG,
      CONFIG.COMPONENT_MOVEMENT_VERTICAL_DRAG
    );
    this.#gameObject.body.setMaxVelocity(
      CONFIG.COMPONENT_MOVEMENT_HORIZONTAL_MAX_VELOCITY,
      CONFIG.COMPONENT_MOVEMENT_VERTICAL_MAX_VELOCITY
    );
  }

  /**
   * @returns {void}
   */
  reset() {
    if (!isSpriteWithDynamicBody(this.#gameObject.body)) {
      return;
    }
    this.#gameObject.body.velocity.x = 0;
    this.#gameObject.body.velocity.y = 0;
  }

  /**
   * @returns {void}
   */
  update() {
    if (!isSpriteWithDynamicBody(this.#gameObject.body)) {
      return;
    }

    const movingX = this.#inputComponent.leftIsDown || this.#inputComponent.rightIsDown;
    const movingY = this.#inputComponent.upIsDown || this.#inputComponent.downIsDown;
    const factor = movingX && movingY ? DIAGONAL_NORMALIZATION : 1;

    if (this.#inputComponent.leftIsDown) {
      this.#gameObject.body.velocity.x -= this.#velocity * factor;
    } else if (this.#inputComponent.rightIsDown) {
      this.#gameObject.body.velocity.x += this.#velocity * factor;
    }

    if (this.#inputComponent.upIsDown) {
      this.#gameObject.body.velocity.y -= this.#velocity * factor;
    } else if (this.#inputComponent.downIsDown) {
      this.#gameObject.body.velocity.y += this.#velocity * factor;
    }
  }
}
