/**
 * ==========================================================================
 * NEXUS LIFE - Nivel 1: DISTRITO FINANCIERO
 * --------------------------------------------------------------------------
 * Mecánicas del Estudiante A (Biker):
 *   1) TRABAJOS DE ENTREGA: recoger paquetes y entregarlos a NPCs cliente.
 *   2) TIENDA MULTI-ÍTEM: NPC vendedor con menú de propiedades/mejoras.
 *   3) GLITCHES DEL SISTEMA: zonas corruptas que drenan energía.
 *
 * Concepto narrativo: el jugador es un ciudadano recién conectado a NEXUS
 * que debe cumplir su jornada laboral antes de que se cierre el horario.
 * Cuota mínima de victoria: 100 TOHOL.
 * ==========================================================================
 */

export default class Level1Scene extends Phaser.Scene {
    constructor() {
        super({ key: 'Level1Scene' });
    }

    init() {
        this.isPaused = false;

        // --- Controles precisos del taller ---
        this.coyoteTimeDuration = 100;
        this.jumpBufferDuration = 150;
        this.lastTimeOnGround = 0;
        this.lastJumpKeyPressedTime = 0;
        this.jumpsCount = 0;

        // --- Sistema de trabajos ---
        this.carriedPackage = null;  // Referencia al paquete que el jugador transporta
        this.activeClient = null;    // NPC actual con quest activo (con !)
        this.jobsCompleted = 0;

        // --- Tienda ---
        this.shopOpen = false;
        this.shopItems = [
            { key: 'recarga',  label: 'RECARGA ENERGÍA',     price: 50,  effect: 'energy' },
            { key: 'chip',     label: 'CHIP VELOCIDAD (5s)', price: 30,  effect: 'speed' },
            { key: 'avatar',   label: 'AVATAR PREMIUM',      price: 80,  effect: 'cosmetic' },
            { key: 'vehiculo', label: 'VEHÍCULO PRIVADO',    price: 150, effect: 'trophy' },
            { key: 'casa',     label: 'PROPIEDAD DIGITAL',   price: 250, effect: 'trophy' }
        ];
        this.purchasedTrophies = [];
        this.speedMultiplier = 1.0;
    }

