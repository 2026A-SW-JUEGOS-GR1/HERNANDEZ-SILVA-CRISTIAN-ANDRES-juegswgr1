# INFORME DE AVANCE: NEXUS LIFE

**Ecosistema Social-Económico RPG**  
*Taller de Videojuegos 2D — Escuela Politécnica Nacional*  
*Autor: Pablo Esteban Hidalgo Cruz*  

---

## 1. Introducción

NEXUS LIFE es un videojuego de plataformas 2D con temática cyberpunk que simula un ecosistema socio-económico interactivo. El jugador explora dos escenarios diferenciados —una zona comercial y un barrio social— mientras recolecta una moneda virtual llamada TOHOL, enfrenta enemigos con inteligencia de patrulla, adquiere mejoras de velocidad con un NPC vendedor y completa los niveles bajo un sistema de tiempo límite. El proyecto se desarrolla como parte del Taller de Videojuegos 2D de la EPN y busca demostrar la implementación de mecánicas modernas de plataformas, físicas, sistemas de partículas, audio y una interfaz de usuario superpuesta.

---

## 2. Justificación del uso de tecnologías externas

### 2.1. Phaser 3

Para el desarrollo de este prototipo decidí utilizar **Phaser 3.60.0**, un framework de código abierto especializado en videojuegos 2D basado en WebGL y Canvas. Las razones principales para esta elección fueron:

- **Motor de físicas integrado**: Phaser incluye Arcade Physics, que me permitió implementar gravedad, colisiones, solapamientos y detección de contacto sin necesidad de librerías adicionales como Matter.js o Box2D. Esto aceleró significativamente el desarrollo de las mecánicas de plataformas.
- **Sistema de escenas**: El Scene Manager de Phaser permite organizar el juego en escenas independientes (Boot, Menú, Niveles, HUD) que pueden ejecutarse en paralelo. Esto fue crucial para tener un HUD superpuesto que se comunica con los niveles mediante eventos globales.
- **Sistema de partículas integrado**: Los emisores de partículas de Phaser me permitieron añadir efectos visuales (chispas al recolectar monedas, propulsión en dobles saltos, estelas en dash) sin depender de bibliotecas externas de efectos.
- **Carga de assets y spritesheets**: Phaser maneja la precarga de imágenes, hojas de sprites y audio con barras de progreso, facilitando la gestión de recursos.
- **Comunidad y documentación**: Phaser tiene una amplia comunidad, documentación oficial y ejemplos, lo que facilitó la resolución de problemas durante el desarrollo.

### 2.2. Google Fonts (Orbitron + Inter)

Seleccioné dos tipografías de Google Fonts para reforzar la identidad visual del juego:

- **Orbitron**: Una tipografía geométrica de estilo futurista que utilicé para todos los títulos, botones y textos del HUD. Su diseño de caracteres anchos y líneas rectas evoca la estética cyberpunk y de ciencia ficción que quería transmitir.
- **Inter**: Una tipografía limpia y altamente legible para textos informativos y descripciones, asegurando que la interfaz sea funcional sin sacrificar la estética.

El uso de Google Fonts mediante CDN evitó tener que alojar archivos de fuente localmente y permitió una carga eficiente desde la caché del navegador.

### 2.3. Servidor HTTP con Node.js (sin dependencias)

Para evitar los bloqueos de CORS que ocurren al cargar archivos locales (imágenes, JSON) con el protocolo `file://`, implementé un servidor HTTP liviano usando únicamente los módulos nativos de Node.js (`http`, `fs`, `path`). Las ventajas de esta decisión fueron:

- **Cero dependencias**: No se requiere `npm install`, ni `package.json`, ni node_modules. Esto simplifica la configuración del entorno de desarrollo y evita problemas de versiones.
- **Portabilidad**: Cualquier máquina con Node.js instalado puede ejecutar el servidor inmediatamente.
- **Seguridad básica**: Implementé validación de rutas para prevenir ataques de path traversal, asegurando que solo se sirvan archivos dentro del directorio del proyecto.
- **Soporte para espacios en rutas**: Decodifico la URL para manejar correctamente nombres de carpeta como "2 Background" o "4 Animated objects".

### 2.4. Tiled Map Editor (consideración)

Aunque el prototipo actual genera los niveles de forma procedural (código JavaScript), desde el inicio del taller se previó el uso de **Tiled** como editor de mapas. La estructura de directorios incluye una carpeta `assets/maps/` preparada para recibir archivos JSON exportados de Tiled. La función `setupTiledMap()` existe en ambos niveles como placeholder para cuando se integre esta funcionalidad.

Las ventajas de Tiled que justifican su uso futuro son:

- **Editor visual**: Permite diseñar niveles colocando tiles, objetos, zonas de peligro y spawn points mediante una interfaz gráfica, sin necesidad de programar las coordenadas manualmente.
- **Exportación a JSON**: Tiled exporta mapas en formato JSON que Phaser puede consumir directamente con `this.load.tilemapTiledJSON()`, simplificando la integración.
- **Capas múltiples**: Soporta capas de tiles, objetos e imágenes, ideal para niveles con parallax, colisiones y decoración.
- **Separación de contenido y código**: Permite que diseñadores de niveles trabajen en paralelo sin tocar el código del juego.

