# Guía de Assets para NEXUS LIFE

¡Bienvenido al directorio de Assets! Aquí es donde debes colocar todos los archivos físicos (imágenes, sonidos, mapas, etc.) para tu juego en Phaser 3.

## Estructura de Carpetas

Hemos creado una estructura organizada para ti:

*   **`/assets/images/`**: Para imágenes estáticas simples (ej. fondos, props, tilesets).
    *   *Uso en Phaser*: `this.load.image('clave', 'assets/images/archivo.png');`
*   **`/assets/spritesheets/`**: Para hojas de sprites animadas (personajes, enemigos, monedas con animación).
    *   *Uso en Phaser*: `this.load.spritesheet('clave', 'assets/spritesheets/archivo.png', { frameWidth: 32, frameHeight: 32 });`
*   **`/assets/audio/`**: Para música y efectos de sonido (`.mp3`, `.ogg`, `.wav`).
    *   *Uso en Phaser*: `this.load.audio('clave', 'assets/audio/archivo.mp3');`
*   **`/assets/maps/`**: Para los archivos JSON exportados desde Tiled (`.json`).
    *   *Uso en Phaser*: `this.load.tilemapTiledJSON('clave', 'assets/maps/archivo.json');`
*   **`/assets/fonts/`**: Para fuentes personalizadas (Bitmap fonts o WebFonts).

## ¿Cómo añadir un nuevo Asset?

1.  **Copia tu archivo** en la subcarpeta correspondiente (por ejemplo, `assets/images/mi_fondo.png`).
2.  **Abre el archivo `src/scenes/BootScene.js`**.
3.  Busca el método `preload()`.
4.  **Añade la línea de carga** usando las funciones mostradas arriba.

**Ejemplo de cómo se vería en `BootScene.js`:**
```javascript
preload() {
    // ... código de carga
    
    // Cargar mi nuevo fondo
    this.load.image('fondo_nuevo', 'assets/images/mi_fondo.png');
    
    // Cargar el sprite de un enemigo
    this.load.spritesheet('enemigo_final', 'assets/spritesheets/enemigo.png', { frameWidth: 64, frameHeight: 64 });
}
```

## Sobre las Texturas Procedurales (Fallback)

Actualmente, el juego genera "texturas procedurales" (imágenes dibujadas con código) en la `BootScene` para el jugador, enemigos, monedas y otros elementos. 

**Si deseas reemplazar uno de estos elementos con tus propias imágenes:**
1. Añade tu imagen a la carpeta correspondiente.
2. Cárgala en el `preload()` con la *misma clave* (por ejemplo, `'player1'`).
3. Al hacer esto, Phaser usará tu imagen en lugar de la textura generada por código. ¡El juego no se romperá!
