// ─── ENTRADA (TECLADO Y RATÓN) ───
// Gestiona toda la entrada del usuario: teclado y ratón.
// Almacena el estado actual de teclas y la posición/clic del ratón
// para que el resto del juego pueda consultarlos en cada frame.

// Objeto que almacena el estado de cada tecla (true = presionada, false = suelta)
const keys = {};
// Estado del ratón: posición (x, y) en coordenadas del canvas y estado del botón (down)
let mouse = {x: LOGICAL_W/2, y: LOGICAL_H/2, down: false};

// ─── [NEW] DEVICE DETECTION ───
let isTouchDevice = hasTouchInput();
let isSmallScreen = window.innerWidth <= 900 || window.innerHeight <= 600;
let showTouchControls = shouldUseTouchLayout();
function updateDeviceFlags() {
  isTouchDevice = hasTouchInput();
  isSmallScreen = window.innerWidth <= 900 || window.innerHeight <= 600;
  // Una ventana pequeña con mouse/teclado no debe recibir controles táctiles.
  showTouchControls = shouldUseTouchLayout();
  document.body.classList.toggle('touch-mode', showTouchControls);
}

// ─── [NEW] TOUCH CONTROLS STATE ───
let pointerPressed = false;                   // True por 1 frame al tocar la pantalla
let touchShooting = false;                    // True mientras se toca el botón FIRE
let mouseButtonDown = false;
let sprintToggled = false;                    // Se conserva por compatibilidad con partidas guardadas
const pendingKeyRelease = [];                 // Teclas momentáneas (Q=arma, R=recarga) a liberar en 1 frame
// Estado del joystick virtual
let joystickActive = false;
let joystickPointer = -1;
let joystickKnobX = 0;
let joystickKnobY = 0;
// Estado de punteros táctiles
const touches = {};
let aimPointer = -1;
let aimX = LOGICAL_W / 2;
let aimY = LOGICAL_H / 2;

// ─── FUNCIONES AUXILIARES ───

// Reinicia todas las teclas a "no presionadas".
// Se usa cuando el juego pierde el foco para evitar que las teclas queden trabadas.
function clearKeys() {
  for (const k in keys) keys[k] = false;
  touchShooting = false;
  mouseButtonDown = false;
  mouse.down = false;
  sprintToggled = false;
  joystickActive = false;
  joystickPointer = -1;
  aimPointer = -1;
  joystickKnobX = 0;
  joystickKnobY = 0;
  for (const id in touches) delete touches[id];
}

// ─── [NEW] MOMENTARY KEY HELPERS ───
// Marca una tecla momentánea (ej. Q, R) como true y la programa
// para que se libere automáticamente en el próximo frame.
function pressMomentaryKey(code) {
  keys[code] = true;
  if (pendingKeyRelease.indexOf(code) === -1) pendingKeyRelease.push(code);
}

// ─── EVENTOS DE TECLADO ───

// Al presionar una tecla: la marca como activa, inicializa el audio en la primera interacción
// y previene el comportamiento predeterminado (ej. que la barra espaciadora desplace la página).
document.addEventListener('keydown', e => {
  keys[e.code] = true;
  if (!audioInit) initAudio();
  e.preventDefault();
});
// Al soltar una tecla: la marca como inactiva
document.addEventListener('keyup', e => { keys[e.code] = false; });

// ─── EVENTOS DE RATÓN ───

// Actualiza la posición del ratón cuando se mueve, convirtiendo las coordenadas
// de pantalla a coordenadas del canvas dividiendo por el factor de escala.
document.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  mouse.x = (e.clientX - rect.left) * LOGICAL_W / rect.width;
  mouse.y = (e.clientY - rect.top) * LOGICAL_H / rect.height;
});
// Al hacer clic en el canvas: marca el botón como presionado, solicita pantalla completa e inicializa el audio si es necesario
canvas.addEventListener('mousedown', e => {
  if (e.button !== 0) return;
  mouseButtonDown = true;
  mouse.down = true;
  requestFullscreenAndLock();
  if (!audioInit) initAudio();
});
// Al soltar el clic: marca el botón como no presionado
window.addEventListener('mouseup', () => { mouseButtonDown = false; mouse.down = touchShooting; });
// Previene que aparezca el menú contextual del navegador al hacer clic derecho
canvas.addEventListener('contextmenu', e => e.preventDefault());

