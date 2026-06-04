/**
 * ==========================================================================
 * NEXUS LIFE - Nivel 1: Escenario Comercial (Físicas, Mecánicas y JUICE Completo)
 * ==========================================================================
 */

export default class Level1Scene extends Phaser.Scene {
    constructor() {
        super({ key: 'Level1Scene' });
    }

    init() {
        // Inicializar estados internos del nivel
        this.isPaused = false;
        this.tiledMapLoaded = false;

        // --- VARIABLES DE CONTROLES PRECISOS (TALLER) ---
        this.coyoteTimeDuration = 100; // ms tolerados en el aire para saltar
        this.jumpBufferDuration = 150; // ms tolerados antes de tocar suelo para registrar salto
        this.lastTimeOnGround = 0;     // Timestamp del último frame tocando suelo
        this.lastJumpKeyPressedTime = 0; // Timestamp de la última vez que se presionó Salto
    }

    create() {
        console.log('[Scene Manager] Creando Level1Scene con JUICE y Audio.');

        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 1. Configurar Gravedad de la Escena (Físicas de Plataforma)
        this.physics.world.gravity.y = 800;

        // 2. Transición de Entrada: Fade In progresivo
        this.cameras.main.fadeIn(500, 11, 15, 25);

        // 3. INTEGRACIÓN DE AUDIO - MÚSICA DE FONDO (LOOP)
        this.playBackgroundMusic();

        // 4. DSCROLl PARALLAX SCROLLING: Fondo en capas infinitas
        this.setupParallaxBackground(width, height);

        // 5. Iniciar HUD Escena Superpuesta
        this.scene.launch('UIScene');

        // 6. Crear grupos físicos para las mecánicas
        this.coins = this.physics.add.group({ allowGravity: false });
        this.hazards = this.physics.add.staticGroup();
        this.platforms = this.physics.add.staticGroup(); // Suelo/muros estáticos
        this.enemies = this.physics.add.group();         // Enemigos Patrulla

        // 8. Crear Jugador 1 (Biker)
        this.player = this.physics.add.sprite(100, 300, 'player1_idle');
        this.player.setCollideWorldBounds(true);
        this.player.setBounce(0.05);
        this.player.body.setGravityY(100);
        this.player.body.setSize(20, 38);
        this.player.body.setOffset(14, 10);

        this.anims.create({ key: 'p1_idle', frames: this.anims.generateFrameNumbers('player1_idle', { start: 0, end: 3 }), frameRate: 8, repeat: -1 });
        this.anims.create({ key: 'p1_run', frames: this.anims.generateFrameNumbers('player1_run', { start: 0, end: 5 }), frameRate: 10, repeat: -1 });
        this.anims.create({ key: 'p1_jump', frames: this.anims.generateFrameNumbers('player1_jump', { start: 0, end: 3 }), frameRate: 10, repeat: 0 });
        this.anims.create({ key: 'p1_doublejump', frames: this.anims.generateFrameNumbers('player1_doublejump', { start: 0, end: 5 }), frameRate: 12, repeat: 0 });
        this.anims.create({ key: 'enemy_run', frames: this.anims.generateFrameNumbers('enemy_run', { start: 0, end: 5 }), frameRate: 8, repeat: -1 });
        
        this.player.play('p1_idle');

        // 9. Portal de Meta Física (Victoria)
        this.portal = this.physics.add.sprite(750, height - 72, 'portal');
        this.portal.body.setAllowGravity(false);
        this.portal.body.setImmovable(true);

        // 7. Generar Nivel (Tiled removido, ahora es 100% el diseño expandido)
        this.createProceduralLevel();

        // 10. CONFIGURACIÓN DE PARTICLE EMITTER (JUICE)
        // Emisor para chispas doradas de monedas recolectadas
        this.coinSparkEmitter = this.add.particles(0, 0, 'particle_spark', {
            speed: { min: 60, max: 180 },
            scale: { start: 1.2, end: 0 },
            blendMode: 'ADD',
            lifespan: 500,
            gravityY: 100,
            emitting: false
        });

        // Emisor de destellos al saltar (feedback de pies)
        this.jumpSparkEmitter = this.add.particles(0, 0, 'particle_spark', {
            speed: { min: 20, max: 80 },
            scale: { start: 0.8, end: 0 },
            blendMode: 'ADD',
            lifespan: 300,
            emitting: false
        });

        // 11. Colisiones generales
        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.overlap(this.player, this.coins, this.collectToholCoin, null, this);

        // Mecánica plataforma móvil
        this.setupMovingPlatform();

        // Mecánicas de peligro y combate
        this.physics.add.collider(this.player, this.hazards, this.handleHazardDamage, null, this);
        this.physics.add.collider(this.player, this.enemies, this.handleEnemyCollision, null, this);
        this.physics.add.collider(this.enemies, this.platforms); // Enemigos chocan con plataformas

        // Victoria
        this.physics.add.overlap(this.player, this.portal, this.handleVictoryPortal, null, this);

        // 12. Configuración de Controles (WASD & Flechas)
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });

        // Registrar teclas de menú de pausa
        this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
        this.qKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);

        // 13. Textos
        this.add.text(20, height - 30, 'ZONA COMERCIAL | [ESC] Pausa', {
            font: '12px Orbitron',
            fill: '#00f2fe',
            fontWeight: 'bold'
        }).setScrollFactor(0);

        // 14. Configurar menú de pausa
        this.setupNavigation();
    }

    update() {
        const hud = this.scene.get('UIScene');
        if (this.isPaused || hud.gameOver || hud.victory) {
            this.player.setVelocityX(0);
            return;
        }

        // --- ACTUALIZACIÓN DE PARALLAX SCROLLING ---
        // Desplazamos las texturas de fondo según la posición de la cámara
        const cameraScrollX = this.cameras.main.scrollX;
        this.bgFar.tilePositionX = cameraScrollX * 0.1;  // Capa lejana (lento)
        this.bgNear.tilePositionX = cameraScrollX * 0.35; // Capa cercana (mediano)

        // Caída al vacío (Derrota/Daño)
        if (this.player.y > this.cameras.main.height + 40) {
            this.handleVoidFall();
        }

        // --- ACTUALIZACIÓN DE CONTROLES PRECISOS (COYOTE TIME & JUMP BUFFER) ---
        const isTouchingGround = this.player.body.blocked.down || this.player.body.touching.down;
        
        if (isTouchingGround) {
            this.lastTimeOnGround = this.time.now;
            this.jumpsCount = 0; // Resetear saltos
        }

        if (!isTouchingGround) {
            if (this.jumpsCount === 2) {
                this.player.anims.play('p1_doublejump', true);
            } else {
                this.player.anims.play('p1_jump', true);
            }
        }

        // Movimiento Horizontal normal
        if (this.cursors.left.isDown || this.wasd.left.isDown) {
            this.player.setVelocityX(-180);
            this.player.setFlipX(true);
            if (isTouchingGround) this.player.anims.play('p1_run', true);
        } else if (this.cursors.right.isDown || this.wasd.right.isDown) {
            this.player.setVelocityX(180);
            this.player.setFlipX(false);
            if (isTouchingGround) this.player.anims.play('p1_run', true);
        } else {
            this.player.setVelocityX(0);
            if (isTouchingGround) this.player.anims.play('p1_idle', true);
        }

        // Detectar si presionó el botón de salto
        const jumpPressed = Phaser.Input.Keyboard.JustDown(this.cursors.up) || 
                            Phaser.Input.Keyboard.JustDown(this.cursors.space) || 
                            Phaser.Input.Keyboard.JustDown(this.wasd.up);

        if (jumpPressed) {
            this.lastJumpKeyPressedTime = this.time.now;
            
            // --- MECÁNICA: Doble Salto (En el aire) ---
            if (!isTouchingGround && this.jumpsCount === 1) {
                this.player.setVelocityY(-340);
                this.jumpsCount = 2;
                this.lastJumpKeyPressedTime = 0;
                this.playSFX('sfx_jump');
                this.jumpSparkEmitter.emitParticleAt(this.player.x, this.player.y + 16, 8);
            }
        }

        const canFirstJump = isTouchingGround || (this.time.now - this.lastTimeOnGround < this.coyoteTimeDuration);
        const hasJumpBuffered = (this.time.now - this.lastJumpKeyPressedTime < this.jumpBufferDuration);

        if (canFirstJump && hasJumpBuffered && this.jumpsCount === 0) {
            this.player.setVelocityY(-380);
            this.jumpsCount = 1;
            this.lastJumpKeyPressedTime = 0; 
            this.lastTimeOnGround = 0;

            // Reproducir SFX Salto de forma limpia
            this.playSFX('sfx_jump');

            // Feedback visual en los pies del jugador
            this.jumpSparkEmitter.emitParticleAt(this.player.x, this.player.y + 16, 5);
        }

        // --- ACTUALIZACIÓN DE ENEMIGOS PATRULLA ---
        this.enemies.getChildren().forEach(enemy => {
            if (enemy.body.blocked.left || enemy.body.touching.left || enemy.x < enemy.spawnX - enemy.patrolDist) {
                enemy.body.setVelocityX(80);
                enemy.setFlipX(true);
            } else if (enemy.body.blocked.right || enemy.body.touching.right || enemy.x > enemy.spawnX + enemy.patrolDist) {
                enemy.body.setVelocityX(-80);
                enemy.setFlipX(false);
            }
        });
    }

    /**
     * Configuración del desplazamiento Parallax Scrolling
     */
    setupParallaxBackground(width, height) {
        // Capa 1: Cielo Cyberpunk (Estático)
        this.bgSky = this.add.tileSprite(0, 0, width, height, 'bg_sky')
            .setOrigin(0)
            .setScrollFactor(0);

        // Capa 2: Edificios Lejanos (Scroll factor muy lento en X)
        this.bgFar = this.add.tileSprite(0, 40, width, height - 40, 'bg_far')
            .setOrigin(0)
            .setScrollFactor(0.1, 0);

        // Capa 3: Edificios Cercanos (Scroll factor medio en X)
        this.bgNear = this.add.tileSprite(0, 40, width, height - 40, 'bg_near')
            .setOrigin(0)
            .setScrollFactor(0.35, 0);
    }

    /**
     * (Tiled ha sido eliminado a favor del diseño procedural expandido)
     */
    setupTiledMap() {
        // Obsoleto. El mapa principal ahora se genera en createProceduralLevel.
    }

    /**
     * Construye un nivel procedural robusto y amplio (2400px de ancho).
     */
    createProceduralLevel() {
        const height = this.cameras.main.height;
        const levelWidth = 2400; // Nivel 3 veces más ancho

        // Configurar mundo y cámara
        this.physics.world.setBounds(0, 0, levelWidth, height);
        this.cameras.main.setBounds(0, 0, levelWidth, height);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

        // Mover portal al final del nivel
        this.portal.setPosition(levelWidth - 100, height - 72);

        // Suelo principal segmentado con múltiples huecos
        this.createSolidBlock(0, height - 40, 400, 40);
        this.createSolidBlock(480, height - 40, 300, 40);
        this.createSolidBlock(860, height - 40, 400, 40);
        this.createSolidBlock(1340, height - 40, 200, 40);
        this.createSolidBlock(1620, height - 40, 500, 40);
        this.createSolidBlock(2200, height - 40, 200, 40);

        // Plataformas aéreas (Parkour)
        const platformPositions = [
            { x: 250, y: height - 130, w: 100 },
            { x: 500, y: height - 200, w: 120 },
            { x: 750, y: height - 140, w: 80 },
            { x: 950, y: height - 220, w: 150 },
            { x: 1250, y: height - 160, w: 80 },
            { x: 1450, y: height - 250, w: 100 },
            { x: 1700, y: height - 180, w: 120 },
            { x: 1950, y: height - 220, w: 100 }
        ];

        platformPositions.forEach(p => this.createSolidBlock(p.x, p.y, p.w, 20));

        // Paredes laterales invisibles
        this.createSolidBlock(0, 40, 15, height - 80);
        this.createSolidBlock(levelWidth - 15, 40, 15, height - 80);

        // SPAWN MECÁNICA 1: Más Monedas TOHOL
        const coinPositions = [
            { x: 300, y: height - 170 },
            { x: 560, y: height - 240 },
            { x: 790, y: height - 180 },
            { x: 1020, y: height - 260 },
            { x: 1290, y: height - 200 },
            { x: 1500, y: height - 290 },
            { x: 1760, y: height - 220 },
            { x: 2000, y: height - 260 }
        ];

        coinPositions.forEach(pos => {
            const coin = this.coins.create(pos.x, pos.y, 'coin');
            coin.body.setBounceY(0.4);
            this.tweens.add({
                targets: coin,
                y: pos.y - 6,
                duration: 800 + Math.random() * 400,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        });

        // SPAWN MECÁNICA 3: Más Pinchos (Trampas de Plasma) en huecos y suelo
        const hazardPositions = [
            { x: 440, y: height - 55 },
            { x: 820, y: height - 55 },
            { x: 1050, y: height - 55 },
            { x: 1580, y: height - 55 },
            { x: 2160, y: height - 55 }
        ];
        hazardPositions.forEach(pos => this.hazards.create(pos.x, pos.y, 'hazard'));

        // --- ROBOT ENEMIGOS PATRULLA (IA MEJORADA) ---
        this.spawnPatrolEnemy(300, height - 152, 50);
        this.spawnPatrolEnemy(560, height - 232, 40);
        this.spawnPatrolEnemy(1020, height - 252, 60);
        this.spawnPatrolEnemy(1760, height - 212, 50);
        this.spawnPatrolEnemy(2300, height - 72, 80);
    }

    /**
     * Spawnea un enemigo patrullero y le configura velocidades iniciales
     */
    spawnPatrolEnemy(x, y, patrolDist = 60) {
        const enemy = this.enemies.create(x, y, 'enemy_run');
        enemy.setCollideWorldBounds(true);
        enemy.body.setBounceX(1);
        enemy.body.setVelocityX(-80);
        enemy.body.setSize(20, 35);
        enemy.body.setOffset(14, 13);
        enemy.play('enemy_run');
        enemy.spawnX = x; // Guardar posición original para calcular límites
        enemy.patrolDist = patrolDist;
    }

    /**
     * Dibuja un bloque sólido usando Tiles industriales.
     */
    createSolidBlock(x, y, w, h) {
        const tile = this.add.tileSprite(x + w / 2, y + h / 2, w, h, 'platform_tile');
        this.physics.add.existing(tile, true);
        this.platforms.add(tile);
    }

    /**
     * MECÁNICA 1: Lógica para recoger las monedas de TOHOL con EMISOR DE PARTÍCULAS
     */
    collectToholCoin(player, coin) {
        coin.disableBody(true, true);
        console.log('[Mecánica 1] Moneda TOHOL recogida!');
        
        // Sumar marcador de score
        this.game.events.emit('add-score', 10);

        // Reproducir SFX Moneda
        this.playSFX('sfx_coin');

        // --- JUICE: Disparar emisor de chispas doradas radiales ---
        this.coinSparkEmitter.emitParticleAt(coin.x, coin.y, 12);
    }

    /**
     * MECÁNICA 2: Configuración de la Plataforma Móvil
     */
    setupMovingPlatform() {
        const height = this.cameras.main.height;
        this.movingPlatform = this.physics.add.image(450, height - 90, 'platform');
        this.movingPlatform.body.setAllowGravity(false);
        this.movingPlatform.body.setImmovable(true);
        this.movingPlatform.body.setFriction(1, 0);

        this.physics.add.collider(this.player, this.movingPlatform);
        this.movingPlatform.body.setVelocityX(80);

        this.time.addEvent({
            delay: 2500,
            callback: () => {
                if (this.movingPlatform && this.movingPlatform.body) {
                    const currentVel = this.movingPlatform.body.velocity.x;
                    this.movingPlatform.body.setVelocityX(-currentVel);
                }
            },
            loop: true
        });
    }

    /**
     * MECÁNICA 3: Colisión con zonas de peligro (Pinchos) con FEEDBACK VISUAL
     */
    handleHazardDamage(player, hazard) {
        console.warn('[Mecánica 3] Daño por pinchos!');
        this.applyPlayerDamage();
    }

    /**
     * IA ENEMIGO: Colisión o combate con los enemigos patrulla
     */
    handleEnemyCollision(player, enemy) {
        // Combate Aéreo: Si el jugador cae encima del enemigo, lo derrota
        if (player.body.velocity.y > 0 && player.y < enemy.y - 12) {
            console.log('[Combate IA] ¡Enemigo derrotado desde el aire!');
            
            // Destrucción del enemigo
            enemy.destroy();

            // Rebotar jugador hacia arriba
            player.setVelocityY(-280);

            // Sumar score extra
            this.game.events.emit('add-score', 15);

            // Audio de combate
            this.playSFX('sfx_coin');

            // Explosión de chispas en la posición del enemigo
            this.coinSparkEmitter.emitParticleAt(enemy.x, enemy.y, 8);
        } else {
            // El jugador colisiona por los lados: recibe daño
            console.warn('[Combate IA] Colisión lateral. Daño al jugador!');
            this.applyPlayerDamage();
        }
    }

    /**
     * Aplica daño general al jugador con Flash de pantalla, Shake de cámara y SFX.
     */
    applyPlayerDamage() {
        this.game.events.emit('lose-life', 1);

        // --- JUICE: Flash rojo de pantalla y Sacudida de cámara ---
        this.cameras.main.flash(200, 255, 0, 0);
        this.cameras.main.shake(150, 0.015);

        // Reproducir SFX Daño
        this.playSFX('sfx_damage');

        // Respawnear jugador
        this.respawnPlayer();
    }

    /**
     * Caída al vacío (Derrota/Daño)
     */
    handleVoidFall() {
        console.warn('[Game Loop] ¡Caída al vacío!');
        this.applyPlayerDamage();
    }

    respawnPlayer() {
        const hud = this.scene.get('UIScene');
        if (hud.lives > 0) {
            this.player.setVelocity(0, 0);
            this.player.setPosition(100, 300);

            this.tweens.add({
                targets: this.player,
                alpha: 0.2,
                duration: 100,
                yoyo: true,
                repeat: 4
            });
        }
    }

    /**
     * CONDICIÓN DE VICTORIA: El jugador toca el portal de meta
     */
    handleVictoryPortal(player, portal) {
        console.log('[Victory] ¡Jugador alcanzó el portal!');
        this.game.events.emit('goal-reached');
    }

    /**
     * SISTEMA DE AUDIO - MÚSICA DE FONDO EN LOOP Y SFX CONTROLADOS
     */
    playBackgroundMusic() {
        try {
            // Intentar detener cualquier música previa en caché
            this.sound.stopAll();

            if (this.sound.get('bg_music')) {
                this.sound.play('bg_music', { loop: true, volume: 0.2 });
                console.log('[Audio] Música de fondo iniciada en loop con volumen 0.2.');
            } else {
                console.log('[Audio Info] bg_music no cargado físicamente. Fallback activo.');
            }
        } catch (e) {
            console.warn('[Audio Exception] Error cargando música:', e.message);
        }
    }

    /**
     * Ayudante limpio de SFX para evitar solapamientos molestos y errores fatales de red
     */
    playSFX(key) {
        console.log(`[SFX Trigger] Reproduciendo: ${key}`);
        try {
            if (this.sound.get(key)) {
                this.sound.play(key);
            }
        } catch (e) {
            console.warn('[SFX Exception] Audio no disponible:', e.message);
        }
    }

    /**
     * Configuración del menú de Pausa reactivo (ESC / ENTER / Q)
     */
    setupNavigation() {
        // Pausa (ESC)
        this.escKey.on('down', () => {
            const hud = this.scene.get('UIScene');
            if (hud.gameOver || hud.victory) return;

            if (this.isPaused) {
                this.resumeGame();
            } else {
                this.pauseGame();
            }
        });

        // Reanudar (ENTER)
        this.enterKey.on('down', () => {
            if (this.isPaused) {
                this.resumeGame();
            }
        });

        // Salir al Menú (Q) con FADE OUT suave de transición
        this.qKey.on('down', () => {
            if (this.isPaused) {
                console.log('[Pause Menu] Retornando al Menú Principal...');
                this.resumeGame(); 
                
                // Transición suave de salida
                this.cameras.main.fadeOut(400, 11, 15, 25);
                this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
                    this.scene.stop('UIScene');
                    this.scene.start('MainMenuScene');
                });
            }
        });
    }

    pauseGame() {
        this.isPaused = true;
        this.physics.pause();
        this.tweens.pauseAll();

        const hud = this.scene.get('UIScene');
        if (hud.timerEvent) hud.timerEvent.paused = true;

        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.pauseContainer = this.add.container(0, 0);

        const overlay = this.add.graphics();
        overlay.fillStyle(0x07090e, 0.85);
        overlay.fillRect(0, 0, width, height);
        this.pauseContainer.add(overlay);

        const box = this.add.graphics();
        box.fillStyle(0x111928, 0.95);
        box.fillRect(width / 2 - 180, height / 2 - 90, 360, 180);
        box.lineStyle(2, 0x00f2fe, 0.8);
        box.strokeRect(width / 2 - 180, height / 2 - 90, 360, 180);
        this.pauseContainer.add(box);

        const title = this.add.text(width / 2, height / 2 - 55, 'SIMULACIÓN PAUSADA', {
            font: '16px Orbitron',
            fill: '#00f2fe',
            fontWeight: 'bold',
            letterSpacing: 2
        }).setOrigin(0.5);
        this.pauseContainer.add(title);

        const note1 = this.add.text(width / 2, height / 2 - 5, 'Presiona [ENTER] o [ESC] para Reanudar', {
            font: '12px Inter',
            fill: '#f3f4f6'
        }).setOrigin(0.5);
        this.pauseContainer.add(note1);

        const note2 = this.add.text(width / 2, height / 2 + 35, 'Presiona [Q] para Salir al Menú Principal', {
            font: '12px Inter',
            fill: '#ff007f',
            fontWeight: 'bold'
        }).setOrigin(0.5);
        this.pauseContainer.add(note2);

        console.log('[Level 1] Pausa activa.');
    }

    resumeGame() {
        this.isPaused = false;
        this.physics.resume();
        this.tweens.resumeAll();

        const hud = this.scene.get('UIScene');
        if (hud.timerEvent) hud.timerEvent.paused = false;

        if (this.pauseContainer) {
            this.pauseContainer.destroy();
            this.pauseContainer = null;
        }

        console.log('[Level 1] Pausa desactivada.');
    }
}
