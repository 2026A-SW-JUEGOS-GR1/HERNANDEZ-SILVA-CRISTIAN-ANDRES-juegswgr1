# NEXUS LIFE

**Ecosistema Social-Económico RPG** — Prototipo desarrollado en Phaser 3 para el Taller de Videojuegos 2D de la Escuela Politécnica Nacional (EPN), 2026.

## Descripción

NEXUS LIFE es un videojuego de plataformas 2D con estética cyberpunk/neón donde el jugador explora dos escenarios (Comercial y Social) con mecánicas de parkour, combate aéreo, economía interna (moneda TOHOL), power-ups y un HUD interactivo. El proyecto funciona como prototipo educativo para demostrar físicas Arcade, sistemas de escenas, partículas, audio y UI superpuesta en Phaser 3.

## Stack Tecnológico

- **Motor de juego:** [Phaser 3.60.0](https://phaser.io/) (CDN vía jsDelivr)
- **Lenguaje:** JavaScript (ES Modules nativos, sin bundler)
- **Estilos:** CSS3 con Glassmorphism y Cyberpunk (variables CSS, Google Fonts Orbitron + Inter)
- **Servidor local:** Node.js (http nativo, sin dependencias externas)
- **Físicas:** Arcade 2D (gravedad 800px/s², colisiones, overlap)

## Estructura del Proyecto

```
Proyecto/
├── index.html            # Punto de entrada HTML con layout de dos paneles
├── styles.css            # Estilos CSS con tema oscuro/neón
├── server.js             # Servidor HTTP local (Node.js, sin dependencias)
├── README.md             # Este archivo
├── assets/
│   ├── 1 Tiles/          # Tilesets industriales (platform_tile)
│   ├── 2 Background/     # Capas de parallax (cielo, lejano, cercano, frontal)
│   ├── 1 Biker/          # Spritesheets del Jugador 1 (Biker)
│   ├── 2 Punk/           # Spritesheets del Jugador 2 (Punk)
│   ├── 3 Cyborg/         # Spritesheets del enemigo (Cyborg)
│   ├── 3 Objects/        # Objetos estáticos (cajas, barriles, vallas, etc.)
│   ├── 4 Animated objects/ # Objetos animados (monedas, plataformas, transporters, etc.)
│   ├── audio/            # (CARPETA PENDIENTE) Archivos de audio .mp3
│   ├── maps/             # (CARPETA PENDIENTE) Mapas Tiled .json
│   ├── GUIA_DE_ASSETS.md # Guía para añadir nuevos assets
│   ├── license.txt       # Licencia de assets gratuitos de Craftpix
│   └── license copy.txt  #
├── src/
│   ├── main.js           # Configuración de Phaser.Game e integración HTML
│   └── scenes/
│       ├── BootScene.js      # Precarga de assets + texturas procedurales (fallback)
│       ├── MainMenuScene.js  # Menú principal con selección de niveles
│       ├── Level1Scene.js    # Nivel 1: Escenario Comercial (parkour + combate)
│       ├── Level2Scene.js    # Nivel 2: Escenario Social (dash + doble salto + NPC)
│       └── UIScene.js        # HUD superpuesto (puntos, vidas, temporizador, game over/victoria)
```

## Requisitos e Instalación

### Requisitos

- **Node.js** (v12 o superior) — para el servidor HTTP local
- **Navegador web moderno** (Chrome, Firefox, Edge) con soporte para ES Modules

### Instalación

1. **Clonar o descargar** el repositorio.
2. Abrir una terminal en la carpeta `Proyecto/`.
3. **Iniciar el servidor:**
   ```bash
   node server.js
   ```
4. **Abrir el navegador** en [http://localhost:3000](http://localhost:3000).

> **¿Por qué un servidor?**  
> Phaser 3 necesita cargar imágenes locales (PNG, JSON) y los navegadores bloquean las solicitudes `file://` por CORS. El servidor `server.js` resuelve esto de forma liviana y sin dependencias npm.

### Assets pendientes (opcionales)

El juego funciona con texturas procedurales generadas en código como fallback. Para la experiencia completa:

| Recurso | Ubicación | Estado |
|---------|-----------|--------|
| Sprites Biker/Punk/Cyborg | `assets/1 Biker/`, `assets/2 Punk/`, `assets/3 Cyborg/` | ✅ Incluidos |
| Tiles industriales | `assets/1 Tiles/` | ✅ Incluidos |
| Fondos parallax | `assets/2 Background/` | ✅ Incluidos |
| Objetos animados/estáticos | `assets/3 Objects/`, `assets/4 Animated objects/` | ✅ Incluidos |
| **Audio** (jump, coin, damage, music) | `assets/audio/` | ❄️ Pendiente |
| **Mapas Tiled** | `assets/maps/` | ❄️ Pendiente (niveles procedurales activos) |

## Controles

### En los niveles
| Tecla | Acción |
|-------|--------|
| `W` / `↑` / `SPACE` | Saltar / Doble salto (en el aire) |
| `A` / `←` | Moverse a la izquierda |
| `D` / `→` | Moverse a la derecha |
| `S` / `↓` | (Sin uso actual) |
| `SHIFT` | Dash (solo Nivel 2) |
| `E` | Interactuar con NPC Vendedor (solo Nivel 2) |
| `ESC` | Pausar/Reanudar |
| `ENTER` | Reanudar (cuando está pausado) |
| `Q` | Salir al menú principal (cuando está pausado) |

### Consola de pruebas (panel lateral HTML)
| Botón | Acción |
|-------|--------|
| `+ Sumar +10 Puntos` | Añade 10 puntos al score |
| `♥ Restar -1 Vida` | Reduce 1 vida |
| `⏱ Añadir +30s` | Añade 30 segundos al temporizador |
| `Reiniciar HUD` | Resetea score, vidas y timer |

## Arquitectura del Juego

### Sistema de Escenas (Phaser Scene Manager)

```
BootScene (precarga + texturas procedurales)
    ↓
MainMenuScene (selección de nivel)
    ↓
┌───────────────────┐
│ Level1Scene       │ ← lanza UIScene como overlay
│   o               │
│ Level2Scene       │
└───────────────────┘
        ↓
  UIScene (HUD superpuesto, comunica vía game.events)
```

### Mecánicas implementadas

| Mecánica | Nivel 1 (Comercial) | Nivel 2 (Social) |
|----------|---------------------|-------------------|
| Coyote Time (100ms) | ✅ | ✅ |
| Jump Buffer (150ms) | ✅ | ✅ |
| Doble salto | ✅ | ✅ |
| Monedas TOHOL | ✅ (con partículas doradas) | ✅ (con partículas rosadas) |
| Enemigos patrulla (IA) | ✅ (5 enemigos) | ✅ (6 enemigos) |
| Combate aéreo | ✅ (destroy desde arriba) | ✅ |
| Plataforma móvil | ✅ | ❌ |
| Pinchos/trampas (hazard) | ✅ | ❌ |
| Dash | ❌ | ✅ |
| NPC Vendedor (power-up velocidad) | ❌ | ✅ |
| Parallax scrolling (3 capas) | ✅ | ✅ |
| Sistema de audio | ✅ (con fallback seguro) | ✅ |
| Partículas JUICE | ✅ | ✅ |
| Menú de pausa | ✅ | ✅ |
| Time attack (60s) | ✅ | ✅ |
| Victoria por portal o tiempo | ✅ | ✅ |

### Comunicación entre escenas

Las escenas se comunican mediante el bus de eventos global de Phaser (`game.events`):

- **Nivel → HUD:** `add-score`, `lose-life`, `goal-reached`
- **Consola HTML → HUD:** `dev-add-score`, `dev-sub-life`, `dev-add-timer`, `dev-reset-hud`

### Texturas procedurales (fallback)

`BootScene.createProceduralTextures()` genera texturas en tiempo de ejecución para:
- Botones del menú (`btn_level1`, `btn_level2`)
- Tileset de emergencia (`tileset_fallback`)
- Plataforma móvil (`platform`)
- Zonas de peligro (`hazard`)
- NPC Vendedor (`npc`)
- Portal de meta (`portal`)
- Partículas (`particle_spark`)

Si los assets reales están presentes, Phaser los usa en lugar de las texturas procedurales.

### Audio

El sistema de audio usa try/catch para evitar errores fatales si los archivos no existen. Los SFX se cargan en `BootScene` y se reproducen mediante `this.sound.play()` con verificación previa de existencia.

## Personalización y Desarrollo

### Añadir nuevos assets

1. Colocar el archivo en la subcarpeta correspondiente de `assets/`.
2. En `src/scenes/BootScene.js`, método `preload()`, agregar la línea de carga:
   ```js
   this.load.image('mi_clave', 'assets/ruta/al/archivo.png');
   // o this.load.spritesheet('clave', 'ruta', { frameWidth, frameHeight });
   ```
3. La textura estará disponible en todas las escenas usando `'mi_clave'`.

### Añadir un nuevo nivel

1. Crear `src/scenes/NuevoNivelScene.js` (extender `Phaser.Scene`).
2. Importarlo en `src/main.js` y agregarlo al array `scene[]`.
3. En `MainMenuScene.js`, agregar un botón con `createMenuButton()` que llame a `this.startLevel('NuevoNivelScene')`.

## Licencia

Los assets gráficos provienen de [Craftpix](https://craftpix.net/) bajo licencia gratuita (ver `assets/license.txt`). El código fuente es de uso educativo para el Taller de Videojuegos 2D - EPN 2026.
