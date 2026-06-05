/**
 * ==========================================================================
 * NEXUS LIFE - UI HUD Scene (Overlay)
 * --------------------------------------------------------------------------
 * HUD del Ecosistema Social-Económico:
 *   - TOHOL (dinero acumulado en la sesión)
 *   - ENERGÍA (sustituye a "vidas": 0 = desconexión forzada = Game Over)
 *   - REPUTACIÓN (puntos sociales ganados en eventos del Distrito Social)
 *   - HORARIO (timer descendente: jornada laboral o fiesta)
 * ==========================================================================
 */

export default class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene' });
    }

    init() {
        // Estadísticas del ciudadano NEXUS
        this.tohol = 0;          // Dinero del metaverso
        this.energy = 3;         // 3 cargas de energía (≈ vidas)
        this.maxEnergy = 3;
        this.reputation = 0;     // Reputación social (0–100)
        this.timeRemaining = 90; // 90 segundos por nivel (jornada / evento)
        this.gameOver = false;
        this.victory = false;

        // Modo del nivel actual: 'work' (Distrito Financiero) o 'social' (Distrito Social)
        // Por defecto 'work' hasta que el nivel notifique lo contrario
        this.levelMode = 'work';
    }

    create() {
        console.log('[Scene Manager] Ejecutando UIScene (HUD NEXUS).');

        const width = this.cameras.main.width;

        // 1. Marco superior translúcido neón
        this.drawHUDBar(width);

        // 2. TOHOL (dinero) – Izquierda
        this.tohText = this.add.text(15, 11, '💰 TOHOL: 0000', {
            font: '13px Orbitron',
            fill: '#f5d061',
            fontWeight: 'bold',
            letterSpacing: 1
        });

        // 3. ENERGÍA (barra visual) – Centro-izquierda
        // Texto + barra debajo
        this.energyLabel = this.add.text(220, 11, '⚡ ENERGÍA', {
            font: '11px Orbitron',
            fill: '#00f2fe',
            fontWeight: 'bold',
            letterSpacing: 1
        });
        this.energyBarBg = this.add.graphics();
        this.energyBarFill = this.add.graphics();
        this.drawEnergyBar();

        // 4. REPUTACIÓN – Centro-derecha
        this.repText = this.add.text(width / 2 + 70, 11, '⭐ REP: 000', {
            font: '13px Orbitron',
            fill: '#39ff14',
            fontWeight: 'bold',
            letterSpacing: 1
        });

        // 5. HORARIO (timer) – Derecha
        this.timerText = this.add.text(width - 15, 11, '⏱ 01:30', {
            font: '13px Orbitron',
            fill: '#ff007f',
            fontWeight: 'bold',
            letterSpacing: 1
        }).setOrigin(1, 0);

        // 6. Banner inferior del modo (Distrito actual)
        this.modeText = this.add.text(width - 15, 32, '', {
            font: '9px Inter',
            fill: '#9ca3af'
        }).setOrigin(1, 0);

        // 7. Temporizador descendente
        this.startTimer();

        // 8. Suscripción a eventos globales
        this.setupEventListeners();
    }

    /**
     * Marco translúcido superior con borde neón
     */
    drawHUDBar(width) {
        const hudBg = this.add.graphics();
        hudBg.fillStyle(0x07090e, 0.78);
        hudBg.fillRect(0, 0, width, 44);
        hudBg.lineStyle(1.5, 0x00f2fe, 0.5);
        hudBg.lineBetween(0, 44, width, 44);
    }

    /**
     * Dibuja la barra de energía (sustituye corazones por barra visual estilo medidor)
     */
    drawEnergyBar() {
        this.energyBarBg.clear();
        this.energyBarFill.clear();

        const x = 220;
        const y = 28;
        const width = 110;
        const height = 8;

        // Fondo oscuro de la barra
        this.energyBarBg.fillStyle(0x111928, 0.9);
        this.energyBarBg.fillRect(x, y, width, height);
        this.energyBarBg.lineStyle(1, 0x00f2fe, 0.5);
        this.energyBarBg.strokeRect(x, y, width, height);

        // Relleno proporcional
        const ratio = Math.max(0, this.energy / this.maxEnergy);
        const fillColor = ratio > 0.66 ? 0x00f2fe : ratio > 0.33 ? 0xf5d061 : 0xff0055;
        this.energyBarFill.fillStyle(fillColor, 1);
        this.energyBarFill.fillRect(x + 1, y + 1, (width - 2) * ratio, height - 2);

        // Dividers para indicar los 3 segmentos de energía
        this.energyBarFill.lineStyle(1, 0x07090e, 0.8);
        for (let i = 1; i < this.maxEnergy; i++) {
            const dx = x + (width / this.maxEnergy) * i;
            this.energyBarFill.lineBetween(dx, y + 1, dx, y + height - 1);
        }
    }

    /**
     * Temporizador descendente de la jornada / evento
     */
    startTimer() {
        if (this.timerEvent) this.timerEvent.destroy();

        this.timerEvent = this.time.addEvent({
            delay: 1000,
            callback: () => {
                if (this.gameOver || this.victory) return;

                if (this.timeRemaining > 0) {
                    this.timeRemaining--;
                    this.updateTimerDisplay();
                } else {
                    this.timerText.setText('⏱ AGOTADO');
                    this.timerText.setFill('#ff0000');

                    // Fin de jornada / evento -> victoria por supervivencia/permanencia
                    const msg = this.levelMode === 'work'
                        ? '¡JORNADA LABORAL COMPLETADA!'
                        : '¡EVENTO SOCIAL CONCLUIDO!';
                    this.triggerVictory(msg);
                }
            },
            callbackScope: this,
            loop: true
        });
    }

    /**
     * Formatea el HORARIO en MM:SS
     */
    updateTimerDisplay() {
        const m = Math.floor(this.timeRemaining / 60);
        const s = this.timeRemaining % 60;
        this.timerText.setText(`⏱ ${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    }

    /**
     * Refresca el texto de TOHOL (4 dígitos)
     */
    updateToholDisplay() {
        this.tohText.setText(`💰 TOHOL: ${String(this.tohol).padStart(4, '0')}`);
    }

    /**
     * Refresca el texto de REPUTACIÓN (3 dígitos, máx 100)
     */
    updateReputationDisplay() {
        this.repText.setText(`⭐ REP: ${String(this.reputation).padStart(3, '0')}`);
        // Color por nivel social
        if (this.reputation >= 75) this.repText.setFill('#39ff14');
        else if (this.reputation >= 40) this.repText.setFill('#f5d061');
        else this.repText.setFill('#9ca3af');
    }

    /**
     * Recibe la indicación del distrito activo
     */
    setLevelMode(mode, label) {
        this.levelMode = mode;
        this.modeText.setText(label || '');
        // Ajusta el tiempo según el modo (la jornada laboral dura más que un evento)
        if (mode === 'work') {
            this.timeRemaining = 90;
        } else {
            this.timeRemaining = 90;
        }
        this.updateTimerDisplay();
    }

    /**
     * Vinculación de eventos globales del juego y la consola de pruebas HTML
     */
    setupEventListeners() {
        // --- Modo del nivel (lo emite cada Level al arrancar) ---
        this.game.events.on('set-level-mode', (payload) => {
            this.setLevelMode(payload.mode, payload.label);
        });

        // --- Ganancia de TOHOL (trabajos, ventas) ---
        this.game.events.on('add-tohol', (amount) => {
            if (this.gameOver || this.victory) return;
            this.tohol = Math.max(0, this.tohol + amount);
            this.updateToholDisplay();
            this.flashText(this.tohText, amount >= 0 ? '#39ff14' : '#ff0055');
        });

        // --- Pérdida / recarga de ENERGÍA ---
        this.game.events.on('change-energy', (delta) => {
            if (this.gameOver || this.victory) return;
            this.energy = Phaser.Math.Clamp(this.energy + delta, 0, this.maxEnergy);
            this.drawEnergyBar();
            this.flashText(this.energyLabel, delta < 0 ? '#ff0055' : '#00f2fe');
            if (this.energy <= 0) this.triggerGameOver();
        });

        // --- Ganancia de REPUTACIÓN (eventos sociales) ---
        this.game.events.on('add-reputation', (amount) => {
            if (this.gameOver || this.victory) return;
            this.reputation = Phaser.Math.Clamp(this.reputation + amount, 0, 100);
            this.updateReputationDisplay();
            this.flashText(this.repText, amount >= 0 ? '#39ff14' : '#ff0055');
        });

        // --- Victoria por meta del nivel (con condición de TOHOL o Reputación) ---
        this.game.events.on('goal-reached', (payload) => {
            // payload = { type: 'work' | 'social', minTohol, minReputation }
            const data = payload || {};
            if (data.type === 'work') {
                const ganados = this.tohol;
                if (ganados >= (data.minTohol || 0)) {
                    this.triggerVictory(`¡JORNADA EXITOSA! +${ganados} TOHOL`);
                } else {
                    // No alcanzó la cuota - termina como derrota narrativa
                    this.triggerSoftFail('CUOTA NO ALCANZADA',
                        `Necesitabas ${data.minTohol} TOHOL. Tienes ${ganados}.`);
                }
            } else if (data.type === 'social') {
                if (this.reputation >= (data.minReputation || 0)) {
                    this.triggerVictory(`¡VIDA SOCIAL ACTIVA! REP ${this.reputation}`);
                } else {
                    this.triggerSoftFail('SIN INVITACIÓN AL EVENTO PRINCIPAL',
                        `Necesitabas ${data.minReputation} REP. Tienes ${this.reputation}.`);
                }
            } else {
                this.triggerVictory('¡META ALCANZADA!');
            }
        });

        // --- EVENTOS DESDE LA CONSOLA DE PRUEBAS HTML ---
        this.game.events.on('dev-add-tohol', (amount) => {
            if (this.gameOver || this.victory) return;
            this.tohol = Math.max(0, this.tohol + amount);
            this.updateToholDisplay();
            this.flashText(this.tohText, '#39ff14');
        });

        this.game.events.on('dev-sub-energy', (amount) => {
            if (this.gameOver || this.victory) return;
            this.energy = Math.max(0, this.energy - amount);
            this.drawEnergyBar();
            this.flashText(this.energyLabel, '#ff0055');
            if (this.energy <= 0) this.triggerGameOver();
        });

        this.game.events.on('dev-add-rep', (amount) => {
            if (this.gameOver || this.victory) return;
            this.reputation = Phaser.Math.Clamp(this.reputation + amount, 0, 100);
            this.updateReputationDisplay();
            this.flashText(this.repText, '#39ff14');
        });

        this.game.events.on('dev-add-timer', (seconds) => {
            if (this.gameOver || this.victory) return;
            this.timeRemaining += seconds;
            this.updateTimerDisplay();
            this.flashText(this.timerText, '#00f2fe');
        });

        this.game.events.on('dev-reset-hud', () => {
            this.tohol = 0;
            this.energy = this.maxEnergy;
            this.reputation = 0;
            this.timeRemaining = 90;
            this.gameOver = false;
            this.victory = false;
            this.updateToholDisplay();
            this.drawEnergyBar();
            this.updateReputationDisplay();
            this.updateTimerDisplay();
            this.timerText.setFill('#ff007f');
            this.flashText(this.tohText, '#ffffff');
            this.flashText(this.repText, '#ffffff');

            const activeLevel = this.getActiveLevelScene();
            if (activeLevel) {
                activeLevel.physics.resume();
                activeLevel.input.keyboard.enabled = true;
            }
            if (this.timerEvent) this.timerEvent.paused = false;
        });

        // Limpieza al apagar la escena
        this.events.once('shutdown', () => {
            this.game.events.off('set-level-mode');
            this.game.events.off('add-tohol');
            this.game.events.off('change-energy');
            this.game.events.off('add-reputation');
            this.game.events.off('goal-reached');
            this.game.events.off('dev-add-tohol');
            this.game.events.off('dev-sub-energy');
            this.game.events.off('dev-add-rep');
            this.game.events.off('dev-add-timer');
            this.game.events.off('dev-reset-hud');
            if (this.timerEvent) this.timerEvent.destroy();
        });
    }

    /**
     * Devuelve la escena de nivel activa bajo el HUD
     */
    getActiveLevelScene() {
        return this.scene.manager.getScenes(true).find(s => s.sys.settings.key !== 'UIScene');
    }

    /**
     * Detiene todo y regresa al menú principal
     */
    exitToMainMenu() {
        const activeLevel = this.getActiveLevelScene();
        if (activeLevel) this.scene.stop(activeLevel.sys.settings.key);
        this.scene.stop('UIScene');
        this.scene.start('MainMenuScene');
    }

    /**
     * Pantalla de DESCONEXIÓN FORZADA (energía agotada o cuota crítica fallada)
     */
    triggerGameOver() {
        if (this.gameOver || this.victory) return;
        this.gameOver = true;
        console.log('[Game Loop] DESCONEXIÓN FORZADA.');

        if (this.timerEvent) this.timerEvent.paused = true;

        const activeLevel = this.getActiveLevelScene();
        if (activeLevel) {
            activeLevel.physics.pause();
            activeLevel.tweens.pauseAll();
            activeLevel.input.enabled = false;
        }

        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const overlay = this.add.graphics();
        overlay.fillStyle(0x07090e, 0.88);
        overlay.fillRect(0, 0, width, height);

        const glow = this.add.text(width / 2, height / 2 - 30, 'DESCONEXIÓN FORZADA', {
            font: '32px Orbitron',
            fill: '#ff0055',
            fontWeight: 'bold',
            letterSpacing: 2
        }).setOrigin(0.5);
        glow.setShadow(0, 0, '#ff0055', 15, true, true);

        this.add.text(width / 2, height / 2 - 30, 'DESCONEXIÓN FORZADA', {
            font: '30px Orbitron',
            fill: '#ffffff',
            fontWeight: 'bold',
            letterSpacing: 2
        }).setOrigin(0.5);

        this.add.text(width / 2, height / 2 + 20, 'Energía agotada. Tu sesión en NEXUS terminó.', {
            font: '12px Inter',
            fill: '#9ca3af'
        }).setOrigin(0.5);

        this.add.text(width / 2, height / 2 + 45, `TOHOL: ${this.tohol} | REP: ${this.reputation}`, {
            font: '11px Orbitron',
            fill: '#f5d061'
        }).setOrigin(0.5);

        this.time.delayedCall(3500, () => this.exitToMainMenu());
    }

    /**
     * Variante: el jugador alcanzó la meta física pero no cumplió la cuota
     */
    triggerSoftFail(title, subtitle) {
        if (this.gameOver || this.victory) return;
        this.gameOver = true;
        console.log('[Game Loop] Cuota no alcanzada.');

        if (this.timerEvent) this.timerEvent.paused = true;

        const activeLevel = this.getActiveLevelScene();
        if (activeLevel) {
            activeLevel.physics.pause();
            activeLevel.tweens.pauseAll();
            activeLevel.input.enabled = false;
        }

        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const overlay = this.add.graphics();
        overlay.fillStyle(0x07090e, 0.88);
        overlay.fillRect(0, 0, width, height);

        const glow = this.add.text(width / 2, height / 2 - 30, title, {
            font: '24px Orbitron',
            fill: '#f5d061',
            fontWeight: 'bold',
            letterSpacing: 2
        }).setOrigin(0.5);
        glow.setShadow(0, 0, '#f5d061', 10, true, true);

        this.add.text(width / 2, height / 2 + 15, subtitle, {
            font: '12px Inter',
            fill: '#ffffff'
        }).setOrigin(0.5);

        this.add.text(width / 2, height / 2 + 45, 'Regresando al lobby de NEXUS...', {
            font: '11px Inter',
            fill: '#9ca3af'
        }).setOrigin(0.5);

        this.time.delayedCall(3500, () => this.exitToMainMenu());
    }

    /**
     * Pantalla de éxito de jornada / evento
     */
    triggerVictory(subtitleMsg) {
        if (this.gameOver || this.victory) return;
        this.victory = true;
        console.log('[Game Loop] ¡Victoria del día!');

        if (this.timerEvent) this.timerEvent.paused = true;

        const activeLevel = this.getActiveLevelScene();
        if (activeLevel) {
            activeLevel.physics.pause();
            activeLevel.tweens.pauseAll();
            activeLevel.input.enabled = false;
        }

        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const overlay = this.add.graphics();
        overlay.fillStyle(0x07090e, 0.88);
        overlay.fillRect(0, 0, width, height);

        const titulo = this.levelMode === 'work' ? 'DÍA PRODUCTIVO' : 'NOCHE INOLVIDABLE';

        const glow = this.add.text(width / 2, height / 2 - 35, titulo, {
            font: '32px Orbitron',
            fill: '#00f2fe',
            fontWeight: 'bold',
            letterSpacing: 2
        }).setOrigin(0.5);
        glow.setShadow(0, 0, '#00f2fe', 15, true, true);

        this.add.text(width / 2, height / 2 - 35, titulo, {
            font: '30px Orbitron',
            fill: '#ffffff',
            fontWeight: 'bold',
            letterSpacing: 2
        }).setOrigin(0.5);

        this.add.text(width / 2, height / 2 + 10, subtitleMsg, {
            font: '12px Inter',
            fill: '#39ff14',
            fontWeight: '600'
        }).setOrigin(0.5);

        this.add.text(width / 2, height / 2 + 40, `RESUMEN  💰 ${this.tohol}  ⭐ ${this.reputation}`, {
            font: '12px Orbitron',
            fill: '#f5d061'
        }).setOrigin(0.5);

        this.time.delayedCall(3500, () => this.exitToMainMenu());
    }

    /**
     * Pequeño feedback visual cuando un texto cambia su valor
     */
    flashText(textObject, highlightColor) {
        const originalColor = textObject.style.color;
        textObject.setFill(highlightColor);
        textObject.setScale(1.15);

        this.time.delayedCall(200, () => {
            textObject.setFill(originalColor);
            textObject.setScale(1.0);
        });
    }
}