Actualmente, los niveles se construyen proceduralmente llamando a funciones como `createSolidBlock()` y `spawnPatrolEnemy()` con coordenadas predefinidas. Esto funcionó para el prototipo, pero para escalar el juego a más niveles y diseños complejos, Tiled es la herramienta indicada.

### 2.5. Craftpix Assets

Los gráficos del juego (tilesets industriales, fondos, sprites de personajes y objetos) provienen de **Craftpix.net**, un portal de assets para videojuegos 2D. Seleccioné estos recursos porque:

- Ofrecen un estilo visual consistente (pixel art con estética industrial/cyberpunk).
- La licencia gratuita permite uso educativo sin restricciones.
- Los spritesheets vienen con las animaciones necesarias (idle, run, jump, double jump, attack, death) precortadas y listas para usar.

---

## 3. Implementación técnica: Aportes y funcionalidades desarrolladas

### 3.1. Arquitectura de escenas

Organicé el juego en cinco escenas de Phaser que se comunican entre sí:

| Escena | Función | Estado |
|--------|---------|--------|
| `BootScene` | Precarga de todos los assets y generación de texturas procedurales de respaldo | Completada |
| `MainMenuScene` | Menú principal con fondo de cuadrícula cyberpunk, título animado y dos botones de selección de nivel | Completada |
| `Level1Scene` | Nivel 1: Escenario Comercial con plataformas, monedas, pinchos, plataforma móvil, enemigos y portal | Completada |
| `Level2Scene` | Nivel 2: Barrio Social con parkour avanzado, doble salto, dash, NPC vendedor y power-up de velocidad | Completada |
| `UIScene` | HUD superpuesto que se ejecuta simultáneamente a los niveles, mostrando puntuación, vidas y tiempo | Completada |

La comunicación entre escenas la resolví mediante el bus de eventos global de Phaser (`game.events`), lo que permite que los niveles envíen eventos como `add-score`, `lose-life` o `goal-reached` y la UIScene los procese sin acoplamiento directo.

### 3.2. Mecánicas de plataformas precisas (Coyote Time y Jump Buffer)

Implementé dos técnicas fundamentales para que el salto se sienta responsive y justo con el jugador:

- **Coyote Time (100ms)**: Permite al jugador saltar incluso si ya caminó fuera de una plataforma, siempre que hayan pasado menos de 100ms desde que perdió contacto con el suelo. Esto evita la frustración de presionar salto justo después de caer.
- **Jump Buffer (150ms)**: Almacena la pulsación del botón de salto durante 150ms, de modo que si el jugador presiona salto ligeramente antes de tocar el suelo, el salto se ejecuta automáticamente al aterrizar.

Ambos valores son configurables en el `init()` de cada nivel y demostré su funcionamiento en el taller mediante pruebas de juego.

### 3.3. Sistema de partículas y efectos JUICE

Añadí emisores de partículas para dar retroalimentación visual inmediata a cada acción del jugador:

- **Chispas doradas** al recolectar monedas TOHOL (12 partículas con blendMode ADD, escala decreciente).
- **Destello en los pies** al saltar (5-8 partículas con gravedad, simulando polvo de propulsión).
- **Explosión neón rosada** al derrotar enemigos desde el aire (8 partículas).
- **Estela de dash** en el Nivel 2 (imágenes fantasma traslúcidas que se desvanecen).
- **Aura de power-up** (círculos verdes flotantes alrededor del jugador mientras tiene el chip de velocidad activo).

Además, cada acción importante dispara efectos de cámara: flash rojo al recibir daño, shake de pantalla, flash blanco al presionar botones y fade in/out en las transiciones.

### 3.4. Parallax Scrolling multícapa

Configuré tres capas de fondo con velocidades de desplazamiento diferenciadas para crear sensación de profundidad:

- **Capa 1 (Cielo cyberpunk)**: Estática, sin scroll.
- **Capa 2 (Edificios lejanos)**: Scroll al 10% de la velocidad de la cámara.
- **Capa 3 (Edificios cercanos)**: Scroll al 35% de la velocidad de la cámara.

Esto se logra con `tileSprite` y ajustando `tilePositionX` en cada frame según `camera.scrollX`.

### 3.5. Inteligencia de enemigos patrulla

Los enemigos Cyborg implementan un patrón de patrulla simple pero efectivo:

- Se mueven horizontalmente a velocidad constante (80px/s).
- Cambian de dirección al colisionar con paredes, al llegar al límite de su distancia de patrulla o al detectar otra superficie.
- El jugador puede derrotarlos saltando sobre ellos (combate aéreo), recibiendo una bonificación de 15 puntos.
- Si el jugador colisiona lateralmente, recibe daño y retrocede al punto de inicio.