// ─── [NEW] SMART TV D-PAD ───
// Mapea controles remotos de Smart TV al sistema de teclas existente.
// No añade lógica nueva — solo traduce códigos de tecla adicionales.
document.addEventListener('keydown', e => {
  // Flechas del D-pad remoto (ya manejadas por ArrowLeft/Right/Up)
  // Botones de color en algunos controles remotos Samsung/LG
  if (e.keyCode === 403) { keys['KeyQ'] = true; }       // VK_RED → switch weapon
  if (e.keyCode === 404) { keys['KeyR'] = true; }       // VK_GREEN → reload
  if (e.keyCode === 406) { keys['ShiftLeft'] = true; }  // VK_BLUE → sprint
  // Enter como clic de disparo
  if (e.key === 'Enter' && !e.repeat) { mouse.down = true; }
});
document.addEventListener('keyup', e => {
  if (e.keyCode === 403) { keys['KeyQ'] = false; }
  if (e.keyCode === 404) { keys['KeyR'] = false; }
  if (e.keyCode === 406) { keys['ShiftLeft'] = false; }
  if (e.key === 'Enter') { mouse.down = false; }
});

// ─── [NEW] POINTER EVENTS (TOUCH + PEN + MOUSE UNIFIED) ───
// Sistema unificado de puntero que funciona en cualquier dispositivo:
// teléfonos, tablets, laptops con pantalla táctil, lápiz stylus.
// Traduce cada toque/arrastre a los controles del juego.

// ─── ZONAS DE CONTROL (en coordenadas lógicas del canvas, editables) ───
// Valores por defecto (se pueden personalizar desde el menú de opciones)
let JOYSTICK_CENTER_X = 110;
let JOYSTICK_CENTER_Y = 390;
let JOYSTICK_OUTER_R = 64;
let JOYSTICK_CLAMP = 48;
let BTN_SHOOT_X = 1100, BTN_SHOOT_Y = 390, BTN_SHOOT_R = 42;
let BTN_JUMP_X = 1100, BTN_JUMP_Y = 295, BTN_JUMP_R = 34;
let BTN_SPRINT_X = 1010, BTN_SPRINT_Y = 390, BTN_SPRINT_R = 28;
let BTN_SWITCH_X = 1200, BTN_SWITCH_Y = 390, BTN_SWITCH_R = 28;
let BTN_RELOAD_X = 1100, BTN_RELOAD_Y = 440, BTN_RELOAD_R = 25;
let BTN_KNIFE_X = 1200, BTN_KNIFE_Y = 295, BTN_KNIFE_R = 27;
let BTN_GRENADE_X = 940, BTN_GRENADE_Y = 340, BTN_GRENADE_R = 26;
let BTN_BOARD_X = 1010, BTN_BOARD_Y = 440, BTN_BOARD_R = 26;
let AIM_ZONE_X1 = 0, AIM_ZONE_X2 = LOGICAL_W;
let touchLayoutCustomized = false;

