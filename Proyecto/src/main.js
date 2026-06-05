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
    width: 1280,
    height: 800,
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
    const btnAddTohol   = document.getElementById('btn-add-tohol');
    const btnSubEnergy  = document.getElementById('btn-sub-energy');
    const btnAddRep     = document.getElementById('btn-add-rep');
    const btnAddTimer   = document.getElementById('btn-add-timer');
    const btnResetHud   = document.getElementById('btn-reset-hud');

    if (btnAddTohol) {
        btnAddTohol.addEventListener('click', () => {
            console.log('[Dev Console] Emitiendo dev-add-tohol (+25)');
            game.events.emit('dev-add-tohol', 25);
        });
    }

    if (btnSubEnergy) {
        btnSubEnergy.addEventListener('click', () => {
            console.log('[Dev Console] Emitiendo dev-sub-energy (-1)');
            game.events.emit('dev-sub-energy', 1);
        });
    }

    if (btnAddRep) {
        btnAddRep.addEventListener('click', () => {
            console.log('[Dev Console] Emitiendo dev-add-rep (+5)');
            game.events.emit('dev-add-rep', 5);
        });
    }

    if (btnAddTimer) {
        btnAddTimer.addEventListener('click', () => {
            console.log('[Dev Console] Emitiendo dev-add-timer (+30s)');
            game.events.emit('dev-add-timer', 30);
        });
    }

    if (btnResetHud) {
        btnResetHud.addEventListener('click', () => {
            console.log('[Dev Console] Emitiendo dev-reset-hud');
            game.events.emit('dev-reset-hud');
        });
    }

    // =========================================================
    // BOTÓN MUTE - Silenciar / Activar música del juego
    // Usa el flag global de Phaser `game.sound.mute` para
    // silenciar TODA la reproducción (música + SFX) en un click.
    // =========================================================
    const btnMute = document.getElementById('btn-mute');
    if (btnMute) {
        btnMute.addEventListener('click', () => {
            game.sound.mute = !game.sound.mute;
            const muted = game.sound.mute;
            btnMute.textContent = muted ? '🔇' : '🔊';
            btnMute.classList.toggle('muted', muted);
            btnMute.setAttribute('aria-pressed', muted ? 'true' : 'false');
            btnMute.title = muted ? 'Activar sonido' : 'Silenciar sonido';
            console.log(`[Audio] Sonido ${muted ? 'silenciado' : 'activado'}.`);
        });
    }

    // =========================================================
    // BOTÓN FULLSCREEN - Alternar pantalla completa
    // Usa la Fullscreen API sobre el contenedor del juego
    // (`.neon-border-wrapper`) para que SOLO la pantalla del
    // juego se expanda, sin perder la estética de la página.
    // El CSS `.neon-border-wrapper:fullscreen` se encarga de
    // quitar el aspect-ratio y rellenar todo el viewport.
    // =========================================================
    const btnFullscreen = document.getElementById('btn-fullscreen');
    const fullscreenTarget = document.querySelector('.neon-border-wrapper');

    const getFullscreenElement = () =>
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement ||
        null;

    const requestFullscreen = (el) => {
        const fn = el.requestFullscreen ||
                   el.webkitRequestFullscreen ||
                   el.mozRequestFullScreen ||
                   el.msRequestFullscreen;
        if (fn) return fn.call(el);
        return Promise.reject(new Error('Fullscreen API no soportada'));
    };

    const exitFullscreen = () => {
        const fn = document.exitFullscreen ||
                   document.webkitExitFullscreen ||
                   document.mozCancelFullScreen ||
                   document.msExitFullscreen;
        if (fn) return fn.call(document);
        return Promise.reject(new Error('Fullscreen API no soportada'));
    };

    const updateFullscreenButton = () => {
        if (!btnFullscreen) return;
        const isFs = !!getFullscreenElement();
        btnFullscreen.textContent = isFs ? '⤡' : '⛶';
        btnFullscreen.classList.toggle('active', isFs);
        btnFullscreen.setAttribute('aria-pressed', isFs ? 'true' : 'false');
        btnFullscreen.title = isFs ? 'Salir de pantalla completa' : 'Pantalla completa';
    };

    if (btnFullscreen && fullscreenTarget) {
        btnFullscreen.addEventListener('click', () => {
            if (getFullscreenElement()) {
                exitFullscreen().catch(err => console.warn('[Fullscreen] No se pudo salir:', err));
            } else {
                requestFullscreen(fullscreenTarget)
                    .catch(err => console.warn('[Fullscreen] No se pudo entrar:', err));
            }
        });

        // Sincronizar el botón si el usuario sale con ESC o atajo del navegador.
        ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange']
            .forEach(evt => document.addEventListener(evt, updateFullscreenButton));
    }
});

// =========================================================
// DESBLOQUEO DE AUDIO (política de autoplay de los navegadores)
// Los navegadores modernos bloquean AudioContext hasta que el usuario
// realiza una primera interacción (clic, tecla, toque). Llamamos a
// `game.sound.unlock()` en el primer evento de input para que las
// escenas puedan reproducir música y SFX.
// =========================================================
const unlockAudio = () => {
    if (window.__nexusAudioUnlocked) return;
    window.__nexusAudioUnlocked = true;
    try {
        if (game.sound && typeof game.sound.unlock === 'function') {
            game.sound.unlock();
        }
        if (game.sound && game.sound.context && game.sound.context.state === 'suspended') {
            game.sound.context.resume();
        }
        // Avisamos a las escenas para que reinicien la música si ya estaba sonando.
        game.events.emit('audio-unlocked');
        console.log('[Audio] Contexto desbloqueado por interacción del usuario.');
    } catch (e) {
        console.warn('[Audio] No se pudo desbloquear el contexto:', e);
    }
};
['pointerdown', 'keydown', 'touchstart'].forEach(evt => {
    window.addEventListener(evt, unlockAudio, { once: false });
});

export default game;
