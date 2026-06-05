# NEXUS LIFE: Realidad Expandida

**Ecosistema Social-Económico RPG** — Prototipo desarrollado en Phaser 3 para el Taller de Videojuegos 2D de la Escuela Politécnica Nacional (EPN), 2026.

## Descripción

**NEXUS LIFE: Realidad Expandida** es un RPG/simulación 2D de estética cyberpunk donde el jugador construye su identidad social-económica dentro de una megaciudad llamada **NEXUS**. La partida se divide en dos distritos:

- **Distrito Financiero (Nivel 1):** aceptar trabajos de reparto, ganar moneda **TOHOL** y gastar esa moneda en una tienda multi-ítem para adquirir una nueva vida (casa, vehículo, avatar premium, chip de velocidad, recarga de energía).
- **Distrito Social (Nivel 2):** asistir a eventos nocturnos, socializar con anfitriones IA (NPCs), esquivar bots de seguridad mal configurados y acumular **Reputación** para acceder al evento principal.

El HUD expone 4 stats en vivo (TOHOL · Energía · Reputación · Horario) y dos condiciones de victoria (≥100 TOHOL en L1, ≥50 REP en L2). La energía a 0 provoca una **Desconexión Forzada** (Game Over).

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
├── FLUJO_DEL_JUEGO.md    # Flujo de pantallas y arquitectura detallada
├── assets/
│   ├── 1 Tiles/          # Tilesets industriales (platform_tile)
│   ├── 2 Background/     # Capas de parallax (cielo, lejano, cercano, frontal)
│   ├── 1 Biker/          # Spritesheets del Jugador 1 (Biker)
│   ├── 2 Punk/           # Spritesheets del Jugador 2 (Punk)
│   ├── 3 Cyborg/         # Spritesheets de NPC ambient (Cyborg)
│   ├── 3 Objects/        # Objetos estáticos
│   ├── 4 Animated objects/
│   ├── audio/            # (opcional) SFX y música
│   ├── maps/             # (opcional) Mapas Tiled .json
│   ├── GUIA_DE_ASSETS.md
│   └── license.txt
├── src/
│   ├── main.js           # Configuración de Phaser.Game e integración consola HTML
│   └── scenes/
│       ├── BootScene.js       # Precarga + texturas procedurales (paquetes, glitches, iconos, vendor)
│       ├── MainMenuScene.js   # Menú narrativo con tarjetas de ambos distritos
│       ├── Level1Scene.js     # Distrito Financiero (entregas + tienda + glitches)
│       ├── Level2Scene.js     # Distrito Social (parkour + eventos + bots)
│       └── UIScene.js         # HUD TOHOL/Energía/Reputación/Horario
```

## Requisitos e Instalación

### Requisitos
- **Node.js** (v12 o superior)
- **Navegador web moderno** con soporte para ES Modules

### Instalación
1. Abrir terminal en la carpeta `Proyecto/`.
2. Iniciar el servidor:
   ```bash
   node server.js
   ```
3. Abrir navegador en [http://localhost:3000](http://localhost:3000).

> **¿Por qué un servidor?**  
> Phaser 3 carga imágenes locales (PNG, JSON) y los navegadores bloquean `file://` por CORS. `server.js` resuelve esto de forma liviana.

## Controles

### En los niveles
| Tecla | Acción |
|-------|--------|
| `W` / `↑` / `SPACE` | Saltar (doble salto en L2) |
| `A` / `←` · `D` / `→` | Moverse |
| `SHIFT` | Dash (Nivel 2) |
| `E` | Interactuar / Socializar / Comprar |
| `1`–`5` | Comprar ítem en tienda (Nivel 1) |
| `ESC` | Pausa · `ENTER` Reanudar · `Q` Salir al menú |

### Consola de pruebas (panel lateral HTML)
| Botón | Acción |
|-------|--------|
| `+ Sumar +25 TOHOL` | Dispara `dev-add-tohol` |
| `⚡ Restar -1 Energía` | Dispara `dev-sub-energy` |
| `★ Sumar +5 Reputación` | Dispara `dev-add-rep` |
| `⏱ Añadir +30s` | Dispara `dev-add-timer` |
| `Reiniciar HUD` | Dispara `dev-reset-hud` |

## Arquitectura del Juego

### Sistema de Escenas (Phaser Scene Manager)
```
BootScene
   ↓
MainMenuScene
   ↓
┌─────────────────────────┐
│ Level1Scene (Financiero)│ ← lanza UIScene
│   o                     │
│ Level2Scene (Social)    │
└─────────────────────────┘
          ↓
  UIScene (HUD overlay, comunica vía game.events)
```

