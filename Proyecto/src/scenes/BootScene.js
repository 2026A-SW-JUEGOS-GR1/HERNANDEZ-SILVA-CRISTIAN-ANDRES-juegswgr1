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

            // Diagnóstico de audio
            const audioKeys = ['sfx_jump', 'sfx_coin', 'sfx_damage', 'bg_music'];
            audioKeys.forEach(k => {
                const s = this.sound.get(k);
                console.log(`[Audio] ${k}: ${s ? 'CARGADO' : 'NO encontrado en cache'}`);
            });
            if (this.sound.context) {
                console.log(`[Audio] Estado del AudioContext: ${this.sound.context.state}`);
            }
        });

        this.load.on('loaderror', (file) => {
            console.warn(`[Audio] Error cargando ${file.key} (${file.src})`);
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
        // Audio: carga de las pistas MP3 del juego.
        // Si el archivo no existe, `this.sound.get(key)` devuelve null y las
        // llamadas a playSFX/playBackgroundMusic lo ignoran sin romper el juego.
        // ==========================================
        this.load.on('loaderror', () => {
            // Silenciar cualquier error de carga (defensa en profundidad).
        });

        this.load.audio('sfx_jump',   'assets/audio/jump.mp3');
        this.load.audio('sfx_coin',   'assets/audio/coin.mp3');
        this.load.audio('sfx_damage', 'assets/audio/damage.mp3');
        this.load.audio('bg_music',   'assets/audio/music.mp3');

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

        // 5. GLITCH DEL SISTEMA (Reemplazo narrativo de "pinchos")
        // Representa una zona corrupta del metaverso NEXUS - errores de software hechos materia
        const canvasGlitch = this.textures.createCanvas('hazard', 32, 32);
        const ctxGlitch = canvasGlitch.context;
        // Base oscura (zona de error)
        ctxGlitch.fillStyle = '#1a0010';
        ctxGlitch.fillRect(0, 20, 32, 12);
        // Banda glitch roja
        ctxGlitch.fillStyle = '#ff0055'; 
        ctxGlitch.fillRect(0, 18, 32, 4);
        ctxGlitch.fillStyle = '#ff3377';
        ctxGlitch.fillRect(0, 22, 32, 2);
        // Líneas de corrupción digitales
        ctxGlitch.fillStyle = '#ffffff';
        ctxGlitch.fillRect(4, 10, 8, 2);
        ctxGlitch.fillRect(16, 13, 12, 2);
        ctxGlitch.fillRect(2, 16, 6, 2);
        ctxGlitch.fillRect(22, 8, 4, 2);
        // Símbolos de error
        ctxGlitch.fillStyle = '#ff0055';
        ctxGlitch.fillRect(13, 4, 2, 8); // signo de admiración stylized
        ctxGlitch.fillRect(13, 14, 2, 2);
        // Aura de error
        ctxGlitch.fillStyle = 'rgba(255, 0, 85, 0.25)';
        ctxGlitch.fillRect(0, 0, 32, 32);
        canvasGlitch.refresh();

        // 6. NPC VENDEDOR (Comerciante del Distrito Financiero - dorado/cian profesional)
        const canvasNPC = this.textures.createCanvas('npc', 32, 32);
        const ctxNPC = canvasNPC.context;
        ctxNPC.fillStyle = '#1f2937'; // Estructura/traje
        ctxNPC.fillRect(4, 8, 24, 24);
        ctxNPC.fillStyle = '#f5d061'; // Borde dorado (comerciante)
        ctxNPC.strokeRect(4, 8, 24, 24);
        ctxNPC.fillStyle = '#000000'; // Pantalla holográfica
        ctxNPC.fillRect(8, 12, 16, 10);
        ctxNPC.fillStyle = '#00f2fe'; // Display cian de catálogo
        ctxNPC.fillRect(10, 15, 3, 3);
        ctxNPC.fillRect(19, 15, 3, 3);
        // Símbolo de dinero
        ctxNPC.fillStyle = '#f5d061';
        ctxNPC.fillRect(14, 14, 2, 6);
        ctxNPC.fillRect(13, 15, 4, 1);
        ctxNPC.fillRect(13, 18, 4, 1);
        canvasNPC.refresh();

        // 6b. NPC CIUDADANO (peatón ambiental - gris neutral)
        const canvasCitizen = this.textures.createCanvas('npc_citizen', 32, 32);
        const ctxCitizen = canvasCitizen.context;
        ctxCitizen.fillStyle = '#374151'; // Cuerpo
        ctxCitizen.fillRect(8, 12, 16, 20);
        ctxCitizen.fillStyle = '#9ca3af'; // Cabeza
        ctxCitizen.fillRect(10, 4, 12, 10);
        ctxCitizen.fillStyle = '#1f2937'; // Ojos
        ctxCitizen.fillRect(12, 7, 2, 2);
        ctxCitizen.fillRect(18, 7, 2, 2);
        // Pequeños indicadores neón (representan presencia digital)
        ctxCitizen.fillStyle = '#00f2fe';
        ctxCitizen.fillRect(8, 18, 2, 2);
        ctxCitizen.fillRect(22, 18, 2, 2);
        canvasCitizen.refresh();

        // 6c. NPC CLIENTE (con quest - rosado para destacar)
        const canvasClient = this.textures.createCanvas('npc_client', 32, 32);
        const ctxClient = canvasClient.context;
        ctxClient.fillStyle = '#1f2937'; // Cuerpo
        ctxClient.fillRect(8, 12, 16, 20);
        ctxClient.fillStyle = '#ff007f'; // Cabeza rosa
        ctxClient.fillRect(10, 4, 12, 10);
        ctxClient.fillStyle = '#000000'; // Ojos
        ctxClient.fillRect(12, 7, 2, 2);
        ctxClient.fillRect(18, 7, 2, 2);
        // Borde brillante para destacar
        ctxClient.strokeStyle = '#ff007f';
        ctxClient.lineWidth = 1;
        ctxClient.strokeRect(7, 3, 18, 30);
        canvasClient.refresh();

        // 6d. NPC EVENTO (anfitrión social - verde fiesta)
        const canvasHost = this.textures.createCanvas('npc_host', 32, 32);
        const ctxHost = canvasHost.context;
        ctxHost.fillStyle = '#1f2937'; // Cuerpo
        ctxHost.fillRect(8, 12, 16, 20);
        ctxHost.fillStyle = '#39ff14'; // Cabeza verde neón
        ctxHost.fillRect(10, 4, 12, 10);
        ctxHost.fillStyle = '#000000'; // Ojos
        ctxHost.fillRect(12, 7, 2, 2);
        ctxHost.fillRect(18, 7, 2, 2);
        // Auriculares de fiesta
        ctxHost.fillStyle = '#ff007f';
        ctxHost.fillRect(8, 6, 2, 6);
        ctxHost.fillRect(22, 6, 2, 6);
        canvasHost.refresh();

        // 6e. PAQUETE / CAJA DE TRABAJO (para mecánica de entrega)
        const canvasPackage = this.textures.createCanvas('package', 24, 24);
        const ctxPackage = canvasPackage.context;
        // Caja base
        ctxPackage.fillStyle = '#92400e'; // Marrón cartón
        ctxPackage.fillRect(2, 4, 20, 18);
        // Sombras de la caja
        ctxPackage.fillStyle = '#78350f';
        ctxPackage.fillRect(2, 4, 20, 2);
        ctxPackage.fillRect(2, 20, 20, 2);
        // Cinta de embalar
        ctxPackage.fillStyle = '#00f2fe';
        ctxPackage.fillRect(2, 12, 20, 2);
        ctxPackage.fillRect(11, 4, 2, 18);
        // Etiqueta de envío
        ctxPackage.fillStyle = '#ffffff';
        ctxPackage.fillRect(14, 7, 6, 4);
        canvasPackage.refresh();

        // 6f. MARCADOR DE EVENTO SOCIAL (zona de fiesta brillante)
        const canvasEvent = this.textures.createCanvas('event_zone', 64, 8);
        const ctxEvent = canvasEvent.context;
        // Plataforma de evento (brillo arcoíris)
        const gradEvent = ctxEvent.createLinearGradient(0, 0, 64, 0);
        gradEvent.addColorStop(0, '#ff007f');
        gradEvent.addColorStop(0.5, '#00f2fe');
        gradEvent.addColorStop(1, '#39ff14');
        ctxEvent.fillStyle = gradEvent;
        ctxEvent.fillRect(0, 0, 64, 8);
        // Brillo superior
        ctxEvent.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctxEvent.fillRect(0, 0, 64, 2);
        canvasEvent.refresh();

        // 6g. BOT DE SEGURIDAD (antagonista narrativo del Nivel 2 - tinte rojo amenazante)
        const canvasBot = this.textures.createCanvas('security_bot', 32, 32);
        const ctxBot = canvasBot.context;
        ctxBot.fillStyle = '#7f1d1d'; // Estructura roja oxidada
        ctxBot.fillRect(4, 8, 24, 24);
        ctxBot.strokeStyle = '#ff0055'; // Borde rojo alerta
        ctxBot.lineWidth = 1;
        ctxBot.strokeRect(4, 8, 24, 24);
        ctxBot.fillStyle = '#000000'; // Visor
        ctxBot.fillRect(8, 12, 16, 8);
        ctxBot.fillStyle = '#ff0055'; // Sensor rojo
        ctxBot.fillRect(10, 14, 4, 4);
        ctxBot.fillRect(18, 14, 4, 4);
        // Antena de alerta
        ctxBot.fillStyle = '#ff0055';
        ctxBot.fillRect(15, 4, 2, 6);
        ctxBot.fillRect(13, 4, 6, 2);
        canvasBot.refresh();

        // 6h. ICONO ! (sobre NPC con quest)
        const canvasExc = this.textures.createCanvas('icon_exclaim', 16, 16);
        const ctxExc = canvasExc.context;
        ctxExc.fillStyle = '#ff007f';
        ctxExc.fillRect(7, 2, 2, 8);
        ctxExc.fillRect(7, 12, 2, 2);
        // Aura
        ctxExc.fillStyle = 'rgba(255, 0, 127, 0.3)';
        ctxExc.fillRect(4, 0, 8, 16);
        canvasExc.refresh();

        // 6i. ICONO $ (sobre NPC vendedor)
        const canvasDollar = this.textures.createCanvas('icon_dollar', 16, 16);
        const ctxDollar = canvasDollar.context;
        ctxDollar.fillStyle = '#f5d061';
        ctxDollar.fillRect(7, 2, 2, 12);
        ctxDollar.fillRect(4, 4, 8, 2);
        ctxDollar.fillRect(4, 7, 8, 2);
        ctxDollar.fillRect(4, 10, 8, 2);
        ctxDollar.fillStyle = 'rgba(245, 208, 97, 0.3)';
        ctxDollar.fillRect(2, 0, 12, 16);
        canvasDollar.refresh();

        // 6j. ICONO ★ (sobre NPC de evento)
        const canvasStar = this.textures.createCanvas('icon_star', 16, 16);
        const ctxStar = canvasStar.context;
        ctxStar.fillStyle = '#39ff14';
        // Estrella simple de 5 puntas
        ctxStar.fillRect(7, 2, 2, 12);
        ctxStar.fillRect(2, 7, 12, 2);
        ctxStar.fillRect(4, 4, 8, 8);
        ctxStar.fillStyle = '#1f2937';
        ctxStar.fillRect(7, 7, 2, 2);
        ctxStar.fillStyle = 'rgba(57, 255, 20, 0.3)';
        ctxStar.fillRect(0, 0, 16, 16);
        canvasStar.refresh();

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
