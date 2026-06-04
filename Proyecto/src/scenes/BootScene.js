/**
 * ==========================================================================
 * NEXUS LIFE - Boot & Preloader Scene
 * ==========================================================================
 */

export default class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        console.log('[Scene Manager] Ejecutando BootScene: Preloading assets...');

        // Configuración de la interfaz visual de carga
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Título de Carga
        const loadingText = this.make.text({
            x: width / 2,
            y: height / 2 - 50,
            text: 'CONECTANDO A NEXUS NETWORK...',
            style: {
                font: '18px Orbitron',
                fill: '#00f2fe',
                fontWeight: 'bold'
            }
        });
        loadingText.setOrigin(0.5, 0.5);

        // Subtítulo de Carga
        const assetText = this.make.text({
            x: width / 2,
            y: height / 2 + 50,
            text: '',
            style: {
                font: '12px Inter',
                fill: '#9ca3af'
            }
        });
        assetText.setOrigin(0.5, 0.5);

        // Barra de Progreso (Gráficos)
        const progressBox = this.add.graphics();
        const progressBar = this.add.graphics();

        progressBox.lineStyle(2, 0x00f2fe, 0.3);
        progressBox.strokeRect(width / 2 - 160, height / 2 - 15, 320, 30);
        progressBox.fillStyle(0x111928, 0.5);
        progressBox.fillRect(width / 2 - 158, height / 2 - 13, 316, 26);

        // Eventos del cargador de Phaser
        this.load.on('progress', (value) => {
            progressBar.clear();
            progressBar.fillStyle(0x00f2fe, 0.8);
            // Brillo neon
            progressBar.fillRect(width / 2 - 154, height / 2 - 9, 308 * value, 18);
            
            // Simular carga progresiva
            loadingText.setText(`INICIALIZANDO PROTOCOLOS: ${Math.round(value * 100)}%`);
        });

        this.load.on('fileprogress', (file) => {
            assetText.setText(`Cargando: ${file.key} (${file.src})`);
        });

        this.load.on('complete', () => {
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
            assetText.destroy();
            console.log('[Scene Manager] Carga de recursos completada.');
        });

        // ==========================================
        // CARGA DE ASSETS REQUERIDOS EN EL TALLER
        // ==========================================

        // 1. Carga de Tiles Industriales
        this.load.image('platform_tile', 'assets/1 Tiles/IndustrialTile_02.png');
        
        // ¡NUEVOS FONDOS INDUSTRIALES INTEGRADOS!
        this.load.image('bg_sky', 'assets/2 Background/1.png');
        this.load.image('bg_far', 'assets/2 Background/2.png');
        this.load.image('bg_near', 'assets/2 Background/3.png');
        this.load.image('bg_front', 'assets/2 Background/4.png');

        // 3. Carga de Spritesheets (Personajes animados y objetos)
        this.load.spritesheet('coin', 'assets/4 Animated objects/Money.png', { frameWidth: 24, frameHeight: 24 });
        
        // Jugador 1 (Biker)
        this.load.spritesheet('player1_idle', 'assets/1 Biker/Biker_idle.png', { frameWidth: 48, frameHeight: 48 });
        this.load.spritesheet('player1_run', 'assets/1 Biker/Biker_run.png', { frameWidth: 48, frameHeight: 48 });
        this.load.spritesheet('player1_jump', 'assets/1 Biker/Biker_jump.png', { frameWidth: 48, frameHeight: 48 });
        this.load.spritesheet('player1_doublejump', 'assets/1 Biker/Biker_doublejump.png', { frameWidth: 48, frameHeight: 48 });
        
        // Jugador 2 (Punk)
        this.load.spritesheet('player2_idle', 'assets/2 Punk/Punk_idle.png', { frameWidth: 48, frameHeight: 48 });
        this.load.spritesheet('player2_run', 'assets/2 Punk/Punk_run.png', { frameWidth: 48, frameHeight: 48 });
        this.load.spritesheet('player2_jump', 'assets/2 Punk/Punk_jump.png', { frameWidth: 48, frameHeight: 48 });
        this.load.spritesheet('player2_doublejump', 'assets/2 Punk/Punk_doublejump.png', { frameWidth: 48, frameHeight: 48 });
        
        // Enemigo (Cyborg)
        this.load.spritesheet('enemy_idle', 'assets/3 Cyborg/Cyborg_idle.png', { frameWidth: 48, frameHeight: 48 });
        this.load.spritesheet('enemy_run', 'assets/3 Cyborg/Cyborg_run.png', { frameWidth: 48, frameHeight: 48 });

        // ==========================================
        // INTEGRACIÓN DE AUDIO EN PRELOAD
        // ==========================================
        // Cargamos los archivos de audio de forma estándar. Si no se encuentran físicamente,
        // Phaser emitirá una advertencia pero continuará la carga de forma segura.
        this.load.audio('sfx_jump', 'assets/audio/jump.mp3');
        this.load.audio('sfx_coin', 'assets/audio/coin.mp3');
        this.load.audio('sfx_damage', 'assets/audio/damage.mp3');
        this.load.audio('bg_music', 'assets/audio/music.mp3');

        // ==========================================
        // RECURSOS GENERADOS POR CÓDIGO (FALLBACK)
        // ==========================================
        // En caso de que no tengas imágenes físicas en las carpetas de 'assets/',
        // generaremos texturas procedurales para asegurar que el prototipo funcione sin romperse.
        this.createProceduralTextures();
    }

    create() {
        // Transición fluida al menú principal
        console.log('[Scene Manager] Transicionando a MainMenuScene...');
        this.scene.start('MainMenuScene');
    }

    /**
     * Crea texturas en tiempo de ejecución para evitar fallos si las imágenes externas no se han añadido.
     */
    createProceduralTextures() {
        // Generar un botón para el menú principal si no hay imágenes
        const createButtonTexture = (key, startColor, endColor) => {
            const canvas = this.textures.createCanvas(key, 240, 50);
            const ctx = canvas.context;
            
            // Gradiente
            const gradient = ctx.createLinearGradient(0, 0, 240, 0);
            gradient.addColorStop(0, startColor);
            gradient.addColorStop(1, endColor);
            
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 240, 50);
            
            // Borde
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.strokeRect(1, 1, 238, 48);
            
            canvas.refresh();
        };

        // Texturas de botones
        createButtonTexture('btn_level1', '#0f2027', '#203a43');
        createButtonTexture('btn_level2', '#2c3e50', '#3498db');

        // Generar una textura para simular un tileset de emergencia si no se cargan las imágenes físicas
        const canvasTiles = this.textures.createCanvas('tileset_fallback', 128, 64);
        const ctxTiles = canvasTiles.context;
        
        // Bloque 1: Comercial (Azulado / Negocios)
        ctxTiles.fillStyle = '#1e293b';
        ctxTiles.fillRect(0, 0, 32, 32);
        ctxTiles.fillStyle = '#0f172a';
        ctxTiles.fillRect(2, 2, 28, 28);
        ctxTiles.fillStyle = '#00f2fe';
        ctxTiles.fillRect(8, 8, 16, 16);

        // Bloque 2: Social (Rosado / Comunidad)
        ctxTiles.fillStyle = '#31102f';
        ctxTiles.fillRect(32, 0, 32, 32);
        ctxTiles.fillStyle = '#1f081d';
        ctxTiles.fillRect(34, 2, 28, 28);
        ctxTiles.fillStyle = '#ff007f';
        ctxTiles.fillRect(40, 8, 16, 16);

        // Bloque 3: Suelo / Libre
        ctxTiles.fillStyle = '#334155';
        ctxTiles.fillRect(64, 0, 32, 32);
        
        // Bloque 4: Obstáculo / Paredes
        ctxTiles.fillStyle = '#475569';
        ctxTiles.fillRect(96, 0, 32, 32);
        ctxTiles.strokeStyle = '#94a3b8';
        ctxTiles.lineWidth = 1;
        ctxTiles.strokeRect(98, 2, 28, 28);

        canvasTiles.refresh();

        // -----------------------------------------------------------------
        // NUEVAS TEXTURAS PROCEDURALES DE ALTA FIDELIDAD PARA FÍSICAS Y MECÁNICAS
        // -----------------------------------------------------------------

        // (Personajes ahora usan spritesheets reales, se omite su generación procedural)

        // 3. Moneda TOHOL - AHORA USANDO EL ASSET REAL
        // Ya no generamos la textura procedural porque la cargamos desde assets reales en el preload.

        // 4. Plataforma Móvil (Viga Metálica)
        const canvasPlat = this.textures.createCanvas('platform', 96, 16);
        const ctxPlat = canvasPlat.context;
        ctxPlat.fillStyle = '#1e293b'; // Núcleo
        ctxPlat.fillRect(0, 0, 96, 16);
        ctxPlat.strokeStyle = '#00f2fe'; // Brillo neón azul
        ctxPlat.lineWidth = 2;
        ctxPlat.strokeRect(1, 1, 94, 14);
        ctxPlat.fillStyle = '#00f2fe'; // Tornillos
        ctxPlat.fillRect(6, 6, 4, 4);
        ctxPlat.fillRect(86, 6, 4, 4);
        canvasPlat.refresh();

        // 5. Zonas de Peligro (Trampa de Plasma Neón)
        const canvasSpike = this.textures.createCanvas('hazard', 32, 32);
        const ctxSpike = canvasSpike.context;
        // Base metálica
        ctxSpike.fillStyle = '#0f172a';
        ctxSpike.fillRect(0, 26, 32, 6);
        ctxSpike.fillStyle = '#334155';
        ctxSpike.fillRect(2, 24, 6, 2);
        ctxSpike.fillRect(24, 24, 6, 2);
        
        // Núcleo de Plasma (Rojo brillante)
        ctxSpike.fillStyle = '#ff0055'; 
        ctxSpike.fillRect(4, 20, 24, 6);
        
        // Brillo / Aura del plasma
        ctxSpike.fillStyle = 'rgba(255, 0, 85, 0.4)';
        ctxSpike.fillRect(2, 14, 28, 12);
        ctxSpike.fillStyle = 'rgba(255, 0, 85, 0.15)';
        ctxSpike.fillRect(0, 6, 32, 20);
        
        // Relámpagos internos blancos
        ctxSpike.fillStyle = '#ffffff';
        ctxSpike.fillRect(8, 22, 4, 2);
        ctxSpike.fillRect(18, 21, 6, 2);
        
        canvasSpike.refresh();

        // 6. NPC Vendedor (Verde Neón con pantalla)
        const canvasNPC = this.textures.createCanvas('npc', 32, 32);
        const ctxNPC = canvasNPC.context;
        ctxNPC.fillStyle = '#1f2937'; // Estructura
        ctxNPC.fillRect(4, 8, 24, 24);
        ctxNPC.fillStyle = '#39ff14'; // Borde brillante verde
        ctxNPC.strokeRect(4, 8, 24, 24);
        ctxNPC.fillStyle = '#000000'; // Pantalla
        ctxNPC.fillRect(8, 12, 16, 10);
        ctxNPC.fillStyle = '#39ff14'; // Ojos de pantalla
        ctxNPC.fillRect(10, 15, 3, 3);
        ctxNPC.fillRect(19, 15, 3, 3);
        canvasNPC.refresh();

        // 7. Portal de Meta de Victoria (Turquesa Neón brillante)
        const canvasPortal = this.textures.createCanvas('portal', 32, 64);
        const ctxPortal = canvasPortal.context;
        // Fondo oscuro
        ctxPortal.fillStyle = '#07090e';
        ctxPortal.fillRect(0, 0, 32, 64);
        // Marco brillante neón turquesa
        ctxPortal.strokeStyle = '#00f2fe';
        ctxPortal.lineWidth = 3;
        ctxPortal.strokeRect(2, 2, 28, 60);
        // Núcleo energético del portal (líneas de barrido neón)
        ctxPortal.fillStyle = 'rgba(0, 242, 254, 0.2)';
        ctxPortal.fillRect(4, 4, 24, 56);
        ctxPortal.fillStyle = '#00f2fe';
        ctxPortal.fillRect(6, 15, 20, 2);
        ctxPortal.fillRect(6, 30, 20, 2);
        ctxPortal.fillRect(6, 45, 20, 2);
        canvasPortal.refresh();

        // 8-10. Parallax Backgrounds - AHORA USANDO LOS ASSETS REALES
        // Las texturas bg_sky, bg_far y bg_near ya se cargan desde 'assets/2 Background/' en el preload.

        // 11. Partículas Spark (Chispa de luz brillante para monedas y saltos)
        const canvasSpark = this.textures.createCanvas('particle_spark', 8, 8);
        const ctxSpark = canvasSpark.context;
        ctxSpark.fillStyle = '#ffffff';
        ctxSpark.beginPath();
        ctxSpark.arc(4, 4, 3, 0, Math.PI * 2);
        ctxSpark.fill();
        canvasSpark.refresh();

        // Enemigo ahora usa spritesheet real, omitimos su generación procedural

        console.log('[BootScene] Texturas de mecánicas y físicas generadas con éxito.');
    }
}
