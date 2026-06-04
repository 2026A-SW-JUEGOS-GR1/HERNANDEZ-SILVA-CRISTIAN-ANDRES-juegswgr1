/**
 * ==========================================================================
 * NEXUS LIFE - Main Menu Scene
 * ==========================================================================
 */

export default class MainMenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainMenuScene' });
    }

    create() {
        console.log('[Scene Manager] Ejecutando MainMenuScene.');

        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 1. Fondo Estético Cyberpunk (Neon Stars / Grid Procedural)
        this.cameras.main.setBackgroundColor('#0b0f19');
        this.drawBackgroundGrid();

        // 2. Título del Juego (Efecto Neon)
        const titleGlow = this.add.text(width / 2, height / 2 - 120, 'NEXUS LIFE', {
            font: '64px Orbitron',
            fill: '#00f2fe',
            fontWeight: '900',
            letterSpacing: 4
        }).setOrigin(0.5).setAlpha(0.4);

        const titleText = this.add.text(width / 2, height / 2 - 120, 'NEXUS LIFE', {
            font: '60px Orbitron',
            fill: '#ffffff',
            fontWeight: '900',
            letterSpacing: 4
        }).setOrigin(0.5);

        // Animación suave de latido en el brillo del título
        this.tweens.add({
            targets: titleGlow,
            alpha: 0.8,
            scale: 1.05,
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Subtítulo
        this.add.text(width / 2, height / 2 - 60, 'ECOSISTEMA SOCIAL-ECONÓMICO RPG', {
            font: '14px Orbitron',
            fill: '#ff007f',
            fontWeight: '700',
            letterSpacing: 3
        }).setOrigin(0.5);

        // 3. Crear Botones de Selección de Nivel
        // Botón 1: Nivel 1 (Zona Comercial)
        this.createMenuButton(
            width / 2,
            height / 2 + 30,
            'btn_level1',
            'NIVEL 1: ESCENARIO COMERCIAL',
            '#00f2fe',
            () => this.startLevel('Level1Scene')
        );

        // Botón 2: Nivel 2 (Barrio Social)
        this.createMenuButton(
            width / 2,
            height / 2 + 105,
            'btn_level2',
            'NIVEL 2: ESCENARIO SOCIAL',
            '#ff007f',
            () => this.startLevel('Level2Scene')
        );

        // Instrucción de pie
        this.add.text(width / 2, height - 30, 'Selecciona un nodo para iniciar la simulación', {
            font: '11px Inter',
            fill: '#9ca3af',
            letterSpacing: 1
        }).setOrigin(0.5);
    }

    /**
     * Dibuja líneas de cuadrícula procedurales en el fondo para una sensación ciber-espacial.
     */
    drawBackgroundGrid() {
        const grid = this.add.graphics();
        grid.lineStyle(1, 0x00f2fe, 0.08);

        const spacing = 40;
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        for (let x = 0; x < width; x += spacing) {
            grid.lineBetween(x, 0, x, height);
        }
        for (let y = 0; y < height; y += spacing) {
            grid.lineBetween(0, y, width, y);
        }
    }

    /**
     * Crea un botón interactivo premium en Phaser.
     */
    createMenuButton(x, y, textureKey, label, themeColor, callback) {
        // Contenedor para agrupar gráficos y textos
        const container = this.add.container(x, y);

        // Gráfico de fondo interactivo
        const bg = this.add.graphics();
        const width = 320;
        const height = 50;

        // Función para renderizar el fondo del botón con colores personalizados
        const drawButtonBg = (isHovered) => {
            bg.clear();
            if (isHovered) {
                // Relleno iluminado
                bg.fillStyle(Phaser.Display.Color.HexStringToColor(themeColor).color, 0.15);
                bg.fillRect(-width / 2, -height / 2, width, height);
                // Borde brillante grueso
                bg.lineStyle(2, Phaser.Display.Color.HexStringToColor(themeColor).color, 1);
                bg.strokeRect(-width / 2, -height / 2, width, height);
            } else {
                // Relleno normal
                bg.fillStyle(0x111928, 0.6);
                bg.fillRect(-width / 2, -height / 2, width, height);
                // Borde sutil
                bg.lineStyle(1, 0xffffff, 0.15);
                bg.strokeRect(-width / 2, -height / 2, width, height);
            }
        };

        // Render inicial
        drawButtonBg(false);
        container.add(bg);

        // Texto del Botón
        const text = this.add.text(0, 0, label, {
            font: '13px Orbitron',
            fill: '#ffffff',
            fontWeight: 'bold',
            letterSpacing: 1
        }).setOrigin(0.5);
        container.add(text);

        // Definir zona interactiva
        const hitArea = new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height);
        
        // Convertir el contenedor en interactivo
        container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

        // Efectos al pasar el cursor (Hover)
        container.on('pointerover', () => {
            drawButtonBg(true);
            text.setFill(themeColor);
            
            // Efecto de escala
            this.tweens.add({
                targets: container,
                scaleX: 1.05,
                scaleY: 1.05,
                duration: 150,
                ease: 'Power2'
            });
        });

        container.on('pointerout', () => {
            drawButtonBg(false);
            text.setFill('#ffffff');
            
            // Regresar escala
            this.tweens.add({
                targets: container,
                scaleX: 1,
                scaleY: 1,
                duration: 150,
                ease: 'Power2'
            });
        });

        // Acción al hacer clic
        container.on('pointerdown', () => {
            // Efecto flash rápido en la cámara
            this.cameras.main.flash(200, 255, 255, 255, false);
            
            // Pequeña escala al presionar
            container.setScale(0.98);
            
            this.time.delayedCall(150, () => {
                callback();
            });
        });
    }

    /**
     * Hace la transición del juego hacia la escena de nivel indicada.
     */
    startLevel(levelKey) {
        console.log(`[MainMenuScene] Transicionando a: ${levelKey}`);
        
        // Desvanecimiento de cámara antes de transicionar
        this.cameras.main.fadeOut(500, 11, 15, 25);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
            this.scene.start(levelKey);
        });
    }
}
