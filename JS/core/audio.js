// ─── AUDIO Y EFECTOS DE SONIDO ───
// Gestiona todo el audio del juego usando la API Web Audio.
// Los efectos se generan por síntesis (tonos y ruido) en lugar de archivos de audio,
// salvo el sonido de cambio de oleada y la música de fondo que se cargan desde MP3.

// Contexto de audio del navegador. Se crea bajo demanda cuando el usuario interactúa
// debido a las políticas de autoplay de los navegadores modernos.
let audioCtx = null;
// Objeto Audio para reproducir el sonido de cambio de oleada desde un archivo MP3
let waveSound = null;
// Objeto Audio para la música de fondo (tema principal)
let bgMusic = null;
// Objeto Audio para la música del menú principal
let menuMusic = null;
// Volumen maestro global (0.0 - 1.0). Controla la música de fondo.
let masterVolume = 1.0;
// Volumen de efectos de sonido (SFX) separado (0.0 - 1.0).
let sfxVolume = 1.0;

// Intenta cargar el archivo MP3 del sonido de cambio de oleada
try {
  waveSound = new Audio('THEMES/Wavechange.mp3');
  waveSound.preload = 'auto';   // Precarga el archivo automáticamente
  waveSound.volume = 0.5;       // Volumen al 50%
} catch(e) {}  // Si el archivo no existe, ignora el error silenciosamente

// Intenta cargar el archivo MP3 de la música de fondo (tema principal)
try {
  bgMusic = new Audio('THEMES/Zombie shooter soundtrack.mp3');
  bgMusic.preload = 'auto';
  bgMusic.loop = false;         // Maneja el bucle manualmente para control preciso
  bgMusic.volume = 0.4;         // Volumen base (se ajusta con masterVolume)
  // Bucle infinito: al terminar, vuelve al inicio
  bgMusic.addEventListener('ended', function() {
    try { this.currentTime = 0; this.play(); } catch(e) {}
  });
} catch(e) {}

// Intenta cargar el archivo MP3 de la música del menú principal
try {
  menuMusic = new Audio('THEMES/Tensions Run High.mp3');
  menuMusic.preload = 'auto';
  menuMusic.loop = true;
  menuMusic.volume = 0.4;
} catch(e) {}

// Reproduce el sonido de cambio de oleada desde el inicio
function playWaveSound() {
  if (!waveSound) return;
  try { waveSound.currentTime = 0; waveSound.volume = 0.5 * masterVolume; waveSound.play(); } catch(e) {}
}

// Inicia la música de fondo (tema principal) en bucle infinito
function startBgMusic() {
  if (!bgMusic) return;
  try { bgMusic.currentTime = 0; bgMusic.volume = 0.4 * masterVolume; bgMusic.play(); } catch(e) {}
}

// Actualiza el volumen de la música de fondo según masterVolume
function updateBgMusicVolume() {
  if (bgMusic) try { bgMusic.volume = 0.4 * masterVolume; } catch(e) {}
}

// Actualiza el volumen de la música del menú según masterVolume
function updateMenuMusicVolume() {
  if (menuMusic) try { menuMusic.volume = 0.4 * masterVolume; } catch(e) {}
}

// Inicia la música del menú principal en bucle
function startMenuMusic() {
  if (!menuMusic) return;
  if (!menuMusic.paused) return;
  try { menuMusic.currentTime = 0; menuMusic.volume = 0.4 * masterVolume; menuMusic.play(); } catch(e) {}
}

// Detiene la música del menú principal
function stopMenuMusic() {
  if (!menuMusic) return;
  try { menuMusic.pause(); menuMusic.currentTime = 0; } catch(e) {}
}

// Detiene la música de fondo
function stopBgMusic() {
  if (!bgMusic) return;
  try { bgMusic.pause(); bgMusic.currentTime = 0; } catch(e) {}
}

// Indica si el audio ya fue inicializado tras la primera interacción del usuario
let audioInit = false;

// Solicita pantalla completa y bloquea orientación a landscape en móviles.
// Se llama en CADA interacción del usuario (toque, click, tecla) para reintentar
// si la solicitud previa fue denegada o el navegador la ignoró.
function requestFullscreenAndLock() {
  // ─── Pantalla completa (móvil y PC) ───
  try {
    if (!document.fullscreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) {
      const el = document.documentElement;
      if (el.requestFullscreen) el.requestFullscreen();
      else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
      else if (el.msRequestFullscreen) el.msRequestFullscreen();
    }
  } catch(e) {}
  // ─── Bloqueo de orientación a landscape en móviles ───
  // La pantalla se girará automáticamente, el usuario no necesita rotar manualmente
  try {
    if (screen.orientation && screen.orientation.lock) {
      screen.orientation.lock('landscape').catch(function(){});
    }
  } catch(e) {}
}