function applyDefaultTouchLayout() {
  const portrait = LOGICAL_W < 600;
  if (portrait) {
    JOYSTICK_CENTER_X = 68; JOYSTICK_CENTER_Y = 390;
    JOYSTICK_OUTER_R = 56; JOYSTICK_CLAMP = 42;
    BTN_SHOOT_X = LOGICAL_W - 48; BTN_SHOOT_Y = 366; BTN_SHOOT_R = 38;
    BTN_JUMP_X = LOGICAL_W - 48; BTN_JUMP_Y = 268; BTN_JUMP_R = 32;
    BTN_SPRINT_X = 68; BTN_SPRINT_Y = 294; BTN_SPRINT_R = 25;
    BTN_SWITCH_X = LOGICAL_W - 112; BTN_SWITCH_Y = 438; BTN_SWITCH_R = 24;
    BTN_RELOAD_X = LOGICAL_W - 48; BTN_RELOAD_Y = 452; BTN_RELOAD_R = 22;
    BTN_KNIFE_X = LOGICAL_W - 112; BTN_KNIFE_Y = 286; BTN_KNIFE_R = 25;
    BTN_GRENADE_X = LOGICAL_W - 112; BTN_GRENADE_Y = 362; BTN_GRENADE_R = 25;
    BTN_BOARD_X = LOGICAL_W - 112; BTN_BOARD_Y = 218; BTN_BOARD_R = 23;
  } else {
    JOYSTICK_CENTER_X = Math.max(88, LOGICAL_W * 0.09); JOYSTICK_CENTER_Y = LOGICAL_H - 86;
    JOYSTICK_OUTER_R = 64; JOYSTICK_CLAMP = 48;
    BTN_SHOOT_X = LOGICAL_W - 100; BTN_SHOOT_Y = LOGICAL_H - 88; BTN_SHOOT_R = 42;
    BTN_JUMP_X = LOGICAL_W - 100; BTN_JUMP_Y = LOGICAL_H - 180; BTN_JUMP_R = 34;
    BTN_SPRINT_X = JOYSTICK_CENTER_X + 100; BTN_SPRINT_Y = LOGICAL_H - 68; BTN_SPRINT_R = 28;
    BTN_SWITCH_X = LOGICAL_W - 30; BTN_SWITCH_Y = LOGICAL_H - 85; BTN_SWITCH_R = 27;
    BTN_RELOAD_X = LOGICAL_W - 185; BTN_RELOAD_Y = LOGICAL_H - 55; BTN_RELOAD_R = 24;
    BTN_KNIFE_X = LOGICAL_W - 30; BTN_KNIFE_Y = LOGICAL_H - 180; BTN_KNIFE_R = 27;
    BTN_GRENADE_X = LOGICAL_W - 190; BTN_GRENADE_Y = LOGICAL_H - 142; BTN_GRENADE_R = 26;
    BTN_BOARD_X = LOGICAL_W - 260; BTN_BOARD_Y = LOGICAL_H - 55; BTN_BOARD_R = 25;
  }
  AIM_ZONE_X1 = 0;
  AIM_ZONE_X2 = LOGICAL_W;
}

