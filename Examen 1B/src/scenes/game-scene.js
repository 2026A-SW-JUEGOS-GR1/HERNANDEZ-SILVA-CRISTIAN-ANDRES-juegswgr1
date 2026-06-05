import { EnemySpawnerComponent } from '../components/spawners/enemy-spawner-component.js';
import Phaser from '../lib/phaser.js';
import { FighterEnemy } from '../objects/enemies/fighter-enemy.js';
import { ScoutEnemy } from '../objects/enemies/scout-enemy.js';
import { Player } from '../objects/player.js';
import * as CONFIG from '../config.js';
import { CUSTOM_EVENTS, EventBusComponent } from '../components/events/event-bus-component.js';
import { EnemyDestroyedComponent } from '../components/spawners/enemy-destroyed-component.js';
import { Score } from '../objects/ui/score.js';
import { Lives } from '../objects/ui/lives.js';
import { GameOverScreen } from '../objects/ui/game-over-screen.js';
import { AudioManager } from '../objects/audio-manager.js';
import { SoundButton } from '../objects/ui/sound-button.js';

const PAUSE_SCENE_KEY = 'PauseScene';

/**
 * Core Phaser 3 Scene that has the actual game play of our Space Shooter Game.
 */
export class GameScene extends Phaser.Scene {
  /** @type {Phaser.Input.Keyboard.Key} */
  #pauseKey;
  /** @type {Phaser.Input.Keyboard.Key} */
  #muteKey;
  /** @type {SoundButton} */
  #soundButton;

  constructor() {
    super({ key: 'GameScene' });
  }

  /**
   * Creates all of the required game objects for our scene and sets up the required
   * collision checks using the built in Phaser 3 Arcade Physics.
   * @returns {void}
   */
  create() {
    // background
    this.#createBackground();

    // common components
    const eventBusComponent = new EventBusComponent();

    // spawn player
    const player = new Player(this, eventBusComponent);

    // spawn enemies
    const scoutSpawner = new EnemySpawnerComponent(
      this,
      ScoutEnemy,
      {
        interval: CONFIG.ENEMY_SCOUT_GROUP_SPAWN_INTERVAL,
        spawnAt: CONFIG.ENEMY_SCOUT_GROUP_SPAWN_START,
      },
      eventBusComponent
    );
    const fighterSpawner = new EnemySpawnerComponent(
      this,
      FighterEnemy,
      {
        interval: CONFIG.ENEMY_FIGHTER_GROUP_SPAWN_INTERVAL,
        spawnAt: CONFIG.ENEMY_FIGHTER_GROUP_SPAWN_START,
      },
      eventBusComponent
    );
    new EnemyDestroyedComponent(this, eventBusComponent);

    // collisions for player and enemy groups
    this.physics.add.overlap(
      player,
      scoutSpawner.phaserGroup,
      (/** @type {Player}*/ playerGameObject, /** @type {ScoutEnemy}*/ enemyGameObject) => {
        if (!enemyGameObject.active || !playerGameObject.active) {
          return;
        }
        playerGameObject.colliderComponent.collideWithEnemyShip();
        enemyGameObject.colliderComponent.collideWithEnemyShip();
      }
    );
    this.physics.add.overlap(
      player,
      fighterSpawner.phaserGroup,
      (/** @type {Player}*/ playerGameObject, /** @type {FighterEnemy}*/ enemyGameObject) => {
        if (!enemyGameObject.active || !playerGameObject.active) {
          return;
        }
        playerGameObject.colliderComponent.collideWithEnemyShip();
        enemyGameObject.colliderComponent.collideWithEnemyShip();
      }
    );
    eventBusComponent.on(CUSTOM_EVENTS.ENEMY_INIT, (gameObject) => {
      // if name is an enemy from pool, add collision check for weapon group if needed
      if (gameObject.constructor.name !== 'FighterEnemy') {
        return;
      }

      this.physics.add.overlap(
        player,
        gameObject.weaponGameObjectGroup,
        (
          /** @type {Player}*/ playerGameObject,
          /** @type {Phaser.Types.Physics.Arcade.SpriteWithDynamicBody}*/ projectileGameObject
        ) => {
          if (!playerGameObject.active) {
            return;
          }

          gameObject.weaponComponent.destroyBullet(projectileGameObject);
          playerGameObject.colliderComponent.collideWithEnemyProjectile();
        }
      );
    });

    // collisions for player weapons and enemy groups
    this.physics.add.overlap(
      player.weaponGameObjectGroup,
      scoutSpawner.phaserGroup,
      (
        /** @type {ScoutEnemy}*/ enemyGameObject,
        /** @type {Phaser.Types.Physics.Arcade.SpriteWithDynamicBody}*/ projectileGameObject
      ) => {
        if (!enemyGameObject.active) {
          return;
        }
        player.weaponComponent.destroyBullet(projectileGameObject);
        enemyGameObject.colliderComponent.collideWithEnemyProjectile();
      }
    );
    this.physics.add.overlap(
      player.weaponGameObjectGroup,
      fighterSpawner.phaserGroup,
      (
        /** @type {FighterEnemy}*/ enemyGameObject,
        /** @type {Phaser.Types.Physics.Arcade.SpriteWithDynamicBody}*/ projectileGameObject
      ) => {
        if (!enemyGameObject.active) {
          return;
        }
        player.weaponComponent.destroyBullet(projectileGameObject);
        enemyGameObject.colliderComponent.collideWithEnemyProjectile();
      }
    );

    // ui
    new Score(this, eventBusComponent);
    new Lives(this, eventBusComponent);
    this.#soundButton = new SoundButton(this);
    new GameOverScreen(this, eventBusComponent);

    // audio
    new AudioManager(this, eventBusComponent);

    // pause handling
    this.#pauseKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.#pauseKey.on('down', this.#togglePause, this);

    // mute shortcut
    this.#muteKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M);
    this.#muteKey.on('down', this.#handleMuteShortcut, this);

    this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.#pauseKey.off('down', this.#togglePause, this);
      this.#muteKey.off('down', this.#handleMuteShortcut, this);
    });
  }

  /**
   * Renders the single animated background using bg4. The sprite is centered
   * and uniformly scaled to fully cover the camera frame in its natural
   * (vertical) orientation, so the image content is never rotated sideways.
   * @returns {void}
   */
  #createBackground() {
    const { width, height } = this.scale;
    const BG_SOURCE_WIDTH = 640;
    const BG_SOURCE_HEIGHT = 360;
    const scale = Math.max(width / BG_SOURCE_WIDTH, height / BG_SOURCE_HEIGHT);

    this.add
      .sprite(width / 2, height / 2, 'bg4', 0)
      .setOrigin(0.5, 0.5)
      .setAlpha(0.7)
      .play('bg4')
      .setScale(scale);
  }

  /**
   * Pauses/resumes the game by launching or stopping the PauseScene overlay.
   * @returns {void}
   */
  #togglePause() {
    if (this.scene.isActive(PAUSE_SCENE_KEY)) {
      return;
    }
    this.scene.launch(PAUSE_SCENE_KEY);
    this.scene.pause();
  }

  /**
   * Forwards the "M" keyboard shortcut to the SoundButton so the on-screen
   * button and the keyboard shortcut stay in sync.
   * @returns {void}
   */
  #handleMuteShortcut() {
    this.#soundButton.toggleMute();
  }
}
