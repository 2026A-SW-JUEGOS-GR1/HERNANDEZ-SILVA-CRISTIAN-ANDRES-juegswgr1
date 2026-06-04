/**
 * ==========================================================================
 * NEXUS LIFE - Configuración Principal del Juego (Phaser 3)
 * ==========================================================================
 */

import BootScene from './scenes/BootScene.js';
import MainMenuScene from './scenes/MainMenuScene.js';
import Level1Scene from './scenes/Level1Scene.js';
import Level2Scene from './scenes/Level2Scene.js';
import UIScene from './scenes/UIScene.js';

// Configuración general de Phaser
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 500,
    parent: 'game-container',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 800 },
            debug: false
        }
    },
    // Mantener los pixeles nítidos para un look Pixel Art nítido
    pixelArt: true,
    roundPixels: true,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    // Registro de todas las escenas en el Scene Manager
    scene: [
        BootScene,
        MainMenuScene,
        Level1Scene,
        Level2Scene,
        UIScene
    ]
};

// Crear instancia del juego
const game = new Phaser.Game(config);

// Integración de la Consola de Pruebas HUD Externa
// Esto permite que los botones del panel lateral HTML interactúen con UIScene a través de eventos globales de Phaser.
document.addEventListener('DOMContentLoaded', () => {
    const btnAddScore = document.getElementById('btn-add-score');
    const btnSubLife = document.getElementById('btn-sub-life');
    const btnAddTimer = document.getElementById('btn-add-timer');
    const btnResetHud = document.getElementById('btn-reset-hud');

    if (btnAddScore) {
        btnAddScore.addEventListener('click', () => {
            console.log('[Dev Console] Emitiendo add-score (+10)');
            game.events.emit('dev-add-score', 10);
        });
    }

    if (btnSubLife) {
        btnSubLife.addEventListener('click', () => {
            console.log('[Dev Console] Emitiendo sub-life (-1)');
            game.events.emit('dev-sub-life', 1);
        });
    }

    if (btnAddTimer) {
        btnAddTimer.addEventListener('click', () => {
            console.log('[Dev Console] Emitiendo add-timer (+30s)');
            game.events.emit('dev-add-timer', 30);
        });
    }

    if (btnResetHud) {
        btnResetHud.addEventListener('click', () => {
            console.log('[Dev Console] Emitiendo reset-hud');
            game.events.emit('dev-reset-hud');
        });
    }
});

export default game;