    create() {
        console.log('[Scene Manager] Level1Scene -> DISTRITO FINANCIERO');

        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Físicas y cámara base
        this.physics.world.gravity.y = 800;
        this.cameras.main.fadeIn(500, 11, 15, 25);
        this.playBackgroundMusic();
        this.setupParallaxBackground(width, height);

        // Lanzar HUD y notificarle el modo
        this.scene.launch('UIScene');
        this.time.delayedCall(50, () => {
            this.game.events.emit('set-level-mode', {
                mode: 'work',
                label: 'DISTRITO FINANCIERO · Cuota: 100 TOHOL'
            });
        });

        // Grupos físicos
        this.platforms = this.physics.add.staticGroup();
        this.glitches  = this.physics.add.staticGroup();   // Antes "hazards"
        this.packages  = this.physics.add.group();         // Paquetes recogibles
        this.citizens  = this.physics.add.staticGroup();   // NPCs ambientales (no hostiles)
        this.clients   = this.physics.add.staticGroup();   // NPCs con quest activo
        this.vendors   = this.physics.add.staticGroup();   // NPCs vendedores

        // Jugador 1 (Biker) - ciudadano del Distrito Financiero
        this.player = this.physics.add.sprite(100, 300, 'player1_idle');
        this.player.setCollideWorldBounds(true);
        this.player.setBounce(0.05);
        this.player.body.setGravityY(100);
        this.player.body.setSize(20, 38);
        this.player.body.setOffset(14, 10);

        this.anims.create({ key: 'p1_idle',         frames: this.anims.generateFrameNumbers('player1_idle',        { start: 0, end: 3 }), frameRate: 8,  repeat: -1 });
        this.anims.create({ key: 'p1_run',          frames: this.anims.generateFrameNumbers('player1_run',         { start: 0, end: 5 }), frameRate: 10, repeat: -1 });
        this.anims.create({ key: 'p1_jump',         frames: this.anims.generateFrameNumbers('player1_jump',        { start: 0, end: 3 }), frameRate: 10, repeat: 0  });
        this.anims.create({ key: 'p1_doublejump',   frames: this.anims.generateFrameNumbers('player1_doublejump',  { start: 0, end: 5 }), frameRate: 12, repeat: 0  });
        this.anims.create({ key: 'citizen_idle',    frames: this.anims.generateFrameNumbers('enemy_idle',          { start: 0, end: 3 }), frameRate: 4,  repeat: -1 });
        this.player.play('p1_idle');

        // Portal de meta (oficina de cierre de jornada)
        this.portal = this.physics.add.sprite(750, height - 72, 'portal');
        this.portal.body.setAllowGravity(false);
        this.portal.body.setImmovable(true);

        // Construir nivel
        this.createProceduralLevel();

        // Partículas
        this.coinSparkEmitter = this.add.particles(0, 0, 'particle_spark', {
            speed: { min: 60, max: 180 },
            scale: { start: 1.2, end: 0 },
            blendMode: 'ADD',
            lifespan: 500,
            gravityY: 100,
            emitting: false
        });
        this.jumpSparkEmitter = this.add.particles(0, 0, 'particle_spark', {
            speed: { min: 20, max: 80 },
            scale: { start: 0.8, end: 0 },
            blendMode: 'ADD',
            lifespan: 300,
            emitting: false
        });

        // Colisiones
        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.overlap(this.player, this.packages, this.pickupPackage, null, this);
        this.physics.add.collider(this.player, this.glitches, this.handleGlitchDamage, null, this);
        this.physics.add.overlap(this.player, this.portal, this.handleEndOfShift, null, this);

        // Glitch parpadeante para reforzar la idea de error
        this.glitches.getChildren().forEach(g => {
            this.tweens.add({
                targets: g,
                alpha: 0.45,
                duration: 250 + Math.random() * 150,
                yoyo: true,
                repeat: -1
            });
        });

        // Plataforma móvil (transporte de carga del distrito)
        this.setupMovingPlatform();

        // Controles
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys({
            up:    Phaser.Input.Keyboard.KeyCodes.W,
            down:  Phaser.Input.Keyboard.KeyCodes.S,
            left:  Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });
        this.eKey     = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
        this.escKey   = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
        this.qKey     = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
        this.num1Key  = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
        this.num2Key  = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);
        this.num3Key  = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE);
        this.num4Key  = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.FOUR);
        this.num5Key  = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.FIVE);

        // Instrucciones HUD (fijas en cámara)
        this.add.text(20, height - 30,
            'DISTRITO FINANCIERO  ·  [E] Recoger / Entregar / Tienda  ·  [ESC] Pausa',
            { font: '11px Orbitron', fill: '#f5d061', fontWeight: 'bold' }
        ).setScrollFactor(0);

        // Prompt contextual reutilizable
        this.contextPrompt = this.add.text(0, 0, '', {
            font: '10px Orbitron',
            fill: '#ffffff',
            backgroundColor: '#07090e',
            padding: { x: 6, y: 4 }
        }).setOrigin(0.5).setVisible(false).setDepth(50);

        // Indicador del paquete que llevas
        this.carryIndicator = this.add.text(20, 50,
            'Paquetes entregados: 0', {
            font: '10px Inter',
            fill: '#9ca3af'
        }).setScrollFactor(0);

        // Menú de tienda (oculto por defecto)
        this.shopContainer = null;

        // Menú de pausa
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

        // Caída al vacío -> daño + respawn
        if (this.player.y > this.cameras.main.height + 40) {
            this.handleVoidFall();
        }

        // Si la tienda está abierta, congela controles de movimiento
        if (this.shopOpen) {
            this.player.setVelocityX(0);
            this.handleShopInput();
            return;
        }

        // --- Plataforma: detección de suelo ---
        const isTouchingGround = this.player.body.blocked.down || this.player.body.touching.down;
        if (isTouchingGround) {
            this.lastTimeOnGround = this.time.now;
            this.jumpsCount = 0;
        }

        if (!isTouchingGround) {
            if (this.jumpsCount === 2) this.player.anims.play('p1_doublejump', true);
            else this.player.anims.play('p1_jump', true);
        }

        // --- Movimiento horizontal ---
        const speed = 180 * this.speedMultiplier;
        if (this.cursors.left.isDown || this.wasd.left.isDown) {
            this.player.setVelocityX(-speed);
            this.player.setFlipX(true);
            if (isTouchingGround) this.player.anims.play('p1_run', true);
        } else if (this.cursors.right.isDown || this.wasd.right.isDown) {
            this.player.setVelocityX(speed);
            this.player.setFlipX(false);
            if (isTouchingGround) this.player.anims.play('p1_run', true);
        } else {
            this.player.setVelocityX(0);
            if (isTouchingGround) this.player.anims.play('p1_idle', true);
        }

        // --- Saltos con Coyote + Buffer ---
        const jumpPressed = Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
                            Phaser.Input.Keyboard.JustDown(this.cursors.space) ||
                            Phaser.Input.Keyboard.JustDown(this.wasd.up);

        if (jumpPressed) {
            this.lastJumpKeyPressedTime = this.time.now;
            if (!isTouchingGround && this.jumpsCount === 1) {
                this.player.setVelocityY(-340);
                this.jumpsCount = 2;
                this.lastJumpKeyPressedTime = 0;
                this.playSFX('sfx_jump');
                this.jumpSparkEmitter.emitParticleAt(this.player.x, this.player.y + 16, 8);
            }
        }

        const canFirstJump  = isTouchingGround || (this.time.now - this.lastTimeOnGround < this.coyoteTimeDuration);
        const hasJumpBuffer = (this.time.now - this.lastJumpKeyPressedTime < this.jumpBufferDuration);
        if (canFirstJump && hasJumpBuffer && this.jumpsCount === 0) {
            this.player.setVelocityY(-380);
            this.jumpsCount = 1;
            this.lastJumpKeyPressedTime = 0;
            this.lastTimeOnGround = 0;
            this.playSFX('sfx_jump');
            this.jumpSparkEmitter.emitParticleAt(this.player.x, this.player.y + 16, 5);
        }

        // Si lleva un paquete, hacerlo "flotar" sobre la cabeza
        if (this.carriedPackage) {
            this.carriedPackage.x = this.player.x;
            this.carriedPackage.y = this.player.y - 32;
        }

        // --- Interacciones contextuales (E) ---
        this.updateContextPrompt();

        if (Phaser.Input.Keyboard.JustDown(this.eKey)) {
            this.handleInteraction();
        }
    }

    // ======================================================================
    // CONSTRUCCIÓN DEL NIVEL
    // ======================================================================

    createProceduralLevel() {
        const height = this.cameras.main.height;
        const levelWidth = 2600;

        this.physics.world.setBounds(0, 0, levelWidth, height);
        this.cameras.main.setBounds(0, 0, levelWidth, height);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.portal.setPosition(levelWidth - 100, height - 72);

        // Suelo segmentado (calles del distrito)
        this.createSolidBlock(0,    height - 40, 420, 40);
        this.createSolidBlock(490,  height - 40, 320, 40);
        this.createSolidBlock(880,  height - 40, 360, 40);
        this.createSolidBlock(1310, height - 40, 240, 40);
        this.createSolidBlock(1620, height - 40, 480, 40);
        this.createSolidBlock(2170, height - 40, 260, 40);
        this.createSolidBlock(2490, height - 40, 200, 40);

        // Plataformas elevadas (techos, edificios)
        const plats = [
            { x: 250, y: height - 130, w: 100 },
            { x: 500, y: height - 200, w: 120 },
            { x: 770, y: height - 150, w: 100 },
            { x: 990, y: height - 220, w: 150 },
            { x: 1340, y: height - 170, w: 100 },
            { x: 1500, y: height - 250, w: 100 },
            { x: 1750, y: height - 180, w: 130 },
            { x: 1980, y: height - 230, w: 100 },
            { x: 2250, y: height - 160, w: 100 }
        ];
        plats.forEach(p => this.createSolidBlock(p.x, p.y, p.w, 20));

        // Paredes
        this.createSolidBlock(0, 40, 15, height - 80);
        this.createSolidBlock(levelWidth - 15, 40, 15, height - 80);

        // === MECÁNICA 3: GLITCHES DEL SISTEMA ===
        const glitchPositions = [
            { x: 450, y: height - 55 },
            { x: 845, y: height - 55 },
            { x: 1280, y: height - 55 },
            { x: 1580, y: height - 55 },
            { x: 2140, y: height - 55 }
        ];
        glitchPositions.forEach(p => this.glitches.create(p.x, p.y, 'hazard'));

        // === MECÁNICA 1: PAQUETES PARA ENTREGAR ===
        const packagePositions = [
            { x: 280, y: height - 160 },
            { x: 540, y: height - 230 },
            { x: 1020, y: height - 250 },
            { x: 1530, y: height - 280 },
            { x: 2280, y: height - 190 }
        ];
        packagePositions.forEach(pos => {
            const pkg = this.packages.create(pos.x, pos.y, 'package');
            pkg.body.setAllowGravity(false);
            pkg.body.setImmovable(true);
            this.tweens.add({
                targets: pkg,
                y: pos.y - 6,
                duration: 1000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        });

        // === NPCs CIUDADANOS AMBIENTALES (peatones que solo caminan) ===
        // Visuales no hostiles - usan el sprite enemy pero sin física agresiva.
        this.spawnCitizen(380, height - 72);
        this.spawnCitizen(1100, height - 72);
        this.spawnCitizen(1700, height - 72);
        this.spawnCitizen(2400, height - 72);

        // === NPCs CLIENTE (con quest – reciben paquetes) ===
        this.spawnClient(720,  height - 72, 'Cliente Akira');
        this.spawnClient(1180, height - 72, 'Cliente Vega');
        this.spawnClient(1780, height - 72, 'Cliente Nova');
        this.spawnClient(2300, height - 72, 'Cliente Onix');

        // === MECÁNICA 2: NPC VENDEDOR ===
        this.spawnVendor(160, height - 72, 'Tienda NEXUS');
    }

    /**
     * Bloque sólido con tile industrial
     */
    createSolidBlock(x, y, w, h) {
        const tile = this.add.tileSprite(x + w / 2, y + h / 2, w, h, 'platform_tile');
        this.physics.add.existing(tile, true);
        this.platforms.add(tile);
    }

    /**
     * Plataforma móvil (transporte automatizado)
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
                    this.movingPlatform.body.setVelocityX(-this.movingPlatform.body.velocity.x);
                }
            },
            loop: true
        });
    }

    spawnCitizen(x, y) {
        const c = this.citizens.create(x, y, 'npc_citizen');
        c.body.checkCollision.none = true;
        // Pequeña oscilación caminando en su sitio
        this.tweens.add({
            targets: c,
            x: x + 30,
            duration: 2500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
            onUpdate: () => c.setFlipX(c.body.velocity.x < 0)
        });
    }

    spawnClient(x, y, name) {
        const c = this.clients.create(x, y, 'npc_client');
        c.body.checkCollision.none = true;
        c.clientName = name;
        c.hasQuest = true;

        // Icono ! flotante
        const icon = this.add.image(x, y - 32, 'icon_exclaim');
        c.questIcon = icon;
        this.tweens.add({
            targets: icon,
            y: y - 38,
            duration: 600,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    spawnVendor(x, y, name) {
        const v = this.vendors.create(x, y, 'npc');
        v.body.checkCollision.none = true;
        v.vendorName = name;

        // Icono $ flotante
        const icon = this.add.image(x, y - 32, 'icon_dollar');
        this.tweens.add({
            targets: icon,
            y: y - 38,
            duration: 700,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Cartelito del nombre
        this.add.text(x, y + 22, name, {
            font: '9px Orbitron',
            fill: '#f5d061',
            backgroundColor: '#07090e',
            padding: { x: 4, y: 2 }
        }).setOrigin(0.5);
    }

    // ======================================================================
    // INTERACCIONES (paquete / entrega / tienda)
    // ======================================================================

    /**
     * Actualiza el prompt contextual encima del jugador según lo más cercano.
     */
    updateContextPrompt() {
        let nearest = null;
        let action = '';

        // Cercanía a vendedor (radio mayor)
        this.vendors.getChildren().forEach(v => {
            const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, v.x, v.y);
            if (d < 60 && (!nearest || d < nearest.dist)) {
                nearest = { obj: v, dist: d };
                action = '[E] ABRIR TIENDA';
            }
        });

        // Cercanía a cliente (para entregar)
        this.clients.getChildren().forEach(c => {
            if (!c.hasQuest) return;
            const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, c.x, c.y);
            if (d < 55 && (!nearest || d < nearest.dist)) {
                nearest = { obj: c, dist: d };
                action = this.carriedPackage
                    ? `[E] ENTREGAR a ${c.clientName} (+50 TOHOL)`
                    : `${c.clientName} pide un paquete`;
            }
        });

        // Cercanía a paquete (para recoger)
        this.packages.getChildren().forEach(p => {
            if (!p.active) return;
            const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, p.x, p.y);
            if (d < 45 && (!nearest || d < nearest.dist) && !this.carriedPackage) {
                nearest = { obj: p, dist: d };
                action = '[E] RECOGER PAQUETE';
            }
        });

        if (nearest) {
            this.contextPrompt
                .setText(action)
                .setPosition(this.player.x, this.player.y - 50)
                .setVisible(true);
        } else {
            this.contextPrompt.setVisible(false);
        }
    }

    /**
     * Despacha la acción de la tecla E al objeto más cercano elegible.
     */
    handleInteraction() {
        // Prioridad 1: tienda
        const nearVendor = this.findNearest(this.vendors, 60);
        if (nearVendor) {
            this.openShop();
            return;
        }

        // Prioridad 2: cliente (entregar)
        if (this.carriedPackage) {
            const nearClient = this.findNearest(this.clients, 55, c => c.hasQuest);
            if (nearClient) {
                this.deliverPackage(nearClient);
                return;
            }
        }

        // Prioridad 3: recoger paquete
        if (!this.carriedPackage) {
            const nearPackage = this.findNearest(this.packages, 45, p => p.active);
            if (nearPackage) {
                this.pickupPackage(this.player, nearPackage);
            }
        }
    }

    findNearest(group, radius, filter = () => true) {
        let best = null;
        let bestDist = radius;
        group.getChildren().forEach(o => {
            if (!filter(o)) return;
            const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, o.x, o.y);
            if (d < bestDist) { bestDist = d; best = o; }
        });
        return best;
    }

    /**
     * MECÁNICA 1a: recoger un paquete del suelo / plataforma
     */
    pickupPackage(player, pkg) {
        if (this.carriedPackage) return;
        // Phaser overlap fires con un body activo: lo "engancha" al jugador.
        pkg.body.enable = false;
        // Removerlo del flujo de tweens previo
        this.tweens.killTweensOf(pkg);
        this.carriedPackage = pkg;
        pkg.setDepth(20);
        this.playSFX('sfx_coin');
        this.flashPrompt('📦 PAQUETE RECOGIDO');
    }

    /**
     * MECÁNICA 1b: entregar el paquete al cliente con quest
     */
    deliverPackage(client) {
        if (!this.carriedPackage || !client.hasQuest) return;

        // Recompensa
        const reward = 50;
        this.game.events.emit('add-tohol', reward);
        this.jobsCompleted++;
        this.carryIndicator.setText(`Paquetes entregados: ${this.jobsCompleted}`);

        // Eliminar el paquete cargado y la quest del cliente
        this.carriedPackage.destroy();
        this.carriedPackage = null;

        client.hasQuest = false;
        if (client.questIcon) {
            this.tweens.add({
                targets: client.questIcon,
                alpha: 0,
                scale: 1.8,
                duration: 250,
                onComplete: () => client.questIcon.destroy()
            });
        }

        // Feedback
        this.coinSparkEmitter.emitParticleAt(client.x, client.y - 16, 14);
        this.playSFX('sfx_coin');
        this.flashPrompt(`✅ ENTREGA OK · +${reward} TOHOL`);
    }

    /**
     * Mensaje flotante temporal sobre el jugador
     */
    flashPrompt(msg) {
        const t = this.add.text(this.player.x, this.player.y - 65, msg, {
            font: '11px Orbitron',
            fill: '#39ff14',
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

    // ======================================================================
    // MECÁNICA 2: TIENDA MULTI-ÍTEM
    // ======================================================================

    openShop() {
        if (this.shopOpen) return;
        this.shopOpen = true;

        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const cam = this.cameras.main;
        const cx = cam.scrollX + width / 2;
        const cy = cam.scrollY + height / 2;

        this.shopContainer = this.add.container(cx, cy).setDepth(100);

        const bg = this.add.graphics();
        bg.fillStyle(0x07090e, 0.94);
        bg.fillRect(-220, -150, 440, 300);
        bg.lineStyle(2, 0xf5d061, 0.9);
        bg.strokeRect(-220, -150, 440, 300);
        this.shopContainer.add(bg);

        const title = this.add.text(0, -130, 'TIENDA NEXUS · CATÁLOGO', {
            font: '14px Orbitron',
            fill: '#f5d061',
            fontWeight: 'bold',
            letterSpacing: 2
        }).setOrigin(0.5);
        this.shopContainer.add(title);

        // Listar ítems
        this.shopItems.forEach((item, i) => {
            const y = -90 + i * 38;
            const owned = this.purchasedTrophies.includes(item.key);
            const numLabel = `[${i + 1}]`;
            const text = `${numLabel}  ${item.label}   ${owned ? '· COMPRADO' : `· ${item.price} TOHOL`}`;
            const line = this.add.text(-200, y, text, {
                font: '11px Orbitron',
                fill: owned ? '#9ca3af' : '#ffffff'
            });
            this.shopContainer.add(line);
        });

        const tip = this.add.text(0, 120,
            'Pulsa [1–5] para comprar  ·  [E] o [ESC] para salir', {
            font: '10px Inter',
            fill: '#9ca3af'
        }).setOrigin(0.5);
        this.shopContainer.add(tip);
    }

    closeShop() {
        if (this.shopContainer) this.shopContainer.destroy();
        this.shopContainer = null;
        this.shopOpen = false;
    }

    handleShopInput() {
        if (Phaser.Input.Keyboard.JustDown(this.eKey) || Phaser.Input.Keyboard.JustDown(this.escKey)) {
            this.closeShop();
            return;
        }
        if (Phaser.Input.Keyboard.JustDown(this.num1Key)) this.attemptPurchase(0);
        if (Phaser.Input.Keyboard.JustDown(this.num2Key)) this.attemptPurchase(1);
        if (Phaser.Input.Keyboard.JustDown(this.num3Key)) this.attemptPurchase(2);
        if (Phaser.Input.Keyboard.JustDown(this.num4Key)) this.attemptPurchase(3);
        if (Phaser.Input.Keyboard.JustDown(this.num5Key)) this.attemptPurchase(4);
    }

    attemptPurchase(index) {
        const item = this.shopItems[index];
        if (!item) return;
        const hud = this.scene.get('UIScene');

        if (item.effect === 'trophy' && this.purchasedTrophies.includes(item.key)) {
            this.showShopFeedback('YA ADQUIRIDO', '#9ca3af');
            return;
        }
        if (hud.tohol < item.price) {
            this.showShopFeedback('SALDO INSUFICIENTE', '#ff0055');
            this.cameras.main.shake(80, 0.004);
            return;
        }

        // Descontar TOHOL
        this.game.events.emit('add-tohol', -item.price);
        this.playSFX('sfx_coin');

        // Aplicar efecto
        switch (item.effect) {
            case 'energy':
                this.game.events.emit('change-energy', 1);
                this.showShopFeedback('+1 ENERGÍA RECUPERADA', '#00f2fe');
                break;
            case 'speed':
                this.applySpeedChip();
                this.showShopFeedback('CHIP DE VELOCIDAD ACTIVADO (5s)', '#39ff14');
                break;
            case 'cosmetic':
                this.player.setTint(0xff007f);
                this.purchasedTrophies.push(item.key);
                this.showShopFeedback('AVATAR PREMIUM APLICADO', '#ff007f');
                break;
            case 'trophy':
                this.purchasedTrophies.push(item.key);
                this.showShopFeedback(`${item.label} ADQUIRIDO`, '#f5d061');
                // Refrescar el listado del menú para mostrar "COMPRADO"
                this.closeShop();
                this.openShop();
                break;
        }
    }

    applySpeedChip() {
        if (this.speedMultiplier > 1.0) return;
        this.speedMultiplier = 1.8;
        const originalTint = this.player.tintTopLeft;
        this.player.setTint(0x39ff14);

        this.time.delayedCall(5000, () => {
            this.speedMultiplier = 1.0;
            // Restaurar tinte (si tenía premium, lo recupera)
            if (this.purchasedTrophies.includes('avatar')) {
                this.player.setTint(0xff007f);
            } else {
                this.player.clearTint();
            }
        });
    }

    showShopFeedback(msg, color) {
        if (!this.shopContainer) return;
        const fb = this.add.text(0, 90, msg, {
            font: '11px Orbitron',
            fill: color,
            fontWeight: 'bold'
        }).setOrigin(0.5);
        this.shopContainer.add(fb);
        this.time.delayedCall(1500, () => fb.destroy());
    }

    // ======================================================================
    // MECÁNICA 3: GLITCHES DEL SISTEMA
    // ======================================================================

    handleGlitchDamage() {
        this.applyEnergyDamage();
    }

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
            // Si cargaba un paquete, lo pierde
            if (this.carriedPackage) {
                this.carriedPackage.destroy();
                this.carriedPackage = null;
            }
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

    // ======================================================================
    // FIN DE JORNADA
    // ======================================================================

    handleEndOfShift() {
        this.game.events.emit('goal-reached', {
            type: 'work',
            minTohol: 100
        });
    }

    // ======================================================================
    // FONDO PARALLAX
    // ======================================================================

    setupParallaxBackground(width, height) {
        this.bgSky = this.add.tileSprite(0, 0, width, height, 'bg_sky')
            .setOrigin(0).setScrollFactor(0);
        this.bgFar = this.add.tileSprite(0, 40, width, height - 40, 'bg_far')
            .setOrigin(0).setScrollFactor(0.1, 0);
        this.bgNear = this.add.tileSprite(0, 40, width, height - 40, 'bg_near')
            .setOrigin(0).setScrollFactor(0.35, 0);
    }

    // ======================================================================
    // AUDIO
    // ======================================================================

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
                console.log('[Audio] Música de fondo (Distrito Financiero) iniciada.');
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
            // Detener también cualquier sonido en reproducción (SFX incluidos)
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
            if (this.shopOpen) return; // ESC dentro de la tienda la cierra (manejado allí)
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
        box.lineStyle(2, 0xf5d061, 0.8);
        box.strokeRect(-180, -90, 360, 180);
        this.pauseContainer.add(box);

        this.pauseContainer.add(this.add.text(0, -55, 'JORNADA EN PAUSA', {
            font: '16px Orbitron', fill: '#f5d061', fontWeight: 'bold', letterSpacing: 2
        }).setOrigin(0.5));

        this.pauseContainer.add(this.add.text(0, -5, 'Presiona [ENTER] o [ESC] para Reanudar', {
            font: '12px Inter', fill: '#f3f4f6'
        }).setOrigin(0.5));

        this.pauseContainer.add(this.add.text(0, 35, 'Presiona [Q] para Salir al Menú Principal', {
            font: '12px Inter', fill: '#ff007f', fontWeight: 'bold'
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
