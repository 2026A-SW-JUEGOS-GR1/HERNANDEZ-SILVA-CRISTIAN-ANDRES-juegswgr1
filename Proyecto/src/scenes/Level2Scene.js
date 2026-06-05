/**
 * ==========================================================================
 * NEXUS LIFE - Nivel 2: DISTRITO SOCIAL
 * --------------------------------------------------------------------------
 * Mecánicas del Estudiante B (Punk):
 *   4) PARKOUR SOCIAL (Doble salto + Dash) — para alcanzar las terrazas
 *      donde ocurren las fiestas y eventos exclusivos.
 *   5) EVENTOS SOCIALES — zonas marcadas con grupos de NPCs anfitriones.
 *      Pulsa E para socializar y ganar REPUTACIÓN.
 *   6) BOTS DE SEGURIDAD MAL CONFIGURADOS — patrullan, dañan al tocarlos
 *      lateralmente, pero pueden ser desactivados pisándolos desde arriba.
 *
 * Concepto narrativo: una noche de eventos. Acumula 50+ de REPUTACIÓN antes
 * de que termine la fiesta y llega al PORTAL para acceder al evento principal.
 * ==========================================================================
 */

export default class Level2Scene extends Phaser.Scene {
    constructor() {
        super({ key: 'Level2Scene' });
    }

    init() {
        this.isPaused = false;
        this.jumpsCount = 0;
        this.isDashing = false;
        this.dashCooldown = false;
        this.speedMultiplier = 1.0;

        this.coyoteTimeDuration = 100;
        this.jumpBufferDuration = 150;
        this.lastTimeOnGround = 0;
        this.lastJumpKeyPressedTime = 0;

        // Control de cooldown de eventos sociales (evita farmear)
        this.lastSocializeTime = 0;
        this.socializeCooldown = 2000;
    }

    create() {
        console.log('[Scene Manager] Level2Scene -> DISTRITO SOCIAL');

        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.physics.world.gravity.y = 800;
        this.cameras.main.fadeIn(500, 11, 15, 25);
        this.playBackgroundMusic();
        this.setupParallaxBackground(width, height);

        // HUD social
        this.scene.launch('UIScene');
        this.time.delayedCall(50, () => {
            this.game.events.emit('set-level-mode', {
                mode: 'social',
                label: 'DISTRITO SOCIAL · Reputación mínima: 50'
            });
        });

        // Grupos físicos
        this.platforms    = this.physics.add.staticGroup();
        this.securityBots = this.physics.add.group();        // Enemigos (bots mal configurados)
        this.citizens     = this.physics.add.staticGroup();  // Ciudadanos peatones
        this.hosts        = this.physics.add.staticGroup();  // Anfitriones de eventos
        this.eventZones   = this.physics.add.staticGroup();  // Plataformas de eventos

        // Jugador 2 (Punk) - asistente del Distrito Social
        this.player = this.physics.add.sprite(100, 300, 'player2_idle');
        this.player.setCollideWorldBounds(true);
        this.player.setBounce(0.05);
        this.player.body.setSize(20, 38);
        this.player.body.setOffset(14, 10);

        this.anims.create({ key: 'p2_idle',       frames: this.anims.generateFrameNumbers('player2_idle',       { start: 0, end: 3 }), frameRate: 8,  repeat: -1 });
        this.anims.create({ key: 'p2_run',        frames: this.anims.generateFrameNumbers('player2_run',        { start: 0, end: 5 }), frameRate: 10, repeat: -1 });
        this.anims.create({ key: 'p2_jump',       frames: this.anims.generateFrameNumbers('player2_jump',       { start: 0, end: 3 }), frameRate: 10, repeat: 0  });
        this.anims.create({ key: 'p2_doublejump', frames: this.anims.generateFrameNumbers('player2_doublejump', { start: 0, end: 5 }), frameRate: 12, repeat: 0  });
        this.anims.create({ key: 'sec_run',       frames: this.anims.generateFrameNumbers('enemy_run',          { start: 0, end: 5 }), frameRate: 8,  repeat: -1 });
        this.player.play('p2_idle');

        // Portal del evento principal
        this.portal = this.physics.add.sprite(750, height - 72, 'portal');
        this.portal.body.setAllowGravity(false);
        this.portal.body.setImmovable(true);

        this.createProceduralLevel();

        // Partículas
        this.pinkSparkEmitter = this.add.particles(0, 0, 'particle_spark', {
            speed: { min: 80, max: 200 },
            scale: { start: 1.3, end: 0 },
            blendMode: 'ADD',
            lifespan: 550,
            gravityY: 120,
            emitting: false
        });
        this.doubleJumpRingEmitter = this.add.particles(0, 0, 'particle_spark', {
            speed: { min: 40, max: 120 },
            scale: { start: 1, end: 0 },
            blendMode: 'ADD',
            lifespan: 350,
            emitting: false
        });

        // Colisiones
        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.collider(this.securityBots, this.platforms);
        this.physics.add.collider(this.player, this.securityBots, this.handleBotCollision, null, this);
        this.physics.add.overlap(this.player, this.portal, this.handleMainEvent, null, this);

        // Controles
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys({
            up:    Phaser.Input.Keyboard.KeyCodes.W,
            down:  Phaser.Input.Keyboard.KeyCodes.S,
            left:  Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });
        this.shiftKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
        this.eKey     = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
        this.escKey   = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
        this.qKey     = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);

