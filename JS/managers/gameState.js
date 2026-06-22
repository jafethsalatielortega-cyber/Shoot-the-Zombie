// ─── ESTADO GLOBAL DEL JUEGO ───
// Variable compartida (singleton) que almacena TODO el estado del juego en un solo objeto.
// Se inicializa como null y se asigna cuando se crea un nuevo juego mediante createGameState().
// Todos los managers y sistemas (física, render, oleadas, etc.) leen y escriben aquí.
let gs = null;

// ─── CREAR ESTADO INICIAL ───
// Construye un objeto con todos los valores por defecto para comenzar una partida nueva.
// Es importante que cada propiedad se inicialice aquí para evitar errores de undefined.
// Devuelve un objeto con todas las propiedades necesarias para el juego
function createGameState() {
  return {
    state: 'title',           // Estado actual: 'title' (título) / 'mapSelect' (selección de mapa) / 'playing' (jugando) / 'gameover' (fin del juego)
    player: new Player(),     // Instancia del jugador (nuevo objeto Player con valores iniciales)
    zombies: [],              // Lista de zombies activos en el nivel (los que ya aparecieron)
    bullets: [],              // Lista de balas (aliadas y enemigas) que están en movimiento
    pickups: [],              // Objetos recogibles (salud, munición, power-ups) en el mapa
    particles: [],            // Partículas de efectos visuales (sangre, explosiones, etc.)
    wave: 1,                  // Número de oleada actual (empieza en 1)
    score: 0,                 // Puntuación acumulada del jugador
    zombiesKilled: 0,         // Total de zombies eliminados en toda la partida
    zombiesKilledThisWave: 0, // Zombies eliminados en la oleada actual (se reinicia cada oleada)
    zombiesTotalThisWave: 0,  // Total de zombies que tiene esta oleada (para la barra de progreso)
    wavesCleared: 0,          // Oleadas completadas exitosamente
    camX: 0,                  // Posición horizontal de la cámara (desplazamiento del scroll)
    camShake: 0,              // Intensidad del temblor de pantalla (ej. cuando un Brute pisa fuerte)
    damageFlash: 0,           // Intensidad del destello rojo al recibir daño (disminuye con el tiempo)
    waveBanner: 0,            // Temporizador del banner de oleada (controla la animación)
    waveBannerScale: 1,       // Escala del banner de oleada (animación de crecimiento/encogimiento)

    graceTimer: 0,            // Tiempo de gracia antes de empezar a spawnear zombies
    spawnTimer: 0,            // Cuenta regresiva para el próximo spawn (cuando llega a 0, aparece un zombie)
    spawnInterval: 2,         // Intervalo entre spawns de zombies (se reduce con cada oleada)
    zombiesToSpawn: [],       // Cola de tipos de zombies pendientes por aparecer (se llena al iniciar oleada)
    zombiesRemaining: 0,      // Zombies que aún no han sido spawneados
    titlePhase: 0,            // Fase de animación de la pantalla de título
    titlePulse: 0,            // Valor para el efecto de pulso en el título

    // ─── ANUNCIOS Y TRANSICIONES ───
    waveAnnouncement: { active: false, wave: 1, opacity: 0 }, // Anuncio de nueva oleada (activo, número, opacidad)
    waveEndDelay: 0,          // Pausa breve al terminar una oleada antes de la siguiente
    waveCompleteTimer: 0,     // Temporizador para mostrar "Oleada completada" (cuenta regresiva)
    showWaveComplete: false,  // Indica si se debe mostrar el cartel de oleada completa
    waveMods: {},             // Modificadores especiales de la oleada (ej. enemigos más rápidos, más vida)

    // ─── JEFE (BOSS) ───
    boss: null,               // Instancia del jefe actual (null si no hay jefe en la oleada)
    bossWave: false,          // Indica si la oleada actual es de jefe (cada 5 oleadas)
    swarmTimer: 0,            // Temporizador para oleadas de refuerzos durante el jefe
    acidProjectiles: [],      // Proyectiles de ácido disparados por el jefe
    bossAnnouncement: { active: false, opacity: 0, wave: 0, timer: 0 }, // Anuncio de aparición del jefe

    // ─── GRANADAS ───
    grenades: [],             // Lista de granadas activas (en el aire o a punto de explotar)
    paused: false,            // Indica si el juego está en pausa (true = pausado)
  };
}