// Marca el audio como iniciado, garantiza que el contexto de audio esté listo
function initAudio() {
  audioInit = true;
  ensureCtx();
  requestFullscreenAndLock();
}

// ─── GESTIÓN DEL CONTEXTO DE AUDIO ───

// Crea el AudioContext si aún no existe, o lo reanuda si está suspendido.
// El navegador exige una interacción del usuario para crear o reanudar el contexto de audio.
function ensureCtx() {
  if (!audioCtx) {
    try {
      // Usa webkitAudioContext para compatibilidad con navegadores antiguos
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch(e) { return false; }
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx.state === 'running';
}

// ─── GENERACIÓN DE SONIDOS POR SÍNTESIS ───

// Reproduce un tono sintetizado. Si freq1 y freq2 son distintos,
// genera un barrido de frecuencia (efecto de sirena o impacto).
// type: tipo de onda (sine, square, sawtooth, triangle)
// duration: duración en segundos, vol: volumen (por defecto 0.3)
function playTone(freq1, freq2, type, duration, vol) {
  if (!ensureCtx()) return;
  if (vol === undefined) vol = 0.3;
  try {
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();           // Generador de onda
    const gain = audioCtx.createGain();                 // Control de volumen
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq1, now);
    if (freq2 !== freq1) osc.frequency.exponentialRampToValueAtTime(freq2, now + duration);
    gain.gain.setValueAtTime(vol * sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.start(now);
    osc.stop(now + duration);
  } catch(e) {}
}

// Genera ruido blanco de forma procedural llenando un buffer con valores aleatorios.
// Útil para sonidos de disparos, explosiones y otros efectos no tonales.
function playNoise(duration, vol) {
  if (!ensureCtx()) return;
  if (vol === undefined) vol = 0.2;
  try {
    const now = audioCtx.currentTime;
    const buf = audioCtx.createBuffer(1, audioCtx.sampleRate * duration, audioCtx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i=0; i<data.length; i++) data[i] = Math.random()*2-1;
    const src = audioCtx.createBufferSource();
    const gain = audioCtx.createGain();
    src.buffer = buf;
    src.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(vol * sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    src.start(now);
  } catch(e) {}
}

// ─── BIBLIOTECA DE EFECTOS DE SONIDO (SFX) ───

// Biblioteca de efectos de sonido sintéticos.
// Cada método combina tonos y/o ruido para producir un efecto específico,
// eliminando la necesidad de archivos de audio externos (salvo el cambio de oleada).
const SFX = {
  pistol()      { playTone(800, 200, 'square', 0.08, 0.4); },            // Disparo de pistola
  ak47()        { playNoise(0.06, 0.3); playTone(120, 80, 'sine', 0.06, 0.2); }, // Ráfaga de fusil
  reload()      { playTone(2000, 1800, 'triangle', 0.05, 0.2); },        // Recarga de arma
  groan()       { playTone(80, 70, 'sawtooth', 0.6, 0.15); },            // Gemido de zombi
  brute()       { playTone(40, 30, 'sine', 0.3, 0.4); },                 // Gruñido de enemigo bruto
  hurt()        { playTone(300, 100, 'triangle', 0.15, 0.3); },          // Jugador recibe daño
  pickup()      { playTone(440, 880, 'sine', 0.1, 0.25); setTimeout(function(){playTone(880,1320,'sine',0.1,0.25);},110); }, // Recoger objeto (dos tonos ascendentes)
  empty()       { playTone(300, 300, 'square', 0.05, 0.15); },           // Cargador vacío
  explosion()   { playNoise(0.4, 0.4); playTone(60, 25, 'sawtooth', 0.4, 0.5); },  // Explosión
  bossRoar()    { playTone(80, 40, 'sawtooth', 1.5, 0.4); },             // Rugido de jefe
  bossDeath()   { playNoise(0.3, 0.5); playTone(50, 20, 'sawtooth', 0.5, 0.5); },  // Muerte de jefe
  throwGrenade(){ playTone(600, 300, 'sawtooth', 0.15, 0.2); playNoise(0.08, 0.15); }, // Lanzar granada
};