        // Texto HUD inferior
        this.add.text(20, height - 30,
            'DISTRITO SOCIAL · [SHIFT] Dash · [E] Socializar/Bailar · [ESC] Pausa',
            { font: '11px Orbitron', fill: '#ff007f', fontWeight: 'bold' }
        ).setScrollFactor(0);

        this.add.text(width / 2, 50,
            'Acércate a los anfitriones VERDES y pulsa [E] para ganar REPUTACIÓN',
            { font: '10px Inter', fill: '#9ca3af' }
        ).setOrigin(0.5).setScrollFactor(0);

        // Prompt contextual
        this.contextPrompt = this.add.text(0, 0, '', {
            font: '10px Orbitron',
            fill: '#ffffff',
            backgroundColor: '#07090e',
            padding: { x: 6, y: 4 }
        }).setOrigin(0.5).setVisible(false).setDepth(50);

        this.setupNavigation();

        // Reactivar música al desbloquear el audio (política autoplay del navegador).
        // Usamos una bandera global window para no perder el evento si se emitió
        // antes de que esta escena existiera.
        if (window.__nexusAudioUnlocked) {
            this.playBackgroundMusic();
        } else {
            this.game.events.once('audio-unlocked', () => {
                window.__nexusAudioUnlocked = true;
                this.playBackgroundMusic();
            });
        }