// ─── [NEW] TOUCH LAYOUT PERSISTENCE ───
function saveTouchLayout() {
  try { localStorage.setItem('zombies_touch_layout', JSON.stringify({
    version: 2, viewportWidth: LOGICAL_W,
    JOYSTICK_CENTER_X, JOYSTICK_CENTER_Y, JOYSTICK_OUTER_R, JOYSTICK_CLAMP,
    BTN_SHOOT_X, BTN_SHOOT_Y, BTN_SHOOT_R,
    BTN_JUMP_X, BTN_JUMP_Y, BTN_JUMP_R,
    BTN_SPRINT_X, BTN_SPRINT_Y, BTN_SPRINT_R,
    BTN_SWITCH_X, BTN_SWITCH_Y, BTN_SWITCH_R,
    BTN_RELOAD_X, BTN_RELOAD_Y, BTN_RELOAD_R,
    BTN_KNIFE_X, BTN_KNIFE_Y, BTN_KNIFE_R,
    BTN_GRENADE_X, BTN_GRENADE_Y, BTN_GRENADE_R,
    BTN_BOARD_X, BTN_BOARD_Y, BTN_BOARD_R,
    AIM_ZONE_X1, AIM_ZONE_X2,
  })); } catch(e) {}
}
function loadTouchLayout() {
  try {
    const s = localStorage.getItem('zombies_touch_layout');
    if (!s) { applyDefaultTouchLayout(); return; }
    const d = JSON.parse(s);
    // Los layouts antiguos eran absolutos para 1280px y no funcionaban al rotar.
    if (d.version !== 2 || !d.viewportWidth) { applyDefaultTouchLayout(); return; }
    const ratioX = LOGICAL_W / d.viewportWidth;
    if (d.JOYSTICK_CENTER_X !== undefined) JOYSTICK_CENTER_X = d.JOYSTICK_CENTER_X * ratioX;
    if (d.JOYSTICK_CENTER_Y !== undefined) JOYSTICK_CENTER_Y = d.JOYSTICK_CENTER_Y;
    if (d.JOYSTICK_OUTER_R !== undefined) JOYSTICK_OUTER_R = d.JOYSTICK_OUTER_R;
    if (d.JOYSTICK_CLAMP !== undefined) JOYSTICK_CLAMP = d.JOYSTICK_CLAMP;
    if (d.BTN_SHOOT_X !== undefined) BTN_SHOOT_X = d.BTN_SHOOT_X * ratioX;
    if (d.BTN_SHOOT_Y !== undefined) BTN_SHOOT_Y = d.BTN_SHOOT_Y;
    if (d.BTN_SHOOT_R !== undefined) BTN_SHOOT_R = d.BTN_SHOOT_R;
    if (d.BTN_JUMP_X !== undefined) BTN_JUMP_X = d.BTN_JUMP_X * ratioX;
    if (d.BTN_JUMP_Y !== undefined) BTN_JUMP_Y = d.BTN_JUMP_Y;
    if (d.BTN_JUMP_R !== undefined) BTN_JUMP_R = d.BTN_JUMP_R;
    if (d.BTN_SPRINT_X !== undefined) BTN_SPRINT_X = d.BTN_SPRINT_X * ratioX;
    if (d.BTN_SPRINT_Y !== undefined) BTN_SPRINT_Y = d.BTN_SPRINT_Y;
    if (d.BTN_SPRINT_R !== undefined) BTN_SPRINT_R = d.BTN_SPRINT_R;
    if (d.BTN_SWITCH_X !== undefined) BTN_SWITCH_X = d.BTN_SWITCH_X * ratioX;
    if (d.BTN_SWITCH_Y !== undefined) BTN_SWITCH_Y = d.BTN_SWITCH_Y;
    if (d.BTN_SWITCH_R !== undefined) BTN_SWITCH_R = d.BTN_SWITCH_R;
    if (d.BTN_RELOAD_X !== undefined) BTN_RELOAD_X = d.BTN_RELOAD_X * ratioX;
    if (d.BTN_RELOAD_Y !== undefined) BTN_RELOAD_Y = d.BTN_RELOAD_Y;
    if (d.BTN_RELOAD_R !== undefined) BTN_RELOAD_R = d.BTN_RELOAD_R;
    if (d.BTN_KNIFE_X !== undefined) BTN_KNIFE_X = d.BTN_KNIFE_X * ratioX;
    if (d.BTN_KNIFE_Y !== undefined) BTN_KNIFE_Y = d.BTN_KNIFE_Y;
    if (d.BTN_KNIFE_R !== undefined) BTN_KNIFE_R = d.BTN_KNIFE_R;
    if (d.BTN_GRENADE_X !== undefined) BTN_GRENADE_X = d.BTN_GRENADE_X * ratioX;
    if (d.BTN_GRENADE_Y !== undefined) BTN_GRENADE_Y = d.BTN_GRENADE_Y;
    if (d.BTN_GRENADE_R !== undefined) BTN_GRENADE_R = d.BTN_GRENADE_R;
    if (d.BTN_BOARD_X !== undefined) BTN_BOARD_X = d.BTN_BOARD_X * ratioX;
    if (d.BTN_BOARD_Y !== undefined) BTN_BOARD_Y = d.BTN_BOARD_Y;
    if (d.BTN_BOARD_R !== undefined) BTN_BOARD_R = d.BTN_BOARD_R;
    AIM_ZONE_X1 = 0; AIM_ZONE_X2 = LOGICAL_W;
    touchLayoutCustomized = true;
  } catch(e) { applyDefaultTouchLayout(); }
}
function resetTouchLayout() {
  touchLayoutCustomized = false;
  applyDefaultTouchLayout();
  saveTouchLayout();
}

function getCanvasCoords(px, py) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (px - rect.left) * LOGICAL_W / rect.width,
    y: (py - rect.top) * LOGICAL_H / rect.height
  };
}

function dist(x1, y1, x2, y2) {
  return Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
}

