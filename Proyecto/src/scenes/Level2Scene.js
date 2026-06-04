/**
 * ==========================================================================
 * NEXUS LIFE - Nivel 2: Escenario Social (Físicas, Mecánicas y JUICE Completo)
 * ==========================================================================
 */

export default class Level2Scene extends Phaser.Scene {
    constructor() {
        super({ key: 'Level2Scene' });
    }

    init() {
        // Inicializar estados internos del nivel
        this.isPaused = false;
        this.jumpsCount = 0;
        this.isDashing = false;
        this.dashCooldown = false;
        this.speedMultiplier = 1.0;

        // --- VARIABLES DE CONTROLES PRECISOS (TALLER) ---
        this.coyoteTimeDuration = 100;   // ms tolerados en el aire para primer salto
        this.jumpBufferDuration = 150;   // ms tolerados antes de tocar suelo
        this.lastTimeOnGround = 0;       // Timestamp del último frame tocando suelo
        this.lastJumpKeyPressedTime = 0;   // Timestamp de la última vez que se presionó Salto
    }

    create() {
        console.log('[Scene Manager] Inicializando Level2Scene con JUICE y Audio.');

        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 1. Configurar Gravedad de la Escena (Físicas de Plataforma)
        this.physics.world.gravity.y = 800;

        // 2. Transición de Entrada: Fade In progresivo
        this.cameras.main.fadeIn(500, 11, 15, 25);

        // 3. INTEGRACIÓN DE AUDIO - MÚSICA DE FONDO (LOOP)
        this.playBackgroundMusic();

        // 4. PARALLAX SCROLLING: Fondo en capas infinitas
        this.setupParallaxBackground(width, height);

        // 5. Iniciar HUD Escena Superpuesta
        this.scene.launch('UIScene');

        // 6. Crear grupos físicos
        this.platforms = this.physics.add.staticGroup(); // Suelo/muros estáticos
        this.enemies = this.physics.add.group();         // Enemigos Patrulla
        this.coins = this.physics.add.group({ allowGravity: false }); // Monedas TOHOL

        // 8. Crear Jugador 2 (Punk)
        this.player = this.physics.add.sprite(100, 300, 'player2_idle');
        this.player.setCollideWorldBounds(true);
        this.player.setBounce(0.05);
        this.player.body.setSize(20, 38);
        this.player.body.setOffset(14, 10);

        this.anims.create({ key: 'p2_idle', frames: this.anims.generateFrameNumbers('player2_idle', { start: 0, end: 3 }), frameRate: 8, repeat: -1 });
        this.anims.create({ key: 'p2_run', frames: this.anims.generateFrameNumbers('player2_run', { start: 0, end: 5 }), frameRate: 10, repeat: -1 });
        this.anims.create({ key: 'p2_jump', frames: this.anims.generateFrameNumbers('player2_jump', { start: 0, end: 3 }), frameRate: 10, repeat: 0 });
        this.anims.create({ key: 'p2_doublejump', frames: this.anims.generateFrameNumbers('player2_doublejump', { start: 0, end: 5 }), frameRate: 12, repeat: 0 });
        this.anims.create({ key: 'enemy_run', frames: this.anims.generateFrameNumbers('enemy_run', { start: 0, end: 5 }), frameRate: 8, repeat: -1 });
        this.anims.create({ key: 'coin_spin', frames: this.anims.generateFrameNumbers('coin', { start: 0, end: 5 }), frameRate: 10, repeat: -1 });

        this.player.play('p2_idle');

        // 9. Colocar Portal de Meta Física (Victoria)
        this.portal = this.physics.add.sprite(750, height - 72, 'portal');
        this.portal.body.setAllowGravity(false);
        this.portal.body.setImmovable(true);

        // 7. Generar Nivel (Tiled removido)
        this.createProceduralLevel();

        // 10. CONFIGURACIÓN DE PARTICLE EMITTERS (JUICE)
        // Emisor para chispas rosadas brillantes de monedas y combate
        this.pinkSparkEmitter = this.add.particles(0, 0, 'particle_spark', {
            speed: { min: 80, max: 200 },
            scale: { start: 1.3, end: 0 },
            blendMode: 'ADD',
            lifespan: 550,
            gravityY: 120,
            emitting: false
        });

        // Emisor para el doble salto
        this.doubleJumpRingEmitter = this.add.particles(0, 0, 'particle_spark', {
            speed: { min: 40, max: 120 },
            scale: { start: 1, end: 0 },
            blendMode: 'ADD',
            lifespan: 350,
            emitting: false
        });

        // 11. Colisiones generales
        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.collider(this.enemies, this.platforms); // Enemigos chocan con plataformas
        this.physics.add.overlap(this.player, this.coins, this.collectCoin, null, this);

        // MECÁNICA 6: NPC Vendedor (Cyborg Verde)
        this.setupNPCMerchant();

        // Mecánicas de combate y peligro
        this.physics.add.collider(this.player, this.enemies, this.handleEnemyCollision, null, this);

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
        
        // Teclas especiales para habilidades
        this.shiftKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
        this.eKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);

