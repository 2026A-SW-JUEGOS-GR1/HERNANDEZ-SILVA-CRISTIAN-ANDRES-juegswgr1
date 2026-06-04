/**
 * ==========================================================================
 * NEXUS LIFE - UI HUD Scene (Overlay)
 * ==========================================================================
 */

export default class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene' });
    }

    init() {
        // Inicialización y reinicio completo del estado cada vez que se arranca la escena
        this.score = 0;
        this.lives = 3;
        this.timeRemaining = 60; // 60 segundos por nivel para Time Attack
        this.gameOver = false;
        this.victory = false;
    }

    create() {
        console.log('[Scene Manager] Ejecutando UIScene (Overlay HUD con reinicio).');

        const width = this.cameras.main.width;

        // 1. Dibujar el marco superior del HUD (Translúcido y Neón)
        this.drawHUDBar(width);

        // 2. Elementos del HUD (Textos con Orbitron)
        // Score
        this.scoreText = this.add.text(25, 12, 'PUNTOS: 0000', {
            font: '14px Orbitron',
            fill: '#00f2fe',
            fontWeight: 'bold',
            letterSpacing: 1
        });

        // Lives
        this.livesText = this.add.text(width / 2, 12, 'VIDAS: ❤️ ❤️ ❤️', {
            font: '14px Orbitron',
            fill: '#ff007f',
            fontWeight: 'bold',
            letterSpacing: 1
        }).setOrigin(0.5, 0);

        // Timer
        this.timerText = this.add.text(width - 25, 12, 'TIEMPO: 01:00', {
            font: '14px Orbitron',
            fill: '#f5d061',
            fontWeight: 'bold',
            letterSpacing: 1
        }).setOrigin(1, 0);

        // 3. Temporizador Activo del Juego
        this.startTimer();

        // 4. SUSCRIPCIÓN A EVENTOS (Comunicación de Escenas y Consola de Pruebas)
        this.setupEventListeners();
    }

    /**
     * Dibuja una barra de fondo traslúcida y un borde neón azul en la parte superior.
     */
    drawHUDBar(width) {
        const hudBg = this.add.graphics();
        
        // Relleno oscuro translúcido
        hudBg.fillStyle(0x07090e, 0.75);
        hudBg.fillRect(0, 0, width, 40);

        // Borde neón inferior
        hudBg.lineStyle(1.5, 0x00f2fe, 0.5);
        hudBg.lineBetween(0, 40, width, 40);
    }

    /**
     * Inicia el temporizador descendente de la simulación.
     */
    startTimer() {
        if (this.timerEvent) {
            this.timerEvent.destroy();
        }

        this.timerEvent = this.time.addEvent({
            delay: 1000,
            callback: () => {
                if (this.gameOver || this.victory) return;

                if (this.timeRemaining > 0) {
                    this.timeRemaining--;
                    this.updateTimerDisplay();
                } else {
                    this.timerText.setText('TIEMPO: AGOTADO');
                    this.timerText.setFill('#ff0000');
                    
                    // Condición de victoria por supervivencia (Time Attack)
                    this.triggerVictory('¡SOBREVIVISTE! SIMULACIÓN COMPLETADA');
                }
            },
            callbackScope: this,
            loop: true
        });
    }

    /**
     * Formatea e imprime los segundos restantes en formato MM:SS.
     */
    updateTimerDisplay() {
        const minutes = Math.floor(this.timeRemaining / 60);
        const seconds = this.timeRemaining % 60;
        const formattedTime = `TIEMPO: ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        this.timerText.setText(formattedTime);
    }

    /**
     * Actualiza el marcador de vidas representándolo con corazones.
     */
    updateLivesDisplay() {
        let hearts = '';
        for (let i = 0; i < 3; i++) {
            if (i < this.lives) {
                hearts += '❤️ ';
            } else {
                hearts += '🖤 ';
            }
        }
        this.livesText.setText(`VIDAS: ${hearts.trim()}`);

        if (this.lives <= 1) {
            this.livesText.setFill('#ff0000');
        } else {
            this.livesText.setFill('#ff007f');
        }
    }

    /**
     * Actualiza el marcador de puntuación.
     */
    updateScoreDisplay() {
        const formattedScore = `PUNTOS: ${String(this.score).padStart(4, '0')}`;
        this.scoreText.setText(formattedScore);
    }

    /**
     * Registra y vincula los eventos globales para recibir comandos de los niveles y consola.
     */
    setupEventListeners() {
        // --- EVENTOS DEL JUEGO (Desde Level1Scene o Level2Scene) ---
        
        this.game.events.on('add-score', (points) => {
            if (this.gameOver || this.victory) return;
            this.score = Math.max(0, this.score + points); // Evitar puntuación negativa
            this.updateScoreDisplay();
            this.flashText(this.scoreText, '#39ff14');
        });

        this.game.events.on('lose-life', (amount) => {
            if (this.gameOver || this.victory) return;
            this.lives = Math.max(0, this.lives - amount);
            this.updateLivesDisplay();
            this.flashText(this.livesText, '#ff007f');

            // Verificar derrota
            if (this.lives <= 0) {
                this.triggerGameOver();
            }
        });

        // Evento de meta alcanzada (Victoria física)
        this.game.events.on('goal-reached', () => {
            this.triggerVictory('¡PORTAL ALCANZADO! ZONA COMPLETADA');
        });

        // --- EVENTOS DESDE LA CONSOLA DE PRUEBAS HTML ---

        this.game.events.on('dev-add-score', (points) => {
            if (this.gameOver || this.victory) return;
            this.score = Math.max(0, this.score + points);
            this.updateScoreDisplay();
            this.flashText(this.scoreText, '#39ff14');
        });

        this.game.events.on('dev-sub-life', (amount) => {
            if (this.gameOver || this.victory) return;
            this.lives = Math.max(0, this.lives - amount);
            this.updateLivesDisplay();
            this.flashText(this.livesText, '#ff007f');
            if (this.lives <= 0) {
                this.triggerGameOver();
            }
        });

        this.game.events.on('dev-add-timer', (seconds) => {
            if (this.gameOver || this.victory) return;
            this.timeRemaining += seconds;
            this.updateTimerDisplay();
            this.flashText(this.timerText, '#00f2fe');
        });

        this.game.events.on('dev-reset-hud', () => {
            this.score = 0;
            this.lives = 3;
            this.timeRemaining = 60;
            this.gameOver = false;
            this.victory = false;
            this.updateScoreDisplay();
            this.updateLivesDisplay();
            this.updateTimerDisplay();
            this.timerText.setFill('#f5d061');
            this.flashText(this.scoreText, '#ffffff');
            this.flashText(this.livesText, '#ffffff');
            this.flashText(this.timerText, '#ffffff');
            
            // Reanudar nivel si estaba pausado
            const activeLevel = this.getActiveLevelScene();
            if (activeLevel) {
                activeLevel.physics.resume();
                activeLevel.input.keyboard.enabled = true;
            }
            if (this.timerEvent) this.timerEvent.paused = false;
        });

        // Limpieza automática de eventos al apagar la escena
        this.events.once('shutdown', () => {
            this.game.events.off('add-score');
            this.game.events.off('lose-life');
            this.game.events.off('goal-reached');
            this.game.events.off('dev-add-score');
            this.game.events.off('dev-sub-life');
            this.game.events.off('dev-add-timer');
            this.game.events.off('dev-reset-hud');
            if (this.timerEvent) {
                this.timerEvent.destroy();
            }
        });
    }

    /**
     * Retorna la escena de nivel que se esté ejecutando activamente bajo el HUD.
     */
    getActiveLevelScene() {
        return this.scene.manager.getScenes(true).find(s => s.sys.settings.key !== 'UIScene');
    }

    /**
     * Detiene todas las escenas y regresa al menú de inicio.
     */
    exitToMainMenu() {
        const activeLevel = this.getActiveLevelScene();
        if (activeLevel) {
            this.scene.stop(activeLevel.sys.settings.key);
        }
        this.scene.stop('UIScene');
        this.scene.start('MainMenuScene');
    }

    /**
     * MECÁNICA: Disparador de Derrota (Game Over)
     */
    triggerGameOver() {
        if (this.gameOver || this.victory) return;
        this.gameOver = true;

        console.log('[Game Loop] Activando Game Over (Derrota).');

        // Pausar temporizador descendente
        if (this.timerEvent) this.timerEvent.paused = true;

        // Congelar y pausar nivel de juego activo
        const activeLevel = this.getActiveLevelScene();
        if (activeLevel) {
            activeLevel.physics.pause();
            activeLevel.tweens.pauseAll();
            activeLevel.input.enabled = false;
        }

        // Renderizar pantalla de Game Over
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const overlay = this.add.graphics();
        overlay.fillStyle(0x07090e, 0.85);
        overlay.fillRect(0, 0, width, height);

        const textGlow = this.add.text(width / 2, height / 2 - 30, 'CONEXIÓN PERDIDA', {
            font: '34px Orbitron',
            fill: '#ff0055',
            fontWeight: 'bold',
            letterSpacing: 2
        }).setOrigin(0.5);
        textGlow.setShadow(0, 0, '#ff0055', 15, true, true);

        const textTitle = this.add.text(width / 2, height / 2 - 30, 'CONEXIÓN PERDIDA', {
            font: '32px Orbitron',
            fill: '#ffffff',
            fontWeight: 'bold',
            letterSpacing: 2
        }).setOrigin(0.5);

        const subText = this.add.text(width / 2, height / 2 + 25, 'GAME OVER - Desconectando del servidor...', {
            font: '12px Inter',
            fill: '#9ca3af'
        }).setOrigin(0.5);

        // Regresar al menú principal tras 3 segundos
        this.time.delayedCall(3000, () => {
            this.exitToMainMenu();
        });
    }

    /**
     * MECÁNICA: Disparador de Victoria (Portal / Tiempo agotado con supervivencia)
     */
    triggerVictory(titleMsg) {
        if (this.gameOver || this.victory) return;
        this.victory = true;

        console.log('[Game Loop] Activando Nivel Completado (Victoria).');

        // Pausar temporizador
        if (this.timerEvent) this.timerEvent.paused = true;

        // Congelar físicas y tweens en nivel activo
        const activeLevel = this.getActiveLevelScene();
        if (activeLevel) {
            activeLevel.physics.pause();
            activeLevel.tweens.pauseAll();
            activeLevel.input.enabled = false;
        }

        // Renderizar pantalla de Victoria
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const overlay = this.add.graphics();
        overlay.fillStyle(0x07090e, 0.85);
        overlay.fillRect(0, 0, width, height);

        const textGlow = this.add.text(width / 2, height / 2 - 30, 'SIMULACIÓN COMPLETADA', {
            font: '34px Orbitron',
            fill: '#00f2fe',
            fontWeight: 'bold',
            letterSpacing: 2
        }).setOrigin(0.5);
        textGlow.setShadow(0, 0, '#00f2fe', 15, true, true);

        const textTitle = this.add.text(width / 2, height / 2 - 30, 'SIMULACIÓN COMPLETADA', {
            font: '32px Orbitron',
            fill: '#ffffff',
            fontWeight: 'bold',
            letterSpacing: 2
        }).setOrigin(0.5);

        const subText = this.add.text(width / 2, height / 2 + 25, titleMsg, {
            font: '12px Inter',
            fill: '#39ff14',
            fontWeight: '600'
        }).setOrigin(0.5);

        // Regresar al menú principal tras 3 segundos
        this.time.delayedCall(3000, () => {
            this.exitToMainMenu();
        });
    }

    /**
     * Aplica un efecto visual rápido de parpadeo a un texto cuando cambia su valor.
     */
    flashText(textObject, highlightColor) {
        const originalColor = textObject.style.color;
        textObject.setFill(highlightColor);
        textObject.setScale(1.1);

        this.time.delayedCall(200, () => {
            textObject.setFill(originalColor);
            textObject.setScale(1.0);
        });
    }
}