function handlePointerDown(e) {
  // Ignorar eventos de ratón — el ratón ya tiene su propio sistema
  if (e.pointerType === 'mouse') return;
  e.preventDefault();
  const p = getCanvasCoords(e.clientX, e.clientY);
  const id = e.pointerId;
  touches[id] = { x: p.x, y: p.y, active: true };
  try { canvas.setPointerCapture(id); } catch (_) {}

  requestFullscreenAndLock();
  if (!audioInit) initAudio();
  updateDeviceFlags();
  pointerPressed = true;
  // Actualiza mouse.x/y para que los botones del menú (pausa, etc.)
  // tengan la posición correcta aunque estén fuera de AIM_ZONE
  mouse.x = p.x;
  mouse.y = p.y;

  // En menús, un toque es sólo un clic; no debe activar controles de partida.
  if (typeof gs === 'undefined' || !gs || gs.state !== 'playing' || gs.paused) return;

  // Joystick flotante: acepta el pulgar en toda la zona inferior izquierda.
  const joystickHit = dist(p.x, p.y, JOYSTICK_CENTER_X, JOYSTICK_CENTER_Y) < JOYSTICK_OUTER_R + 16;
  const floatingJoystickZone = p.x < LOGICAL_W * 0.43 && p.y > LOGICAL_H * 0.58;
  const overActionButton = [
    [BTN_SHOOT_X, BTN_SHOOT_Y, BTN_SHOOT_R], [BTN_JUMP_X, BTN_JUMP_Y, BTN_JUMP_R],
    [BTN_SPRINT_X, BTN_SPRINT_Y, BTN_SPRINT_R], [BTN_SWITCH_X, BTN_SWITCH_Y, BTN_SWITCH_R],
    [BTN_RELOAD_X, BTN_RELOAD_Y, BTN_RELOAD_R], [BTN_KNIFE_X, BTN_KNIFE_Y, BTN_KNIFE_R],
    [BTN_GRENADE_X, BTN_GRENADE_Y, BTN_GRENADE_R], [BTN_BOARD_X, BTN_BOARD_Y, BTN_BOARD_R]
  ].some(b => dist(p.x, p.y, b[0], b[1]) < b[2] + 12);
  if (joystickPointer === -1 && !overActionButton && (joystickHit || floatingJoystickZone)) {
    if (floatingJoystickZone && !joystickHit) {
      JOYSTICK_CENTER_X = Math.max(JOYSTICK_OUTER_R, Math.min(LOGICAL_W * 0.4, p.x));
      JOYSTICK_CENTER_Y = Math.max(LOGICAL_H * 0.55, Math.min(LOGICAL_H - JOYSTICK_OUTER_R, p.y));
    }
    joystickPointer = id;
    joystickActive = true;
    const dx = p.x - JOYSTICK_CENTER_X;
    const dy = p.y - JOYSTICK_CENTER_Y;
    const d = Math.sqrt(dx*dx + dy*dy);
    joystickKnobX = d > JOYSTICK_CLAMP ? dx / d * JOYSTICK_CLAMP : dx;
    joystickKnobY = d > JOYSTICK_CLAMP ? dy / d * JOYSTICK_CLAMP : dy;
    updateJoystickKeys();
    return;
  }

  // Botón SHOOT
  if (dist(p.x, p.y, BTN_SHOOT_X, BTN_SHOOT_Y) < BTN_SHOOT_R + 12) {
    touches[id]._btn = 'shoot';
    touchShooting = true;
    return;
  }

  // Botón JUMP
  if (dist(p.x, p.y, BTN_JUMP_X, BTN_JUMP_Y) < BTN_JUMP_R + 12) {
    touches[id]._btn = 'jump';
    keys['Space'] = true;
    return;
  }

  // Botón SPRINT (mantener pulsado; admite movimiento simultáneo)
  if (dist(p.x, p.y, BTN_SPRINT_X, BTN_SPRINT_Y) < BTN_SPRINT_R + 12) {
    touches[id]._btn = 'sprint';
    keys['ShiftLeft'] = true;
    return;
  }

  // Botón SWITCH (Q)
  if (dist(p.x, p.y, BTN_SWITCH_X, BTN_SWITCH_Y) < BTN_SWITCH_R + 12) {
    touches[id]._btn = 'switch';
    pressMomentaryKey('KeyQ');
    return;
  }

  // Botón RELOAD (R)
  if (dist(p.x, p.y, BTN_RELOAD_X, BTN_RELOAD_Y) < BTN_RELOAD_R + 12) {
    touches[id]._btn = 'reload';
    pressMomentaryKey('KeyR');
    return;
  }

  // Botón KNIFE / CAJA (E)
  if (dist(p.x, p.y, BTN_KNIFE_X, BTN_KNIFE_Y) < BTN_KNIFE_R + 12) {
    touches[id]._btn = 'knife';
    keys['KeyE'] = true;
    return;
  }

  // Botón GRENADE (G)
  if (dist(p.x, p.y, BTN_GRENADE_X, BTN_GRENADE_Y) < BTN_GRENADE_R + 12) {
    touches[id]._btn = 'grenade';
    keys['KeyG'] = true;
    return;
  }

  // Botón BOARD / TABLAS (T)
  if (dist(p.x, p.y, BTN_BOARD_X, BTN_BOARD_Y) < BTN_BOARD_R + 12) {
    touches[id]._btn = 'board';
    keys['KeyT'] = true;
    return;
  }

  // Zona de puntería (centro de la pantalla)
  if (p.x >= AIM_ZONE_X1 && p.x <= AIM_ZONE_X2 && p.y >= 0 && p.y <= LOGICAL_H) {
    aimPointer = id;
    aimX = p.x;
    aimY = p.y;
    mouse.x = p.x;
    mouse.y = p.y;
    return;
  }
}

