// ─── CONSTANTES DEL MUNDO FÍSICO ───
// Todas las medidas y físicas del juego se definen aquí como constantes globales

// Resolución interna del canvas (ancho y alto lógico)
const LOGICAL_W = 1280, LOGICAL_H = 480;
// Ancho total del mundo horizontal del escenario (escena completa)
const WORLD_W = 3200;
// Posición Y del suelo medida desde el borde superior del canvas
const GROUND_Y = 420;
// Gravedad que afecta al jugador, enemigos y objetos (píxeles por segundo²)
const GRAVITY = 900;
// Velocidad inicial al saltar (valor negativo porque el eje Y crece hacia abajo)
const JUMP_VEL = -560;
// Velocidad horizontal al caminar (píxeles por segundo)
const WALK_SPEED = 180;
// Multiplicador de velocidad al correr respecto a la velocidad de caminata
const SPRINT_MULT = 1.7;
// Fricción horizontal (0 = se detiene al instante, 1 = nunca frena)
const FRICTION = 0.82;

// ─── CONFIGURACIÓN DE CADA OLEADA (WAVE) ───

// Configuración fija para las primeras 10 oleadas.
// El índice 0 es null para que la oleada 1 coincida con el índice 1 del arreglo.
// Cada oleada define cuántos enemigos de cada tipo aparecen, el intervalo de aparición
// y un evento especial opcional que modifica el comportamiento de los enemigos.
const WAVE_CONFIGS = [
  null,
  {shamblers:5, runners:0, brutes:0, shooters:0, bombers:0, spawnInterval:3.0, special:null},
  {shamblers:7, runners:2, brutes:0, shooters:0, bombers:0, spawnInterval:2.8, special:null},
  {shamblers:8, runners:4, brutes:1, shooters:0, bombers:0, spawnInterval:2.5, special:null},
  {shamblers:10,runners:5, brutes:1, shooters:0, bombers:0, spawnInterval:2.2, special:null},
  {shamblers:10,runners:4, brutes:1, shooters:2, bombers:0, spawnInterval:2.0, special:'runnerSpeedUp'}, // Oleada 5: los runners son más rápidos
  {shamblers:12,runners:6, brutes:2, shooters:3, bombers:0, spawnInterval:1.8, special:null},
  {shamblers:13,runners:8, brutes:2, shooters:4, bombers:1, spawnInterval:1.6, special:'shamblerDamageUp'}, // Oleada 7: shamblers hacen más daño
  {shamblers:15,runners:10,brutes:3, shooters:5, bombers:2, spawnInterval:1.4, special:'bruteHpUp'},       // Oleada 8: brutes tienen más vida
  {shamblers:18,runners:12,brutes:3, shooters:6, bombers:3, spawnInterval:1.2, special:'allSpeedUp'},       // Oleada 9: todos los enemigos más rápidos
  {shamblers:20,runners:14,brutes:4, shooters:8, bombers:4, spawnInterval:1.0, special:'nightmare'},       // Oleada 10: modo pesadilla activado
];

// Mensajes de advertencia al inicio de cada oleada (actualmente sin usar en el código)
const WAVE_MESSAGES = [
  null, null,
  null, null,
  null, null,
  null, null,
  null, null,
  null,
];

// Mensajes que se muestran al completar cada oleada (texto en inglés)
const WAVE_COMPLETE_MESSAGES = [
  null, // Índice 0 no se usa
  'The dead are rising. Stay sharp.',                                       // Oleada 1
  'They\'re getting faster. Don\'t stop moving.',                           // Oleada 2
  'A Brute has joined the horde.',                                          // Oleada 3
  'The streets run red. More incoming.',                                    // Oleada 4
  'RUNNERS EVOLVED — they\'ve gotten faster.',                               // Oleada 5
  'You\'re still alive? Impressive.',                                       // Oleada 6
  'The Shamblers hunger more than before.',                                  // Oleada 7
  'ELITE BRUTES detected. Aim for the head.',                                // Oleada 8
  'Everything is faster. Everything wants you dead.',                        // Oleada 9
  '\u26A0 NIGHTMARE MODE ACTIVATED \u26A0',                                  // Oleada 10
];

// ─── FUNCIONES AUXILIARES ───

// Obtiene la configuración de una oleada específica.
// Para oleadas del 1 al 10 usa los valores predefinidos.
// Para oleadas superiores genera una configuración escalando los enemigos progresivamente
// a partir de la oleada 10 como base, aumentando la dificultad de forma infinita.
function getWaveConfig(wave) {
  if (wave <= 10) return WAVE_CONFIGS[wave];
  const base = WAVE_CONFIGS[10];
  const extra = wave - 10;
  return {
    shamblers: base.shamblers + extra * 3,
    runners: base.runners + extra * 2,
    brutes: base.brutes + extra * 1,
    shooters: base.shooters + extra * 2,
    bombers: base.bombers + extra * 1,
    spawnInterval: Math.max(0.8, base.spawnInterval - extra * 0.08), // Nunca baja de 0.8s entre spawns
    special: base.special,
  };
}

// Retorna el mensaje que se muestra al completar una oleada.
// Usa los mensajes predefinidos para las primeras 10 oleadas,
// y genera uno genérico para oleadas superiores.
function getWaveMessage(wave) {
  if (wave >= 1 && wave <= 10) return WAVE_COMPLETE_MESSAGES[wave];
  return 'Wave ' + wave + ' \u2014 No end in sight. How long can you last?';
}
