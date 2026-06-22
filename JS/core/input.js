// ─── ENTRADA (TECLADO Y RATÓN) ───
// Gestiona toda la entrada del usuario: teclado y ratón.
// Almacena el estado actual de teclas y la posición/clic del ratón
// para que el resto del juego pueda consultarlos en cada frame.

// Objeto que almacena el estado de cada tecla (true = presionada, false = suelta)
const keys = {};
// Estado del ratón: posición (x, y) en coordenadas del canvas y estado del botón (down)
let mouse = {x: LOGICAL_W/2, y: LOGICAL_H/2, down: false};

// ─── [NEW] DEVICE DETECTION ───
let isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
let isSmallScreen = window.innerWidth <= 900 || window.innerHeight <= 600;
let showTouchControls = isTouchDevice || isSmallScreen;
function updateDeviceFlags() {
  isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  isSmallScreen = window.innerWidth <= 900 || window.innerHeight <= 600;
  showTouchControls = isTouchDevice || isSmallScreen;
}

// ─── [NEW] TOUCH CONTROLS STATE ───
let touchShooting = false;                    // True mientras se toca el botón FIRE
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
  mouse.x = (e.clientX - rect.left) / scale;
  mouse.y = (e.clientY - rect.top)  / scale;
});
// Al hacer clic en el canvas: marca el botón como presionado e inicializa el audio si es necesario
canvas.addEventListener('mousedown', e => {
  mouse.down = true;
  if (!audioInit) initAudio();
});
// Al soltar el clic: marca el botón como no presionado
canvas.addEventListener('mouseup', () => { mouse.down = false; });
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

// ─── ZONAS DE CONTROL (en coordenadas lógicas del canvas) ───
const JOYSTICK_CENTER_X = 110;
const JOYSTICK_CENTER_Y = 390;
const JOYSTICK_OUTER_R = 70;
const JOYSTICK_CLAMP = 60;
const BTN_SHOOT_X = 1170, BTN_SHOOT_Y = 390, BTN_SHOOT_R = 36;
const BTN_JUMP_X = 1170, BTN_JUMP_Y = 310, BTN_JUMP_R = 28;
const BTN_SPRINT_X = 1100, BTN_SPRINT_Y = 390, BTN_SPRINT_R = 24;
const BTN_SWITCH_X = 1240, BTN_SWITCH_Y = 390, BTN_SWITCH_R = 24;
const BTN_RELOAD_X = 1170, BTN_RELOAD_Y = 460, BTN_RELOAD_R = 22;
const AIM_ZONE_X1 = 200, AIM_ZONE_X2 = 1050;

function getCanvasCoords(px, py) {
  const rect = canvas.getBoundingClientRect();
  return { x: (px - rect.left) / scale, y: (py - rect.top) / scale };
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

  if (!audioInit) initAudio();
  updateDeviceFlags();

  // Joystick (zona izquierda)
  if (dist(p.x, p.y, JOYSTICK_CENTER_X, JOYSTICK_CENTER_Y) < JOYSTICK_OUTER_R + 10) {
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

  // Botón SPRINT
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

  touches[id] = { x: p.x, y: p.y, active: true };

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

  if (touch) {
    if (touch._btn === 'shoot') {
      touchShooting = false;
    }
    if (touch._btn === 'jump') {
      keys['Space'] = false;
    }
    if (touch._btn === 'sprint') {
      keys['ShiftLeft'] = false;
    }
  }

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
  if (joystickKnobY < -25) {
    keys['Space'] = true;
  }
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