function handlePointerMove(e) {
  if (e.pointerType === 'mouse') return;
  e.preventDefault();
  const p = getCanvasCoords(e.clientX, e.clientY);
  const id = e.pointerId;

  // Actualiza mouse.x/y para arrastres en menús
  mouse.x = p.x;
  mouse.y = p.y;

  // Preserva _btn existente (botón original del pointerdown) para que
  // handlePointerUp pueda identificar qué botón se soltó
  const prev = touches[id] || {};
  touches[id] = { x: p.x, y: p.y, active: true, _btn: prev._btn };

  // Arrastre del joystick
  if (id === joystickPointer && joystickActive) {
    const dx = p.x - JOYSTICK_CENTER_X;
    const dy = p.y - JOYSTICK_CENTER_Y;
    const d = Math.sqrt(dx*dx + dy*dy);
    joystickKnobX = d > JOYSTICK_CLAMP ? dx / d * JOYSTICK_CLAMP : dx;
    joystickKnobY = d > JOYSTICK_CLAMP ? dy / d * JOYSTICK_CLAMP : dy;
    updateJoystickKeys();
    return;
  }

  // Arrastre de puntería
  if (id === aimPointer) {
    aimX = p.x;
    aimY = p.y;
    mouse.x = p.x;
    mouse.y = p.y;
    return;
  }
}

function handlePointerUp(e) {
  if (e.pointerType === 'mouse') return;
  const id = e.pointerId;
  const touch = touches[id];

  if (id === joystickPointer) {
    joystickActive = false;
    joystickPointer = -1;
    joystickKnobX = 0;
    joystickKnobY = 0;
    keys['KeyA'] = false;
    keys['KeyD'] = false;
  }

  if (id === aimPointer) {
    aimPointer = -1;
  }

  delete touches[id];
  syncHeldTouchActions();
  mouse.down = mouseButtonDown || touchShooting;
  try { canvas.releasePointerCapture(id); } catch (_) {}
}

function handlePointerCancel(e) {
  handlePointerUp(e);
}

function updateJoystickKeys() {
  keys['KeyA'] = joystickKnobX < -15;
  keys['KeyD'] = joystickKnobX > 15;
  if (joystickKnobX >= -15 && joystickKnobX <= 15) {
    keys['KeyA'] = false;
    keys['KeyD'] = false;
  }
  // El salto SOLO con el botón JUMP, no con el joystick
}

function syncHeldTouchActions() {
  const held = Object.values(touches).map(t => t._btn);
  touchShooting = held.includes('shoot');
  keys['Space'] = held.includes('jump');
  keys['ShiftLeft'] = held.includes('sprint');
  keys['KeyE'] = held.includes('knife');
  keys['KeyG'] = held.includes('grenade');
  keys['KeyT'] = held.includes('board');
}

// ─── [NEW] GAMEPAD API (DUALSENSE / XBOX) ───
// Lee el primer mando conectado y traduce sus ejes/botones
// al sistema de teclas del juego. Compatible con PS5, PS4, Xbox.
const GAMEPAD_DEADZONE = 0.15;
let gamepadConnected = false;
let _gpPrevKeys = {}; // Estado anterior de botones para detectar flancos