        // Detener música automáticamente al cambiar de escena
        this.events.once('shutdown', () => {
            this.stopBackgroundMusic();
        });
    }

    update() {
        const hud = this.scene.get('UIScene');
        if (this.isPaused || hud.gameOver || hud.victory) {
            this.player.setVelocityX(0);
            return;
        }

        // Parallax
        const cameraScrollX = this.cameras.main.scrollX;
        this.bgFar.tilePositionX  = cameraScrollX * 0.1;
        this.bgNear.tilePositionX = cameraScrollX * 0.35;

        // Caída al vacío
        if (this.player.y > this.cameras.main.height + 40) {
            this.handleVoidFall();
        }

        if (this.isDashing) return;

        const isTouchingGround = this.player.body.blocked.down || this.player.body.touching.down;

        // Movimiento horizontal
        const baseSpeed = 180 * this.speedMultiplier;
        if (this.cursors.left.isDown || this.wasd.left.isDown) {
            this.player.setVelocityX(-baseSpeed);
            this.player.setFlipX(true);
            if (isTouchingGround) this.player.anims.play('p2_run', true);
        } else if (this.cursors.right.isDown || this.wasd.right.isDown) {
            this.player.setVelocityX(baseSpeed);
            this.player.setFlipX(false);
            if (isTouchingGround) this.player.anims.play('p2_run', true);
        } else {
            this.player.setVelocityX(0);
            if (isTouchingGround) this.player.anims.play('p2_idle', true);
        }

        if (!isTouchingGround) {
            if (this.jumpsCount === 2) this.player.anims.play('p2_doublejump', true);
            else this.player.anims.play('p2_jump', true);
        }

        // Coyote + Buffer
        if (isTouchingGround) {
            this.jumpsCount = 0;
            this.lastTimeOnGround = this.time.now;
        }

        const jumpPressed = Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
                            Phaser.Input.Keyboard.JustDown(this.cursors.space) ||
                            Phaser.Input.Keyboard.JustDown(this.wasd.up);

        if (jumpPressed) {
            this.lastJumpKeyPressedTime = this.time.now;
            if (!isTouchingGround && this.jumpsCount === 1) {
                this.executeDoubleJump();
            }
        }

        const canFirstJump  = isTouchingGround || (this.time.now - this.lastTimeOnGround < this.coyoteTimeDuration);
        const hasJumpBuffer = (this.time.now - this.lastJumpKeyPressedTime < this.jumpBufferDuration);
        if (canFirstJump && hasJumpBuffer && this.jumpsCount === 0) {
            this.player.setVelocityY(-360);
            this.jumpsCount = 1;
            this.lastJumpKeyPressedTime = 0;
            this.lastTimeOnGround = 0;
            this.playSFX('sfx_jump');
            this.doubleJumpRingEmitter.emitParticleAt(this.player.x, this.player.y + 16, 4);
        }

        // Dash
        if (Phaser.Input.Keyboard.JustDown(this.shiftKey) && !this.dashCooldown) {
            this.executeDash();
        }

        // MECÁNICA 5: Eventos sociales (cercanía + tecla E)
        this.updateContextPrompt();
        if (Phaser.Input.Keyboard.JustDown(this.eKey)) {
            this.tryToSocialize();
        }

        // MECÁNICA 6: Patrulla de bots de seguridad
        this.securityBots.getChildren().forEach(bot => {
            if (bot.body.blocked.left || bot.body.touching.left || bot.x < bot.spawnX - bot.patrolDist) {
                bot.body.setVelocityX(80);
                bot.setFlipX(true);
            } else if (bot.body.blocked.right || bot.body.touching.right || bot.x > bot.spawnX + bot.patrolDist) {
                bot.body.setVelocityX(-80);
                bot.setFlipX(false);
            }
        });
    }

    // ======================================================================
    // CONSTRUCCIÓN DEL NIVEL
    // ======================================================================

    createProceduralLevel() {
        const height = this.cameras.main.height;
        const levelWidth = 2800;

        this.physics.world.setBounds(0, 0, levelWidth, height);
        this.cameras.main.setBounds(0, 0, levelWidth, height);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.portal.setPosition(levelWidth - 100, height - 72);

        // Título flotante de zona (fijo en el mapa)
        this.add.text(400, height / 2 - 60, 'PLAZA DE EVENTOS NOCTURNOS', {
            font: '13px Orbitron',
            fill: '#ff007f',
            fontWeight: 'bold',
            letterSpacing: 2
        }).setOrigin(0.5);

        // Suelo con brechas (requieren Dash)
        this.createSolidBlock(0,    height - 40, 300, 40);
        this.createSolidBlock(500,  height - 40, 200, 40);
        this.createSolidBlock(900,  height - 40, 400, 40);
        this.createSolidBlock(1600, height - 40, 200, 40);
        this.createSolidBlock(2100, height - 40, 300, 40);
        this.createSolidBlock(2600, height - 40, 200, 40);

        // Plataformas altas (azoteas, terrazas, requieren doble salto)
        const plats = [
            { x: 350,  y: height - 160, w: 80  },
            { x: 750,  y: height - 220, w: 100 },
            { x: 1100, y: height - 140, w: 120 },
            { x: 1350, y: height - 280, w: 80  },
            { x: 1550, y: height - 160, w: 100 },
            { x: 1850, y: height - 240, w: 120 },
            { x: 2300, y: height - 180, w: 100 },
            { x: 2500, y: height - 260, w: 80  }
        ];
        plats.forEach(p => this.createSolidBlock(p.x, p.y, p.w, 20));

        // Paredes
        this.createSolidBlock(0, 40, 15, height - 80);
        this.createSolidBlock(levelWidth - 15, 40, 15, height - 80);

        // === MECÁNICA 5: EVENTOS SOCIALES ===
        // Cada evento tiene una plataforma decorativa de evento + un anfitrión + ciudadanos invitados
        this.createEventArea(220,  height - 72, 'After-Party Neon');
        this.createEventArea(1100, height - 72, 'Concierto Holográfico');
        this.createEventArea(1380, height - 312, 'Meet & Greet VIP');   // En plataforma alta
        this.createEventArea(1880, height - 272, 'Galería Cyber');      // En plataforma alta
        this.createEventArea(2200, height - 72, 'Mercado Social');
        this.createEventArea(2650, height - 72, 'Fiesta de Cierre');

        // === MECÁNICA 6: BOTS DE SEGURIDAD MAL CONFIGURADOS ===
        this.spawnSecurityBot(600,  height - 72, 80);
        this.spawnSecurityBot(1500, height - 72, 100);
        this.spawnSecurityBot(2400, height - 72, 110);
    }

    createSolidBlock(x, y, w, h) {
        const tile = this.add.tileSprite(x + w / 2, y + h / 2, w, h, 'platform_tile');
        this.physics.add.existing(tile, true);
        this.platforms.add(tile);
    }

    /**
     * Crea un área de evento social: plataforma de evento brillante + anfitrión + 1-2 invitados
     */
    createEventArea(x, y, eventName) {
        // Plataforma decorativa (sprite visual sin colisión)
        const ez = this.eventZones.create(x, y + 8, 'event_zone');
        ez.body.checkCollision.none = true;
        this.tweens.add({
            targets: ez,
            alpha: 0.5,
            duration: 700,
            yoyo: true,
            repeat: -1
        });

        // Anfitrión (NPC estático, sólo referencia de posición para colisión de proximidad)
        const host = this.hosts.create(x, y - 16, 'npc_host');
        host.body.checkCollision.none = true; // la detección es por distancia, no física
        host.eventName = eventName;
        host.lastInteracted = 0;

        const starIcon = this.add.image(x, y - 48, 'icon_star');
        this.tweens.add({
            targets: starIcon,
            y: y - 54,
            duration: 600,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Nombre del evento
        this.add.text(x, y + 22, eventName, {
            font: '9px Orbitron',
            fill: '#39ff14',
            backgroundColor: '#07090e',
            padding: { x: 4, y: 2 }
        }).setOrigin(0.5);

        // Invitados ambientales (1 o 2 ciudadanos a los lados)
        this.spawnCitizen(x - 40, y - 16);
        if (Math.random() > 0.4) this.spawnCitizen(x + 40, y - 16);
    }

    spawnCitizen(x, y) {
        const c = this.citizens.create(x, y, 'npc_citizen');
        c.body.checkCollision.none = true;
        this.tweens.add({
            targets: c,
            x: x + 20 * (Math.random() > 0.5 ? 1 : -1),
            duration: 1800 + Math.random() * 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
            onUpdate: () => c.setFlipX(c.body.velocity.x < 0)
        });
    }

    spawnSecurityBot(x, y, patrolDist = 60) {
        const bot = this.securityBots.create(x, y, 'enemy_run');
        bot.setCollideWorldBounds(true);
        bot.body.setBounceX(1);
        bot.body.setVelocityX(-80);
        bot.body.setSize(20, 35);
        bot.body.setOffset(14, 13);
        bot.setTint(0xff0055); // Tinte rojo amenazante
        bot.play('sec_run');
        bot.spawnX = x;
        bot.patrolDist = patrolDist;
    }

    // ======================================================================
    // MECÁNICA 4: DOBLE SALTO Y DASH
    // ======================================================================

    executeDoubleJump() {
        this.player.setVelocityY(-340);
        this.jumpsCount = 2;
        this.lastJumpKeyPressedTime = 0;
        this.playSFX('sfx_jump');
        this.doubleJumpRingEmitter.emitParticleAt(this.player.x, this.player.y + 12, 10);
    }

    executeDash() {
        this.isDashing = true;
        this.dashCooldown = true;
        this.player.body.setAllowGravity(false);

        const direction = this.player.flipX ? -1 : 1;
        const dashSpeed = 500;

        this.player.setVelocity(direction * dashSpeed, 0);
        this.player.setTint(0xff007f);

        this.playSFX('sfx_jump');

        // Rastro de fantasmas
        this.time.addEvent({
            delay: 30,
            callback: () => {
                if (!this.player || !this.player.active) return;
                const ghost = this.add.image(this.player.x, this.player.y, 'player2_idle');
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

        this.time.delayedCall(150, () => {
            if (this.player && this.player.body) {
                this.player.body.setAllowGravity(true);
                this.player.setVelocityX(direction * 180);
                this.player.clearTint();
                this.isDashing = false;
            }
        });
        this.time.delayedCall(1000, () => { this.dashCooldown = false; });
    }

    // ======================================================================
    // MECÁNICA 5: EVENTOS SOCIALES (socializar con anfitriones)
    // ======================================================================

    updateContextPrompt() {
        let nearest = null;
        let msg = '';

        this.hosts.getChildren().forEach(h => {
            const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, h.x, h.y);
            if (d < 60 && (!nearest || d < nearest.dist)) {
                nearest = { obj: h, dist: d };
                const onCD = this.time.now - h.lastInteracted < 5000;
                msg = onCD
                    ? `${h.eventName} (espera...)`
                    : `[E] ASISTIR a ${h.eventName} (+10 REP)`;
            }
        });

        if (nearest) {
            this.contextPrompt
                .setText(msg)
                .setPosition(this.player.x, this.player.y - 50)
                .setVisible(true);
        } else {
            this.contextPrompt.setVisible(false);
        }
    }

    tryToSocialize() {
        if (this.time.now - this.lastSocializeTime < this.socializeCooldown) return;

        let nearest = null;
        let bestDist = 60;
        this.hosts.getChildren().forEach(h => {
            const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, h.x, h.y);
            if (d < bestDist) { bestDist = d; nearest = h; }
        });
        if (!nearest) return;

        // Cooldown por anfitrión
        if (this.time.now - nearest.lastInteracted < 5000) {
            this.flashPrompt('Este anfitrión ya te conoce', '#9ca3af');
            return;
        }

        nearest.lastInteracted = this.time.now;
        this.lastSocializeTime = this.time.now;

        // Premio: +10 REP por evento normal
        this.game.events.emit('add-reputation', 10);
        this.playSFX('sfx_coin');
        this.pinkSparkEmitter.emitParticleAt(nearest.x, nearest.y - 8, 12);
        this.flashPrompt(`🎉 +10 REP · ${nearest.eventName}`, '#39ff14');
    }

    // ======================================================================
    // MECÁNICA 6: BOTS DE SEGURIDAD
    // ======================================================================

    handleBotCollision(player, bot) {
        // Saltarle encima = desactivarlo y bonificación de reputación
        if (player.body.velocity.y > 0 && player.y < bot.y - 12) {
            bot.destroy();
            player.setVelocityY(-280);
            this.game.events.emit('add-reputation', 5);
            this.playSFX('sfx_coin');
            this.pinkSparkEmitter.emitParticleAt(bot.x, bot.y, 10);
            this.flashPrompt('🛡 BOT REINICIADO · +5 REP', '#00f2fe');
        } else {
            // Daño lateral
            this.applyEnergyDamage();
        }
    }

    // ======================================================================
    // DAÑO Y VICTORIA
    // ======================================================================

    handleVoidFall() {
        this.applyEnergyDamage();
    }

    applyEnergyDamage() {
        this.game.events.emit('change-energy', -1);
        this.cameras.main.flash(200, 255, 0, 0);
        this.cameras.main.shake(150, 0.015);
        this.playSFX('sfx_damage');
        this.respawnPlayer();
    }

    respawnPlayer() {
        const hud = this.scene.get('UIScene');
        if (hud.energy > 0) {
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

    handleMainEvent() {
        this.game.events.emit('goal-reached', {
            type: 'social',
            minReputation: 50
        });
    }

    // ======================================================================
    // HELPERS
    // ======================================================================

    flashPrompt(msg, color = '#ffffff') {
        const t = this.add.text(this.player.x, this.player.y - 65, msg, {
            font: '11px Orbitron',
            fill: color,
            backgroundColor: '#07090e',
            padding: { x: 6, y: 3 }
        }).setOrigin(0.5).setDepth(60);

        this.tweens.add({
            targets: t,
            y: t.y - 30,
            alpha: 0,
            duration: 1200,
            onComplete: () => t.destroy()
        });
    }

    setupParallaxBackground(width, height) {
        this.bgSky = this.add.tileSprite(0, 0, width, height, 'bg_sky')
            .setOrigin(0).setScrollFactor(0);
        this.bgFar = this.add.tileSprite(0, 40, width, height - 40, 'bg_far')
            .setOrigin(0).setScrollFactor(0.1, 0);
        this.bgNear = this.add.tileSprite(0, 40, width, height - 40, 'bg_near')
            .setOrigin(0).setScrollFactor(0.35, 0);
    }

    playBackgroundMusic() {
        // Siempre detener cualquier música previa antes de iniciar una nueva
        this.stopBackgroundMusic();

        const tryPlay = () => {
            try {
                if (!this.cache.audio.has('bg_music')) return;
                if (this._bgMusicInstance) {
                    if (!this._bgMusicInstance.isPlaying) this._bgMusicInstance.play();
                    return;
                }
                this._bgMusicInstance = this.sound.add('bg_music', { loop: true, volume: 0.35 });
                this._bgMusicInstance.play();
                console.log('[Audio] Música de fondo (Distrito Social) iniciada.');
            } catch (e) {
                console.warn('[Audio] Error al reproducir música:', e);
            }
        };

        if (this.sound.context && this.sound.context.state === 'running') {
            tryPlay();
        } else {
            const onStateChange = () => {
                if (this.sound.context && this.sound.context.state === 'running') {
                    this.sound.context.removeEventListener('statechange', onStateChange);
                    tryPlay();
                }
            };
            if (this.sound.context) {
                this.sound.context.addEventListener('statechange', onStateChange);
            }
            tryPlay();
        }
    }

    stopBackgroundMusic() {
        try {
            if (this._bgMusicInstance) {
                this._bgMusicInstance.stop();
                this._bgMusicInstance.destroy();
                this._bgMusicInstance = null;
                console.log('[Audio] Música de fondo detenida.');
            }
            this.sound.stopAll();
        } catch (e) { /* silencio */ }
    }

    playSFX(key) {
        try {
            if (this.cache.audio.has(key)) {
                this.sound.play(key, { volume: 0.6 });
            }
        } catch (e) { /* silencio */ }
    }

    // ======================================================================
    // MENÚ DE PAUSA
    // ======================================================================

    setupNavigation() {
        this.escKey.on('down', () => {
            const hud = this.scene.get('UIScene');
            if (hud.gameOver || hud.victory) return;
            if (this.isPaused) this.resumeGame();
            else this.pauseGame();
        });

        this.enterKey.on('down', () => {
            if (this.isPaused) this.resumeGame();
        });

        this.qKey.on('down', () => {
            if (this.isPaused) {
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

        // Pausar música de fondo
        if (this._bgMusicInstance && this._bgMusicInstance.isPlaying) {
            this._bgMusicInstance.pause();
        }

        const hud = this.scene.get('UIScene');
        if (hud.timerEvent) hud.timerEvent.paused = true;

        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const cam = this.cameras.main;
        const cx = cam.scrollX + width / 2;
        const cy = cam.scrollY + height / 2;

        this.pauseContainer = this.add.container(cx, cy).setDepth(120);

        const overlay = this.add.graphics();
        overlay.fillStyle(0x07090e, 0.85);
        overlay.fillRect(-width / 2, -height / 2, width, height);
        this.pauseContainer.add(overlay);

        const box = this.add.graphics();
        box.fillStyle(0x111928, 0.95);
        box.fillRect(-180, -90, 360, 180);
        box.lineStyle(2, 0xff007f, 0.8);
        box.strokeRect(-180, -90, 360, 180);
        this.pauseContainer.add(box);

        this.pauseContainer.add(this.add.text(0, -55, 'EVENTO EN PAUSA', {
            font: '16px Orbitron', fill: '#ff007f', fontWeight: 'bold', letterSpacing: 2
        }).setOrigin(0.5));

        this.pauseContainer.add(this.add.text(0, -5, 'Presiona [ENTER] o [ESC] para Reanudar', {
            font: '12px Inter', fill: '#f3f4f6'
        }).setOrigin(0.5));

        this.pauseContainer.add(this.add.text(0, 35, 'Presiona [Q] para Salir al Menú Principal', {
            font: '12px Inter', fill: '#00f2fe', fontWeight: 'bold'
        }).setOrigin(0.5));
    }

    resumeGame() {
        this.isPaused = false;
        this.physics.resume();
        this.tweens.resumeAll();

        // Reanudar música de fondo
        if (this._bgMusicInstance && this._bgMusicInstance.isPaused) {
            this._bgMusicInstance.resume();
        }

        const hud = this.scene.get('UIScene');
        if (hud.timerEvent) hud.timerEvent.paused = false;

        if (this.pauseContainer) {
            this.pauseContainer.destroy();
            this.pauseContainer = null;
        }
    }
}
