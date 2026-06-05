# FLUJO DEL JUEGO — NEXUS LIFE: Realidad Expandida

## Secuencia completa desde que se inicia hasta que termina

---

### 1. CARGA INICIAL (`BootScene`)

**¿Qué pasa?**
- Pantalla negra con texto *"CONECTANDO A NEXUS NETWORK..."*
- Barra de progreso neón
- Carga de todos los assets: tilesets, parallax, spritesheets de Biker/Punk/Cyborg, SFX, música.
- **Genera texturas procedurales** (fallback) para:
  - `package` — caja marrón con cinta (trabajos de L1)
  - `hazard` rojo parpadeante — glitches del sistema
  - `npc_citizen` — peatón ambiental
  - `npc_client` — cliente con pedido (rosa neón)
  - `npc_host` — anfitrión de evento (verde neón)
  - `event_zone` — plataforma de evento parpadeante
  - `security_bot` — bot patrulla con tinte rojo
  - `icon_exclaim` — indicador `!` sobre clientes
  - `icon_dollar` — indicador `$` sobre vendedor
  - `icon_star` — indicador `★` sobre anfitriones
  - `vendor` dorado / `vendor_cyan` — tienda y power-up
  - `particle_spark` — chispas de partículas

**Transición:** Al terminar, fade automático al Menú Principal.

---

### 2. MENÚ PRINCIPAL (`MainMenuScene`)

**¿Qué se ve?**
- Fondo cyberpunk con parallax y partículas ambientales.
- Título **"NEXUS LIFE"** con sombra cyan y subtítulo *"REALIDAD EXPANDIDA"*.
- **2 tarjetas de nivel** con descripciones narrativas:
  - **01 · DISTRITO FINANCIERO** — Trabajos · Compras · Propiedad (META: 100 TOHOL).
  - **02 · DISTRITO SOCIAL** — Eventos · NPCs · Reputación (META: 50 REP).
- Botones `▶ JUGAR NIVEL 1` (dorado) y `▶ JUGAR NIVEL 2` (rosado).
- Botones secundarios: **Créditos** y **Narrativa** (modales emergentes).
- Barra inferior con showcase de los **2 personajes** (Biker + Punk).
- Controles inferiores: WASD/Flechas, ESPACIO, SHIFT (dash), E (interactuar), 1-5 (tienda), ESC (pausa).

**Interacción:** Clic en tarjeta o tecla `1`/`2`. Fade-out e inicio del nivel.

---

### 3. NIVEL 1: DISTRITO FINANCIERO (`Level1Scene`)

#### 3.1 Arranque del nivel
- Fade-in de cámara, UIScene se lanza como overlay
- HUD recibe `set-level-mode { mode: 'work', label: 'DISTRITO FINANCIERO · Meta: 100 TOHOL' }`
- Parallax 3 capas, música, físicas Arcade (gravedad 800)

#### 3.2 El jugador — Biker
- Aparece en `(100, 300)`
- Hitbox 20x38, doble salto, coyote time 100ms, jump buffer 150ms
- Dash deshabilitado (se reserva para L2)

#### 3.3 El escenario (2500px de ancho)
- **Suelo segmentado** en 6 secciones con brechas.
- **6 plataformas aéreas** para parkour.
- **4 clientes NPC rosa** en sus casas (posiciones: 350, 750, 1300, 1900).
- **5 paquetes** flotando (cajas marrones) — trabajos de entrega.
- **5 glitches del sistema** rojos parpadeantes en zonas críticas.
- **1 vendedor dorado** (1700, height-100) — tienda multi-ítem.
- **4 ciudadanos ambientales** que oscilan en plazas.
- **Portal** en x=2500 con condición `goal-reached type:'work' minTohol:100`.