### Mecánicas por nivel (cumple 3+ por escenario)

**Nivel 1 — Distrito Financiero (Biker):**
1. **Trabajos de entrega** — Recoger 5 paquetes y entregarlos a 4 clientes NPCs (`+50 TOHOL` cada uno).
2. **Tienda multi-ítem** — 5 productos (Recarga Energía, Chip Velocidad, Avatar Premium, Vehículo, Casa) controlados con teclas `1`–`5`.
3. **Glitches del sistema** — 5 zonas rojas parpadeantes que dañan al contacto (sustituyen los pinchos genéricos con justificación narrativa).

**Nivel 2 — Distrito Social (Punk):**
4. **Parkour social** — Doble salto + Dash con rastro para acceder a terrazas y azoteas donde ocurren los eventos.
5. **Eventos sociales** — 6 áreas temáticas con anfitriones IA y ciudadanos invitados; `E` para socializar y ganar `+10 REP` (con cooldown anti-farming).
6. **Bots de seguridad mal configurados** — 3 bots patrulla con IA; daño lateral o desactivación saltando encima (`+5 REP`).

### HUD (UIScene)
- **TOHOL** (moneda del metaverso) — barra izquierda, dorada.
- **ENERGÍA** — barra segmentada cyan → amarillo → rojo (3 cargas, 0 = Game Over).
- **REPUTACIÓN** — barra central-derecha, verde (0–100).
- **HORARIO** — countdown MM:SS, rosado (90s por defecto).
- Banner inferior con modo activo: `DISTRITO SOCIAL · Reputación mínima: 50`.

### Condiciones de fin
- **Victoria:** L1 → `goal-reached` con TOHOL ≥ 100. L2 → `goal-reached` con REP ≥ 50.
- **Game Over:** Energía ≤ 0 (`DESCONEXIÓN FORZADA`) o tiempo agotado sin meta.
- **Soft Fail:** Llegar al portal sin la cuota mínima (`CUOTA NO ALCANZADA` / `SIN INVITACIÓN AL EVENTO PRINCIPAL`).

### Comunicación entre escenas (bus global `game.events`)
- **Nivel → HUD:** `set-level-mode`, `add-tohol`, `change-energy`, `add-reputation`, `goal-reached`.
- **Consola HTML → HUD:** `dev-add-tohol`, `dev-sub-energy`, `dev-add-rep`, `dev-add-timer`, `dev-reset-hud`.

### Texturas procedurales (fallback)
`BootScene.createProceduralTextures()` genera en tiempo de ejecución:
- `package` (caja marrón con cinta) — trabajos de L1.
- `hazard` rojo con parpadeo — glitches del sistema.
- `npc_citizen`, `npc_client`, `npc_host` — NPCs no hostiles.
- `event_zone` rosa neón — áreas de eventos sociales.
- `security_bot` con tinte rojo — bots de L2.
- `icon_exclaim`, `icon_dollar`, `icon_star` — indicadores sobre NPCs.
- `vendor` dorado / `vendor_cyan` — tienda y power-up.
- `particle_spark` — chispas de partículas para pickups y double-jump.

### Audio
Sistema con `try/catch` para evitar errores fatales. Los SFX (`sfx_jump`, `sfx_coin`, `sfx_damage`) se verifican antes de reproducirse. Si no existen, la acción se ejecuta en silencio (sin romper el flujo).

## Personalización y Desarrollo

### Añadir nuevos assets
1. Colocar archivo en la subcarpeta correspondiente de `assets/`.
2. En `src/scenes/BootScene.js`, método `preload()`, agregar:
   ```js
   this.load.image('mi_clave', 'assets/ruta/al/archivo.png');
   // o this.load.spritesheet('clave', 'ruta', { frameWidth, frameHeight });
   ```
3. Usar la clave desde cualquier escena.

### Añadir un nuevo distrito
1. Crear `src/scenes/NuevoDistritoScene.js` (extender `Phaser.Scene`).
2. Importarlo en `src/main.js` y añadirlo al array `scene[]`.
3. En `MainMenuScene.js`, agregar tarjeta de selección con `createLevelButton()`.

## Licencia

Los assets gráficos provienen de [Craftpix](https://craftpix.net/) bajo licencia gratuita (ver `assets/license.txt`). El código fuente es de uso educativo para el Taller de Videojuegos 2D - EPN 2026.