Cada enemigo almacena su posición de spawn (`spawnX`) y su distancia de patrulla (`patrolDist`) para calcular sus límites de movimiento.

### 3.6. Sistema económico y NPC vendedor (Nivel 2)

Implementé una mecánica de economía interna donde las monedas TOHOL funcionan como moneda de intercambio:

- El jugador recolecta monedas distribuidas por el escenario (+10 puntos cada una).
- Un NPC vendedor (representado como un robot con pantalla verde neón) ofrece un **Chip de Velocidad** por 30 TOHOL.
- Al comprar, el multiplicador de velocidad del jugador aumenta a 1.8x durante 5 segundos.
- Durante el power-up, el jugador se tiñe de verde y emite un aura de partículas.
- Si el jugador no tiene suficiente saldo, el NPC muestra un mensaje de "SALDO INSUFICIENTE" y la cámara se sacude.

### 3.7. Dash (Nivel 2)

El dash es una habilidad exclusiva del Nivel 2 que permite al jugador desplazarse horizontalmente a alta velocidad (500px/s) durante 150ms:

- Mientras dasha, la gravedad se desactiva para mantener una trayectoria recta.
- El jugador se tiñe de rosa neón durante la ejecución.
- Genera un rastro visual de imágenes fantasma (ghost trail).
- Tiene un cooldown de 1 segundo para evitar spam.

### 3.8. HUD superpuesto con sistema de tiempo

La UIScene se ejecuta en paralelo a los niveles (mediante `scene.launch()`) y muestra:

- **Puntuación**: Formateada a 4 dígitos (0000), se actualiza con efecto flash verde.
- **Vidas**: 3 corazones (❤️) que se convierten en negros (🖤) al perder vidas. Cambia a rojo cuando queda 1 vida.
- **Temporizador**: 60 segundos en formato MM:SS. Si llega a cero, se activa la victoria por supervivencia.
- **Pantallas de Game Over**: Muestra "CONEXIÓN PERDIDA" con efecto neón rojo y regresa al menú tras 3 segundos.
- **Pantallas de Victoria**: Muestra "SIMULACIÓN COMPLETADA" con efecto neón azul y el mensaje de logro.

### 3.9. Menú de pausa

Implementé un menú de pausa completo accesible con ESC que:

- Congela las físicas, las animaciones y el temporizador.
- Muestra un overlay oscuro con un panel flotante de estilo neón.
- Permite reanudar con ENTER o ESC.
- Permite salir al menú principal con Q, con fade out de transición.

### 3.10. Consola de pruebas HTML

Integré botones en el panel lateral del HTML que se comunican con el HUD mediante eventos globales. Esto permite probar la reactividad del sistema de puntuación, vidas y temporizador sin necesidad de jugar. Es una herramienta de desarrollo útil para verificar que la comunicación entre escenas funciona correctamente.

### 3.11. Texturas procedurales de respaldo

Para garantizar que el prototipo funcione incluso si faltan assets físicos, implementé en `BootScene` la generación procedural de texturas mediante Canvas API:

- Botones de menú con gradientes.
- Tileset de emergencia (4 tipos de bloques).
- Plataforma móvil con tornillos decorativos.
- Zonas de peligro con efecto de plasma neón.
- NPC vendedor con pantalla y ojos LED.
- Portal de meta con barras de energía.
- Partículas de chispa.

Si los assets reales están presentes, Phaser los usa automáticamente (las claves de carga son las mismas).

### 3.12. Manejo seguro de audio

El sistema de audio implementa try/catch en todas las reproducciones para evitar errores fatales cuando los archivos no existen. La música de fondo se reproduce en loop con volumen reducido (0.2) y los SFX se verifican antes de reproducirse.

---

## 4. Pendientes y próximos pasos

| Tarea | Estado | Prioridad |
|-------|--------|-----------|
| Incorporar archivos de audio reales (jump, coin, damage, music) | Pendiente | Alta |
| Integrar mapas diseñados en Tiled | Pendiente | Media |
| Menú de pausa con sonidos de interfaz | Pendiente | Baja |
| Más niveles y variedad de enemigos | Planeado | Media |
| Sistema de guardado de puntuación | Planeado | Baja |
| Pulir colisiones y ajustar hitboxes | En revisión | Media |

---

## 5. Conclusión

El desarrollo de NEXUS LIFE ha permitido aplicar los conceptos fundamentales del taller de videojuegos 2D: físicas Arcade, detección de colisiones, sistemas de escenas, animación por spritesheets, parallax scrolling, partículas, audio, interfaz de usuario superpuesta y comunicación entre componentes mediante eventos. La elección de Phaser 3 como motor principal, complementado con herramientas como Google Fonts para la tipografía, Node.js para el servidor local y Tiled para el diseño de niveles (a futuro), responde a criterios de productividad, calidad visual y buenas prácticas de desarrollo.

El prototipo actual es funcional, contiene dos niveles completos con mecánicas diferenciadas y demuestra la viabilidad del concepto "ecosistema social-económico" como eje temático del juego.