#### 3.4 Tienda multi-ítem (5 productos)
| Tecla | Producto | Precio | Efecto |
|-------|----------|--------|--------|
| `1` | Recarga de Energía | 50 TOHOL | `change-energy +1` (sin sobrepasar max) |
| `2` | Chip de Velocidad | 30 TOHOL | `speedMultiplier = 1.5x` permanente |
| `3` | Avatar Premium | 80 TOHOL | Tinte rosa permanente + `+15 REP` |
| `4` | Vehículo | 150 TOHOL | Power-up trophy (no se repite) |
| `5` | Casa | 250 TOHOL | Power-up trophy final (no se repite) |

#### 3.5 Mecánicas (3 exigidas por el taller + extras)

1. **Trabajos de entrega** — Recoger 5 paquetes (overlap) → entregarlos a clientes NPC con `!` flotante → `+50 TOHOL` cada uno, partículas doradas.
2. **Tienda multi-ítem** — `E` cerca del vendedor abre tienda. Teclas `1`–`5` compran ítems. `E`/`ESC` cierra. Rechaza si saldo insuficiente.
3. **Glitches del sistema** — 5 zonas rojas parpadeantes. Daño al contacto: `change-energy -1`, cámara flashea rojo y tiembla, respawn en `(100, 300)`.

#### 3.6 Controles
| Tecla | Acción |
|-------|--------|
| `W` / `↑` / `SPACE` | Saltar (coyote time 100ms + jump buffer 150ms) |
| `A` / `←` · `D` / `→` | Moverse |
| `E` | Abrir/cerrar tienda (cerca del vendedor) |
| `1`–`5` | Comprar ítem específico |
| `ESC` | Pausa · `ENTER` Reanudar · `Q` Salir |

#### 3.7 Pausa
- Overlay oscuro con marco neón. ENTER/ESC reanuda, Q sale al menú. Congela físicas, tweens y timer.

---

### 4. NIVEL 2: DISTRITO SOCIAL (`Level2Scene`)

#### 4.1 Arranque del nivel
- Mismo sistema que L1
- HUD recibe `set-level-mode { mode: 'social', label: 'DISTRITO SOCIAL · Reputación mínima: 50' }`
- Jugador cambia a **Punk** (spritesheet player2_*)

#### 4.2 El escenario (2800px de ancho)
- **Suelo segmentado** en 6 secciones con brechas más grandes (requieren Dash).
- **8 plataformas altas** (azoteas) que requieren doble salto.
- **6 eventos sociales** con plataforma parpadeante + anfitrión verde + 1-2 ciudadanos invitados:
  1. `After-Party Neon` (220, suelo)
  2. `Concierto Holográfico` (1100, suelo)
  3. `Meet & Greet VIP` (1380, plataforma alta)
  4. `Galería Cyber` (1880, plataforma alta)
  5. `Mercado Social` (2200, suelo)
  6. `Fiesta de Cierre` (2650, suelo)
- **3 Security Bots** patrullando con IA en posiciones 600, 1500, 2400.
- **Portal** en x=2700 con condición `goal-reached type:'social' minReputation:50`.

#### 4.3 Mecánicas (3 exigidas + extras)

4. **Parkour social (Doble salto + Dash)** — Doble salto con anillo de partículas rosadas. Dash con cooldown 1s, desactiva gravedad 150ms, crea rastro de fantasmas tinte `#ff007f`.
5. **Eventos sociales** — Acerca al anfitrión verde (distancia <60px) → prompt contextual `[E] ASISTIR ... +10 REP`. Cooldown de 5s por anfitrión + 2s global anti-farming. Al socializar: `add-reputation +10`, partículas rosadas, prompt flotante.
6. **Security Bots** — Patrulla horizontal, cambia dirección al chocar/bordear. Daño lateral: `change-energy -1` + respawn. Pisarlos desde arriba (`player.body.velocity.y > 0` y `player.y < bot.y - 12`): los destruye, rebota, `+5 REP`.

#### 4.4 Controles
| Tecla | Acción |
|-------|--------|
| `W` / `↑` / `SPACE` | Saltar (1º) / Doble salto (2º, en el aire) |
| `A` / `←` · `D` / `→` | Moverse |
| `SHIFT` | Dash horizontal (1s cooldown) |
| `E` | Socializar con anfitrión cercano |
| `ESC` | Pausa · `ENTER` Reanudar · `Q` Salir |