        // Registrar teclas de menú de pausa
        this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
        this.qKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);

        // 13. Textos e indicaciones
        this.add.text(20, height - 30, 'BARRIO SOCIAL | [ESC] Pausa', {
            font: '12px Orbitron',
            fill: '#ff007f',
            fontWeight: 'bold'
        }).setScrollFactor(0);

        this.hudInstructions = this.add.text(width / 2, 50, '[W]/[SPACE] Doble Salto | [SHIFT] Dash | Acércate al NPC Verde y pulsa [E]', {
            font: '10px Inter',
            fill: '#9ca3af'
        }).setOrigin(0.5).setScrollFactor(0);

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
        const cameraScrollX = this.cameras.main.scrollX;
        this.bgFar.tilePositionX = cameraScrollX * 0.1;  // Capa lejana
        this.bgNear.tilePositionX = cameraScrollX * 0.35; // Capa cercana

        // Caída al vacío (Derrota/Daño)
        if (this.player.y > this.cameras.main.height + 40) {
            this.handleVoidFall();
        }

        if (this.isDashing) return; // Si está en pleno Dash, suspender controles normales

        // Control de Movimiento Horizontal
        const baseSpeed = 180 * this.speedMultiplier;
        
        if (this.cursors.left.isDown || this.wasd.left.isDown) {
            this.player.setVelocityX(-baseSpeed);
            this.player.setFlipX(true);
            if (this.player.body.blocked.down || this.player.body.touching.down) this.player.anims.play('p2_run', true);
        } else if (this.cursors.right.isDown || this.wasd.right.isDown) {
            this.player.setVelocityX(baseSpeed);
            this.player.setFlipX(false);
            if (this.player.body.blocked.down || this.player.body.touching.down) this.player.anims.play('p2_run', true);
        } else {
            this.player.setVelocityX(0);
            if (this.player.body.blocked.down || this.player.body.touching.down) this.player.anims.play('p2_idle', true);
        }
        
        if (!(this.player.body.blocked.down || this.player.body.touching.down) && !this.isDashing) {
            if (this.jumpsCount === 2) {
                this.player.anims.play('p2_doublejump', true);
            } else {
                this.player.anims.play('p2_jump', true);
            }
        }

        // --- ACTUALIZACIÓN DE CONTROLES PRECISOS + DOBLE SALTO ---
        const isTouchingGround = this.player.body.blocked.down || this.player.body.touching.down;
        
        if (isTouchingGround) {
            this.jumpsCount = 0;            // Resetear saltos al tocar suelo
            this.lastTimeOnGround = this.time.now; // Guardar último timestamp en el suelo
        }

        // Detectar si presionó el botón de salto (registra en Jump Buffer o activa Doble Salto en el aire)
        const jumpPressed = Phaser.Input.Keyboard.JustDown(this.cursors.up) || 
                            Phaser.Input.Keyboard.JustDown(this.cursors.space) || 
                            Phaser.Input.Keyboard.JustDown(this.wasd.up);

        if (jumpPressed) {
            this.lastJumpKeyPressedTime = this.time.now;
            
            // --- MECÁNICA 4: Doble Salto (En el aire) ---
            if (!isTouchingGround && this.jumpsCount === 1) {
                this.executeDoubleJump();
            }
        }

        // Primer salto con Coyote Time y Jump Buffer
        const canFirstJump = isTouchingGround || (this.time.now - this.lastTimeOnGround < this.coyoteTimeDuration);
        const hasJumpBuffered = (this.time.now - this.lastJumpKeyPressedTime < this.jumpBufferDuration);

        if (canFirstJump && hasJumpBuffered && this.jumpsCount === 0) {
            this.player.setVelocityY(-360);
            this.jumpsCount = 1;
            
            // Consumir el buffer de salto
            this.lastJumpKeyPressedTime = 0; 
            this.lastTimeOnGround = 0;

            // Reproducir SFX Salto de forma limpia
            this.playSFX('sfx_jump');

            // Partículas en los pies
            this.doubleJumpRingEmitter.emitParticleAt(this.player.x, this.player.y + 16, 4);
        }

        // --- MECÁNICA 5: Dash (Impulso Rápido) ---
        const dashPressed = Phaser.Input.Keyboard.JustDown(this.shiftKey);
        
        if (dashPressed && !this.dashCooldown) {
            this.executeDash();
        }

        // --- MECÁNICA 6: Lógica de Compra e Interacción Económica con NPC ---
        const distanceToNPC = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.npc.x, this.npc.y);
        
        if (distanceToNPC < 60) {
            this.merchantPrompt.setVisible(true);
            this.merchantPrompt.setPosition(this.npc.x, this.npc.y - 45);

            if (Phaser.Input.Keyboard.JustDown(this.eKey)) {
                this.purchaseSpeedPowerUp();
            }
        } else {
            this.merchantPrompt.setVisible(false);
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
     * MECÁNICA 4: Ejecución del Salto Doble
     */
    executeDoubleJump() {
        this.player.setVelocityY(-340);
        this.jumpsCount = 2;
        this.lastJumpKeyPressedTime = 0; // Limpiar

        console.log('[Mecánica 4] Doble salto activado en el aire!');

        // Reproducir SFX Salto
        this.playSFX('sfx_jump');
        
        // --- JUICE: Emisor de partículas neón rosadas de propulsión ---
        this.doubleJumpRingEmitter.emitParticleAt(this.player.x, this.player.y + 12, 10);
    }

    /**
     * MECÁNICA 5: Ejecución del Dash Horizontal con Trailing
     */
    executeDash() {
        this.isDashing = true;
        this.dashCooldown = true;
        
        // Quitar gravedad para un desplazamiento totalmente recto
        this.player.body.setAllowGravity(false);
        
        const direction = this.player.flipX ? -1 : 1;
        const dashSpeed = 500;
        
        this.player.setVelocity(direction * dashSpeed, 0);
        this.player.setTint(0xff007f); 

        // SFX de Dash (usando el sonido de salto de forma veloz como fallback)
        this.playSFX('sfx_jump');

        console.log('[Mecánica 5] Dash horizontal ejecutado.');

        // Crear rastro estético de fantasmas traslúcidos
        const trailEvent = this.time.addEvent({
            delay: 30,
            callback: () => {
                const ghost = this.add.image(this.player.x, this.player.y, 'player2');
                ghost.setAlpha(0.4);
                ghost.setFlipX(this.player.flipX);
                ghost.setTint(0xff007f);
                this.tweens.add({
                    targets: ghost,
                    alpha: 0,
                    duration: 200,
                    onComplete: () => ghost.destroy()
                });
            },
            repeat: 3
        });

        // Duración del Dash: 150 ms
        this.time.delayedCall(150, () => {
            if (this.player && this.player.body) {
                this.player.body.setAllowGravity(true);
                this.player.setVelocityX(direction * 180); 
                this.player.clearTint();
                this.isDashing = false;
            }
        });

        // Cooldown de 1 segundo
        this.time.delayedCall(1000, () => {
            this.dashCooldown = false;
            console.log('[Mecánica 5] Cooldown de Dash completado.');
        });
    }

    /**
     * MECÁNICA 6: Compra del Power-up de velocidad al NPC Vendedor
     */
    purchaseSpeedPowerUp() {
        const hudScene = this.scene.get('UIScene');
        if (!hudScene) return;

        const cost = 30;

        if (this.speedMultiplier > 1.0) {
            this.showMerchantDialogue('¡YA TIENES EL CHIP INSTALADO!');
            return;
        }

        if (hudScene.score >= cost) {
            // Descontar score
            this.game.events.emit('dev-add-score', -cost);
            
            console.log(`[Mecánica 6] Compra: -${cost} TOHOL.`);
            this.showMerchantDialogue('🚀 CHIP DE VELOCIDAD INSTALADO (5s)');

            // Reproducir SFX Compra (usando coin de forma inversa)
            this.playSFX('sfx_coin');

            // Aplicar Power-up de velocidad temporal (1.8x)
            this.speedMultiplier = 1.8;
            this.player.setTint(0x39ff14); // Verde de velocidad

            // Efecto de aura de partículas verdes flotantes
            const emitter = this.time.addEvent({
                delay: 100,
                callback: () => {
                    if (this.player && this.speedMultiplier > 1.0) {
                        const p = this.add.circle(this.player.x + (Math.random() - 0.5) * 16, this.player.y + 10, 2, 0x39ff14, 0.7);
                        this.tweens.add({
                            targets: p,
                            y: p.y - 20,
                            alpha: 0,
                            duration: 400,
                            onComplete: () => p.destroy()
                        });
                    }
                },
                loop: true
            });

            // Duración del Power-up: 5 segundos
            this.time.delayedCall(5000, () => {
                this.speedMultiplier = 1.0;
                this.player.clearTint();
                emitter.destroy();
                this.showMerchantDialogue('CHIP AGOTADO. VUELVE PRONTO.');
                this.playSFX('sfx_damage'); // Alerta de expiración
                console.log('[Mecánica 6] Expirado.');
            });

        } else {
            console.warn('[Mecánica 6] Fondos insuficientes.');
            this.showMerchantDialogue('SALDO INSUFICIENTE. COSTO: 30 TOHOL');
            this.cameras.main.shake(100, 0.005);
            this.playSFX('sfx_damage');
        }
    }

    /**
     * Actualiza el diálogo emergente del NPC Merchant con un texto.
     */
    showMerchantDialogue(msg) {
        this.merchantPrompt.setText(msg);
        this.tweens.add({
            targets: this.merchantPrompt,
            scaleX: 1.1,
            scaleY: 1.1,
            duration: 100,
            yoyo: true,
            repeat: 1
        });
    }

    /**
     * CONDICIÓN DE DERROTA: Caída al vacío con efectos JUICE
     */
    handleVoidFall() {
        console.warn('[Game Loop] ¡Caída al vacío!');
        this.applyPlayerDamage();
    }

    /**
     * IA ENEMIGO: Colisión o combate aéreo
     */
    handleEnemyCollision(player, enemy) {
        if (player.body.velocity.y > 0 && player.y < enemy.y - 12) {
            console.log('[Combate IA] ¡Enemigo derrotado!');
            enemy.destroy();
            player.setVelocityY(-280);

            // Sumar score
            this.game.events.emit('add-score', 15);

            // SFX y partículas neón rosadas
            this.playSFX('sfx_coin');
            this.pinkSparkEmitter.emitParticleAt(enemy.x, enemy.y, 8);
        } else {
            console.warn('[Combate IA] Daño lateral de enemigo!');
            this.applyPlayerDamage();
        }
    }

    /**
     * Aplica daño general al jugador con Flash de pantalla, Shake de cámara y SFX.
     */
    applyPlayerDamage() {
        this.game.events.emit('lose-life', 1);

        // --- JUICE: Flash y Shake de daño ---
        this.cameras.main.flash(200, 255, 0, 0);
        this.cameras.main.shake(150, 0.015);

        this.playSFX('sfx_damage');
        this.respawnPlayer();
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
        console.log('[Victory] Portal alcanzado!');
        this.game.events.emit('goal-reached');
    }

    /**
     * (Tiled ha sido eliminado a favor del diseño procedural expandido)
     */
    setupTiledMap() {
        // Obsoleto. El mapa principal ahora se genera en createProceduralLevel.
    }

    /**
     * Construye un escenario procedural amplio (2800px) pensado para Doble Salto y Dash.
     */
    createProceduralLevel() {
        const height = this.cameras.main.height;
        const levelWidth = 2800; // Nivel más largo para aprovechar el Dash

        // Configurar mundo y cámara
        this.physics.world.setBounds(0, 0, levelWidth, height);
        this.cameras.main.setBounds(0, 0, levelWidth, height);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

        // Mover portal al final del nivel
        this.portal.setPosition(levelWidth - 100, height - 72);

        // Título del escenario (Fijo en el fondo)
        this.add.text(400, height / 2 - 60, 'ZONA DE PARKOUR AVANZADO', {
            font: '14px Orbitron',
            fill: '#ff007f',
            fontWeight: 'bold',
            letterSpacing: 2
        }).setOrigin(0.5);

        // Suelo principal con grandes brechas (requieren Dash)
        this.createSolidBlock(0, height - 40, 300, 40);
        this.createSolidBlock(500, height - 40, 200, 40); // Brecha de 200px
        this.createSolidBlock(900, height - 40, 400, 40); // Brecha de 200px
        this.createSolidBlock(1600, height - 40, 200, 40); // Gran brecha
        this.createSolidBlock(2100, height - 40, 300, 40);
        this.createSolidBlock(2600, height - 40, 200, 40);

        // Plataformas altas (requieren Doble Salto)
        const platformPositions = [
            { x: 350, y: height - 160, w: 80 },
            { x: 750, y: height - 220, w: 100 },
            { x: 1100, y: height - 140, w: 120 },
            { x: 1350, y: height - 280, w: 80 },
            { x: 1550, y: height - 160, w: 100 },
            { x: 1850, y: height - 240, w: 120 },
            { x: 2300, y: height - 180, w: 100 },
            { x: 2500, y: height - 260, w: 80 }
        ];
        platformPositions.forEach(p => this.createSolidBlock(p.x, p.y, p.w, 20));

        // Monedas (Puntos adicionales)
        this.spawnCoin(150, height - 120);
        this.spawnCoin(250, height - 120);
        this.spawnCoin(390, height - 200);
        this.spawnCoin(600, height - 150);
        this.spawnCoin(800, height - 280);
        this.spawnCoin(1150, height - 200);
        this.spawnCoin(1390, height - 340);
        this.spawnCoin(1700, height - 150);
        this.spawnCoin(1910, height - 310);
        this.spawnCoin(2350, height - 240);
        this.spawnCoin(2540, height - 320);

        // Paredes
        this.createSolidBlock(0, 40, 15, height - 80);
        this.createSolidBlock(levelWidth - 15, 40, 15, height - 80);

        // --- ROBOT ENEMIGOS PATRULLA (IA MEJORADA) ---
        this.spawnPatrolEnemy(600, height - 72, 80);
        this.spawnPatrolEnemy(1100, height - 72, 120);
        this.spawnPatrolEnemy(1390, height - 312, 30); // Plataforma alta, poco espacio
        this.spawnPatrolEnemy(1910, height - 272, 40);
        this.spawnPatrolEnemy(2250, height - 72, 100);
        this.spawnPatrolEnemy(2700, height - 72, 60);
    }

    spawnCoin(x, y) {
        const coin = this.coins.create(x, y, 'coin');
        coin.play('coin_spin');
        this.tweens.add({
            targets: coin,
            y: y - 10,
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    collectCoin(player, coin) {
        coin.destroy();
        this.playSFX('sfx_coin');
        this.game.events.emit('add-score', 10);
        this.pinkSparkEmitter.emitParticleAt(coin.x, coin.y, 10);
    }

    spawnPatrolEnemy(x, y, patrolDist = 60) {
        const enemy = this.enemies.create(x, y, 'enemy_run');
        enemy.setCollideWorldBounds(true);
        enemy.body.setBounceX(1);
        enemy.body.setVelocityX(-80);
        enemy.body.setSize(20, 35);
        enemy.body.setOffset(14, 13);
        enemy.play('enemy_run');
        enemy.spawnX = x;
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
     * Configuración del NPC Vendedor
     */
    setupNPCMerchant() {
        const height = this.cameras.main.height;
        this.npc = this.physics.add.image(580, height - 152, 'npc');
        this.npc.body.setAllowGravity(false);
        this.npc.body.setImmovable(true);

        this.merchantPrompt = this.add.text(this.npc.x, this.npc.y - 45, 'CHIP DE VELOCIDAD: 30 TOHOL [Presiona E]', {
            font: '10px Orbitron',
            fill: '#39ff14',
            backgroundColor: '#07090e',
            padding: { x: 6, y: 4 }
        }).setOrigin(0.5).setVisible(false);
        
        this.merchantPrompt.setStroke('#39ff14', 1);
    }

    /**
     * SISTEMA DE AUDIO - MÚSICA DE FONDO EN LOOP Y SFX CONTROLADOS
     */
    playBackgroundMusic() {
        try {
            this.sound.stopAll();
            if (this.sound.get('bg_music')) {
                this.sound.play('bg_music', { loop: true, volume: 0.2 });
            }
        } catch (e) {
            console.warn('[Audio Exception] Música no disponible:', e.message);
        }
    }

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
     * Configuración de la tecla ESC para regresar al menú
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
        box.lineStyle(2, 0xff007f, 0.8);
        box.strokeRect(width / 2 - 180, height / 2 - 90, 360, 180);
        this.pauseContainer.add(box);

        const title = this.add.text(width / 2, height / 2 - 55, 'SIMULACIÓN PAUSADA', {
            font: '16px Orbitron',
            fill: '#ff007f',
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
            fill: '#00f2fe',
            fontWeight: 'bold'
        }).setOrigin(0.5);
        this.pauseContainer.add(note2);

        console.log('[Level 2] Pausa activa.');
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

        console.log('[Level 2] Pausa desactivada.');
    }
}