function updateGamepad() {
  const gps = navigator.getGamepads ? navigator.getGamepads() : null;
  const gp = gps ? gps[0] : null;
  if (!gp) {
    if (gamepadConnected) {
      gamepadConnected = false;
      for (const k in _gpPrevKeys) keys[k] = false;
      if (_gpPrevKeys['_mouseDown']) mouse.down = false;
      _gpPrevKeys = {};
    }
    return;
  }
  gamepadConnected = true;
  if (!gp.axes || !gp.buttons) { _gpPrevKeys = {}; return; }
  const axes = gp.axes;
  const btns = gp.buttons;
  const prev = _gpPrevKeys;
  const now = {};

  // ─── LEFT STICK → MOVIMIENTO ───
  const lx = axes.length > 0 && Math.abs(axes[0]) > GAMEPAD_DEADZONE ? axes[0] : 0;
  now['KeyA'] = lx < -0.2;
  now['KeyD'] = lx > 0.2;

  // ─── RIGHT STICK → APUNTAR ───
  const rx = axes.length > 2 && Math.abs(axes[2]) > GAMEPAD_DEADZONE ? axes[2] : 0;
  const ry = axes.length > 3 && Math.abs(axes[3]) > GAMEPAD_DEADZONE ? axes[3] : 0;
  if (Math.abs(rx) > GAMEPAD_DEADZONE || Math.abs(ry) > GAMEPAD_DEADZONE) {
    mouse.x = Math.max(0, Math.min(LOGICAL_W, mouse.x + rx * 10));
    mouse.y = Math.max(0, Math.min(LOGICAL_H, mouse.y + ry * 10));
  }

  // ─── BOTONES ───
  // Mapeo estándar: Cross=0, Circle=1, Square=2, Triangle=3
  // L1=4, R1=5, L2=6, R2=7, Share=8, Options=9, L3=10, R3=11
  // D-pad: 12=up, 13=down, 14=left, 15=right
  now['Space']     = !!(btns[0]?.pressed);
  now['Enter']     = !!(btns[0]?.pressed);
  now['NumpadEnter'] = !!(btns[0]?.pressed);
  now['KeyE']      = !!(btns[1]?.pressed);
  now['KeyR']      = !!(btns[2]?.pressed);
  now['KeyQ']      = !!(btns[3]?.pressed);
  now['ShiftLeft'] = !!(btns[4]?.pressed);
  const r2val = btns[7]?.value || 0;
  now['_mouseDown'] = btns[7]?.pressed || r2val > 0.3;
  now['Escape'] = !!(btns[9]?.pressed);

  now['ArrowLeft']  = !!(btns[14]?.pressed);
  now['ArrowRight'] = !!(btns[15]?.pressed);
  now['ArrowUp']    = !!(btns[12]?.pressed);
  now['ArrowDown']  = !!(btns[13]?.pressed);

  // ─── APLICAR TECLAS ───
  for (const k in now) {
    if (k === '_mouseDown') { mouse.down = now[k]; }
    else { keys[k] = now[k]; }
  }
  // Libera teclas que ya no están
  for (const k in prev) {
    if (k === '_mouseDown') { if (!now[k]) mouse.down = false; continue; }
    if (now[k] === undefined || !now[k]) keys[k] = false;
  }
  _gpPrevKeys = now;
}

canvas.addEventListener('pointerdown', handlePointerDown);
canvas.addEventListener('pointermove', handlePointerMove);
canvas.addEventListener('pointerup', handlePointerUp);
canvas.addEventListener('pointercancel', handlePointerCancel);
canvas.addEventListener('lostpointercapture', handlePointerCancel);

window.addEventListener('blur', clearKeys);
document.addEventListener('visibilitychange', function() {
  if (document.hidden) clearKeys();
});
window.addEventListener('gameviewportchange', function() {
  clearKeys();
  // Un layout personalizado se normaliza al ancho nuevo al guardarlo; los
  // defaults se recalculan para cada orientación para mantener ergonomía.
  if (!touchLayoutCustomized) applyDefaultTouchLayout();
  else loadTouchLayout();
  mouse.x = Math.max(0, Math.min(LOGICAL_W, mouse.x));
});

// ─── CARGA DE LAYOUT PERSONALIZADO ───
loadTouchLayout();