---

### 5. HUD — INTERFAZ DE USUARIO (`UIScene`)

Overlay activo durante cualquier nivel.

#### 5.1 Elementos del HUD (barra superior)
| Elemento | Posición | Color | Función |
|----------|----------|-------|---------|
| **TOHOL** `0000` | Izquierda | Dorado `#f5d061` | Moneda del metaverso |
| **ENERGÍA** (barra) | Centro-izq | Cyan → Amarillo → Rojo | 3 cargas; 0 = Game Over |
| **REP** `000` | Centro-der | Verde `#39ff14` | Reputación social (0-100) |
| **HORARIO** `01:30` | Derecha | Rosado `#ff007f` | Countdown MM:SS |
| Banner modo | Inferior | Gris | "DISTRITO ACTUAL · META: X" |

#### 5.2 Condiciones de fin
- **Victoria:** L1 con `goal-reached type:'work' minTohol:100`. L2 con `goal-reached type:'social' minReputation:50`. Tiempo agotado también dispara victoria ("JORNADA/EVENTO COMPLETADO").
- **Game Over:** `change-energy -1` cuando energía llega a 0 → "DESCONEXIÓN FORZADA".
- **Soft Fail:** Portal con cuota incompleta → "CUOTA NO ALCANZADA" / "SIN INVITACIÓN AL EVENTO PRINCIPAL".

#### 5.3 Eventos del bus global
| Evento | Origen | Acción HUD |
|--------|--------|------------|
| `set-level-mode` | Nivel al iniciar | Configura tiempo + banner |
| `add-tohol` | Trabajos/ventas | Suma TOHOL, flash verde |
| `change-energy` | Daño/tienda | Modifica barra, flash |
| `add-reputation` | Eventos/bots | Suma REP, flash verde |
| `goal-reached` | Portal al final | Evalúa victoria/soft-fail |
| `dev-add-tohol` | Consola HTML | +25 TOHOL |
| `dev-sub-energy` | Consola HTML | -1 Energía |
| `dev-add-rep` | Consola HTML | +5 REP |
| `dev-add-timer` | Consola HTML | +30s |
| `dev-reset-hud` | Consola HTML | Reset total |

---

### 6. DIAGRAMA DE FLUJO COMPLETO

```
INICIO
  │
  ▼
BootScene ──── Carga assets + texturas procedurales NEXUS
  │
  ▼
MainMenuScene ──── Menú con 2 tarjetas de distrito
  │                + modales Créditos/Narrativa
  ├──▶ Level1Scene (Distrito Financiero)
  │      │
  │      ├──▶ UIScene (HUD TOHOL/Energía/REP/Horario)
  │      │
  │      ├──▶ Jugador Biker — entregas de paquetes (5),
  │      │     tienda multi-ítem (5 productos),
  │      │     glitches del sistema (5),
  │      │     4 clientes NPC, 1 vendedor, 4 ciudadanos
  │      │
  │      ├──▶ Victoria (≥100 TOHOL) ──── overlay ──── 3s ────▶ Menú
  │      ├──▶ Soft Fail (portal sin cuota) ──── overlay ──── 3s ────▶ Menú
  │      └──▶ Game Over (energía 0) ──── overlay ──── 3s ────▶ Menú
  │
  └──▶ Level2Scene (Distrito Social)
         │
         ├──▶ UIScene (HUD)
         │
         ├──▶ Jugador Punk — doble salto + dash (rastro),
         │     6 eventos sociales con anfitriones IA,
         │     3 security bots patrulla,
         │     parkour exigente (brechas + azoteas)
         │
         ├──▶ Victoria (≥50 REP) ──── overlay ──── 3s ────▶ Menú
         ├──▶ Soft Fail ──── overlay ──── 3s ────▶ Menú
         └──▶ Game Over ──── overlay ──── 3s ────▶ Menú
```
