/**
 * ==========================================================================
 * NEXUS LIFE - Realidad Expandida · Menú Principal
 * --------------------------------------------------------------------------
 * Renombrado para alinearse con la narrativa del ecosistema social-económico.
 * Muestra descripciones inmersivas de los 2 distritos y los personajes.
 * ==========================================================================
 */

export default class MainMenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainMenuScene' });
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        console.log('[Scene Manager] MainMenuScene -> NEXUS LIFE: Realidad Expandida');

        this.cameras.main.fadeIn(600, 11, 15, 25);
        this.playBackgroundMusic();

        // Fondo animado
        this.createAnimatedBackground(width, height);

        // Partículas ambientales
        this.createAmbientParticles(width, height);

        // Logo y narrativa
        this.createTitle(width, height);

        // Tarjetas de nivel con descripciones
        this.createLevelCards(width, height);

        // Botones de acción
        this.createActionButtons(width, height);

        // Personajes en la barra inferior
        this.createCharacterShowcase(width, height);

        // Controles
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

    createAnimatedBackground(width, height) {
        this.bgSky = this.add.tileSprite(0, 0, width, height, 'bg_sky')
            .setOrigin(0).setScrollFactor(0);

        this.bgFar = this.add.tileSprite(0, 0, width, height, 'bg_far')
            .setOrigin(0).setScrollFactor(0).setAlpha(0.5);

        this.bgNear = this.add.tileSprite(0, 0, width, height, 'bg_near')
            .setOrigin(0).setScrollFactor(0).setAlpha(0.7);

        this.tweens.add({
            targets: [this.bgFar, this.bgNear],
            tilePositionX: 100,
            duration: 8000,
            repeat: -1
        });
    }

    createAmbientParticles(width, height) {
        if (this.textures.exists('particle_spark')) {
            this.add.particles(width, height, 'particle_spark', {
                x: { min: 0, max: width },
                y: { min: 0, max: height },
                lifespan: 3000,
                speedY: { min: -20, max: -60 },
                speedX: { min: -10, max: 10 },
                scale: { start: 0.6, end: 0 },
                alpha: { start: 0.6, end: 0 },
                blendMode: 'ADD',
                frequency: 400,
                quantity: 1
            });
        }
    }

    createTitle(width, height) {
        // Logo principal
        this.add.text(width / 2, 38, 'NEXUS LIFE', {
            font: 'bold 32px Orbitron, "Trebuchet MS", sans-serif',
            fill: '#ff007f',
            stroke: '#07090e',
            strokeThickness: 4,
            shadow: { offsetX: 0, offsetY: 0, color: '#00f2fe', blur: 12, fill: true }
        }).setOrigin(0.5);

        // Subtítulo
        this.add.text(width / 2, 68, 'REALIDAD  EXPANDIDA', {
            font: '13px Orbitron, sans-serif',
            fill: '#00f2fe',
            letterSpacing: 6
        }).setOrigin(0.5);

        // Línea decorativa
        const line = this.add.graphics();
        line.lineStyle(1, 0xff007f, 0.8);
        line.lineBetween(width / 2 - 120, 80, width / 2 + 120, 80);
    }

    createLevelCards(width, height) {
        const cardY = 145;
        const cardH = 130;
        const cardW = 220;
        const leftX = width / 2 - cardW - 15;
        const rightX = width / 2 + 15;

        // ======= TARJETA L1 - DISTRITO FINANCIERO =======
        const card1Bg = this.add.graphics();
        card1Bg.fillStyle(0x0b1320, 0.9);
        card1Bg.fillRoundedRect(leftX, cardY, cardW, cardH, 8);
        card1Bg.lineStyle(2, 0xffd700, 0.6);
        card1Bg.strokeRoundedRect(leftX, cardY, cardW, cardH, 8);

        this.add.text(leftX + 12, cardY + 10, '01 · DISTRITO FINANCIERO', {
            font: '11px Orbitron', fill: '#ffd700', fontWeight: 'bold'
        });
        this.add.text(leftX + 12, cardY + 28, 'Trabajos · Compras · Propiedad', {
            font: '10px Inter', fill: '#f3f4f6', fontStyle: 'italic'
        });
        this.add.text(leftX + 12, cardY + 48,
            'Acepta repartos, cumple pedidos, gana\n' +
            'TOHOL y compra tu nueva vida: casa,\n' +
            'vehiculo, avatar premium.', {
            font: '10px Inter', fill: '#cbd5e1', wordWrap: { width: cardW - 24 }
        });
        this.add.text(leftX + 12, cardY + 105, 'META: 100 TOHOL', {
            font: '10px Orbitron', fill: '#39ff14', fontWeight: 'bold'
        });

        // ======= TARJETA L2 - DISTRITO SOCIAL =======
        const card2Bg = this.add.graphics();
        card2Bg.fillStyle(0x0b1320, 0.9);
        card2Bg.fillRoundedRect(rightX, cardY, cardW, cardH, 8);
        card2Bg.lineStyle(2, 0xff007f, 0.6);
        card2Bg.strokeRoundedRect(rightX, cardY, cardW, cardH, 8);

        this.add.text(rightX + 12, cardY + 10, '02 · DISTRITO SOCIAL', {
            font: '11px Orbitron', fill: '#ff007f', fontWeight: 'bold'
        });
        this.add.text(rightX + 12, cardY + 28, 'Eventos · NPCs · Reputación', {
            font: '10px Inter', fill: '#f3f4f6', fontStyle: 'italic'
        });
        this.add.text(rightX + 12, cardY + 48,
            'Asiste a fiestas, conoce anfitriones\n' +
            'con IA, esquiva bots de seguridad\n' +
            'y desbloquea el evento principal.', {
            font: '10px Inter', fill: '#cbd5e1', wordWrap: { width: cardW - 24 }
        });
        this.add.text(rightX + 12, cardY + 105, 'META: 50 REPUTACIÓN', {
            font: '10px Orbitron', fill: '#39ff14', fontWeight: 'bold'
        });

        // Botones de selección
        this.createLevelButton(leftX + cardW / 2, cardY + cardH + 22, '▶ JUGAR NIVEL 1', '#ffd700', () => this.startLevel1());
        this.createLevelButton(rightX + cardW / 2, cardY + cardH + 22, '▶ JUGAR NIVEL 2', '#ff007f', () => this.startLevel2());
    }

    createLevelButton(x, y, label, color, callback) {
        const bg = this.add.graphics();
        bg.fillStyle(0x111928, 0.95);
        bg.fillRoundedRect(x - 90, y - 12, 180, 24, 4);
        bg.lineStyle(1, Phaser.Display.Color.HexStringToColor(color).color, 0.9);
        bg.strokeRoundedRect(x - 90, y - 12, 180, 24, 4);

        const text = this.add.text(x, y, label, {
            font: '11px Orbitron', fill: color, fontWeight: 'bold'
        }).setOrigin(0.5);

        bg.setInteractive(new Phaser.Geom.Rectangle(x - 90, y - 12, 180, 24), Phaser.Geom.Rectangle.Contains);

        bg.on('pointerover', () => {
            bg.clear();
            bg.fillStyle(Phaser.Display.Color.HexStringToColor(color).color, 0.3);
            bg.fillRoundedRect(x - 90, y - 12, 180, 24, 4);
            bg.lineStyle(2, Phaser.Display.Color.HexStringToColor(color).color, 1);
            bg.strokeRoundedRect(x - 90, y - 12, 180, 24, 4);
            text.setScale(1.05);
        });
        bg.on('pointerout', () => {
            bg.clear();
            bg.fillStyle(0x111928, 0.95);
            bg.fillRoundedRect(x - 90, y - 12, 180, 24, 4);
            bg.lineStyle(1, Phaser.Display.Color.HexStringToColor(color).color, 0.9);
            bg.strokeRoundedRect(x - 90, y - 12, 180, 24, 4);
            text.setScale(1);
        });
        bg.on('pointerdown', callback);
    }

    createActionButtons(width, height) {
        // Controles
        this.add.text(width / 2, 312, '[← → / A D] Moverse   [↑ / W / ESPACIO] Saltar   [SHIFT] Dash   [E] Interactuar   [ESC] Pausa', {
            font: '9px Inter', fill: '#9ca3af', align: 'center'
        }).setOrigin(0.5);

        // Botones secundarios
        this.createSecondaryButton(width / 2 - 75, 335, 'Créditos', () => this.showCredits());
        this.createSecondaryButton(width / 2 + 75, 335, 'Narrativa', () => this.showNarrative());
    }

    createSecondaryButton(x, y, label, callback) {
        const bg = this.add.graphics();
        bg.fillStyle(0x111928, 0.6);
        bg.fillRoundedRect(x - 55, y - 9, 110, 18, 3);
        bg.lineStyle(1, 0x00f2fe, 0.5);
        bg.strokeRoundedRect(x - 55, y - 9, 110, 18, 3);

        const text = this.add.text(x, y, label, {
            font: '10px Inter', fill: '#00f2fe', fontWeight: 'bold'
        }).setOrigin(0.5);

        bg.setInteractive(new Phaser.Geom.Rectangle(x - 55, y - 9, 110, 18), Phaser.Geom.Rectangle.Contains);
        bg.on('pointerover', () => text.setScale(1.08));
        bg.on('pointerout',  () => text.setScale(1));
        bg.on('pointerdown', callback);
    }

    createCharacterShowcase(width, height) {
        // Fondo barra inferior
        const bar = this.add.graphics();
        bar.fillStyle(0x07090e, 0.85);
        bar.fillRect(0, height - 100, width, 100);
        bar.lineStyle(1, 0xff007f, 0.4);
        bar.lineBetween(0, height - 100, width, height - 100);

        // Biker
        if (this.textures.exists('player1_idle')) {
            this.add.sprite(width / 2 - 110, height - 60, 'player1_idle').setScale(2.4);
        }
        this.add.text(width / 2 - 110, height - 26, 'BIKER', {
            font: 'bold 10px Orbitron', fill: '#00f2fe'
        }).setOrigin(0.5);
        this.add.text(width / 2 - 110, height - 12, 'Repartidor', {
            font: '8px Inter', fill: '#9ca3af', fontStyle: 'italic'
        }).setOrigin(0.5);

        // Punk
        if (this.textures.exists('player2_idle')) {
            this.add.sprite(width / 2 + 110, height - 60, 'player2_idle').setScale(2.4);
        }
        this.add.text(width / 2 + 110, height - 26, 'PUNK', {
            font: 'bold 10px Orbitron', fill: '#ff007f'
        }).setOrigin(0.5);
        this.add.text(width / 2 + 110, height - 12, 'Asistente Social', {
            font: '8px Inter', fill: '#9ca3af', fontStyle: 'italic'
        }).setOrigin(0.5);

        // Texto central
        this.add.text(width / 2, height - 50, '2 PERSONAJES', {
            font: '11px Orbitron', fill: '#ffd700', fontWeight: 'bold', letterSpacing: 3
        }).setOrigin(0.5);
        this.add.text(width / 2, height - 32, '· DOS DISTRITOS · UN ECOSISTEMA ·', {
            font: '9px Inter', fill: '#cbd5e1', letterSpacing: 1
        }).setOrigin(0.5);
    }

    showCredits() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const box = this.add.container(width / 2, height / 2).setDepth(200);

        const overlay = this.add.graphics();
        overlay.fillStyle(0x07090e, 0.85);
        overlay.fillRect(-width / 2, -height / 2, width, height);
        box.add(overlay);

        const panel = this.add.graphics();
        panel.fillStyle(0x111928, 0.98);
        panel.fillRoundedRect(-200, -130, 400, 260, 8);
        panel.lineStyle(2, 0xff007f, 0.9);
        panel.strokeRoundedRect(-200, -130, 400, 260, 8);
        box.add(panel);

        box.add(this.add.text(0, -100, 'CRÉDITOS', {
            font: '16px Orbitron', fill: '#ff007f', fontWeight: 'bold', letterSpacing: 2
        }).setOrigin(0.5));

        const credits = [
            'Concepto RPG: NEXUS LIFE',
            'Motor: Phaser 3.60',
            'Estética: Pixel-Art Cyber',
            'Música: Sintetizadores retro',
            'Diseño de Niveles: L1 Financiero / L2 Social',
            'Desarrollo: 8 Fases de Integración',
            '',
            'v1.0 · Realidad Expandida'
        ];
        let y = -60;
        credits.forEach(line => {
            box.add(this.add.text(0, y, line, {
                font: '11px Inter', fill: '#cbd5e1', align: 'center'
            }).setOrigin(0.5));
            y += 18;
        });

        const close = this.add.text(0, 110, '[ CLIC para cerrar ]', {
            font: '10px Inter', fill: '#00f2fe', fontWeight: 'bold'
        }).setOrigin(0.5);
        box.add(close);

        const hit = this.add.rectangle(0, 0, width, height, 0xffffff, 0).setInteractive();
        box.add(hit);
        hit.on('pointerdown', () => box.destroy());
    }

    showNarrative() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const box = this.add.container(width / 2, height / 2).setDepth(200);

        const overlay = this.add.graphics();
        overlay.fillStyle(0x07090e, 0.9);
        overlay.fillRect(-width / 2, -height / 2, width, height);
        box.add(overlay);

        const panel = this.add.graphics();
        panel.fillStyle(0x0b1320, 0.98);
        panel.fillRoundedRect(-260, -160, 520, 320, 8);
        panel.lineStyle(2, 0x00f2fe, 0.9);
        panel.strokeRoundedRect(-260, -160, 520, 320, 8);
        box.add(panel);

        box.add(this.add.text(0, -135, 'NARRATIVA', {
            font: '15px Orbitron', fill: '#00f2fe', fontWeight: 'bold', letterSpacing: 2
        }).setOrigin(0.5));

        const lines = [
            'Bienvenido a NEXUS, una megaciudad donde la vida',
            'social y económica es la única realidad que importa.',
            '',
            'Como nuevo ciudadano, debes construir tu identidad',
            'repartiendo paquetes en el DISTRITO FINANCIERO y',
            'asistiendo a eventos exclusivos en el DISTRITO SOCIAL.',
            '',
            'Gana TOHOL comprando tu nueva vida: casa, vehículo,',
            'avatar premium. Acumula REPUTACIÓN siendo visto en',
            'los eventos correctos con las personas correctas.',
            '',
            'Pero cuidado: los glitches del sistema quieren',
            'desconectarte, y los bots de seguridad patrullan'
        ];
        let y = -105;
        lines.forEach(line => {
            box.add(this.add.text(0, y, line, {
                font: '10px Inter', fill: '#cbd5e1', align: 'center'
            }).setOrigin(0.5));
            y += 15;
        });

        const close = this.add.text(0, 140, '[ CLIC para cerrar ]', {
            font: '10px Inter', fill: '#ff007f', fontWeight: 'bold'
        }).setOrigin(0.5);
        box.add(close);

        const hit = this.add.rectangle(0, 0, width, height, 0xffffff, 0).setInteractive();
        box.add(hit);
        hit.on('pointerdown', () => box.destroy());
    }

    setupNavigation() {
        this.input.keyboard.on('keydown-ONE', () => this.startLevel1());
        this.input.keyboard.on('keydown-TWO', () => this.startLevel2());
    }

    startLevel1() {
        this.cameras.main.fadeOut(400, 11, 15, 25);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
            this.scene.start('Level1Scene');
        });
    }

    startLevel2() {
        this.cameras.main.fadeOut(400, 11, 15, 25);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
            this.scene.start('Level2Scene');
        });
    }

    playBackgroundMusic() {
        // Detener música previa (p. ej. de un nivel al volver al menú)
        this.stopBackgroundMusic();

        const tryPlay = () => {
            try {
                const key = this.cache.audio.has('bg_music_menu') ? 'bg_music_menu'
                          : this.cache.audio.has('bg_music')      ? 'bg_music'
                          : null;
                if (!key) return;
                if (this._bgMusicInstance) {
                    if (!this._bgMusicInstance.isPlaying) this._bgMusicInstance.play();
                    return;
                }
                this._bgMusicInstance = this.sound.add(key, { loop: true, volume: 0.35 });
                this._bgMusicInstance.play();
                console.log(`[Audio] Música de menú iniciada (${key}).`);
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
                console.log('[Audio] Música de menú detenida.');
            }
            this.sound.stopAll();
        } catch (e) { /* silencio */ }
    }
}
