// ─── MAPA DEL BUS (THE MOVING BUS) ───
// Este archivo implementa el mapa "The Moving Bus" (mapa 2). El jugador
// puede moverse en dos zonas verticales: el techo (roof) y la cabina de
// pasajeros (cabin), conectadas por escotillas. Incluye ventanas rotas,
// barricadas reparables, asientos, barandas, un sistema de meteoritos,
// un zombie electricista que apaga las luces, y una caja misteriosa.

// ─── CONSTANTES DEL BUS ───
// Límites horizontales del bus (izquierda y derecha)
const BUS_LEFT = 40, BUS_RIGHT = 1800;
// Altura Y del techo del bus
const BUS_ROOF_Y = 60;
// Altura Y del techo interior de la cabina de pasajeros
const CABIN_CEIL_Y = 200;
// Altura Y del piso de la cabina de pasajeros
const CABIN_FLOOR_Y = 390;
// Escotilla 1 (frontal) — conecta el techo con la cabina
const HATCH_X = 580, HATCH_W = 120, HATCH_Y = 200;
// Escotilla 2 (trasera)
const HATCH2_X = 1350, HATCH2_W = 120;

// ─── VENTANAS DEL BUS ───
// Función auxiliar que crea un objeto ventana con:
// - x: posición horizontal, w: ancho fijo 100
// - broken: true si la ventana está rota (rota = los zombies pueden entrar)
// - barricadeHp: puntos de vida de la barricada (0 = sin barricada)
// - maxBarricadeHp: capacidad máxima de la barricada
function _w(x,b){return {x,w:100,broken:b,barricadeHp:0,maxBarricadeHp:50};}
// Cada ventana puede estar rota (true) o intacta (false)
// Lista de todas las ventanas del bus. Cada una puede estar rota (los zombies entran)
// y puede tener una barricada con puntos de vida
const BUS_WINDOWS = [
  _w(100,true),_w(240,false),_w(380,false),
  _w(520,true),_w(660,false),_w(800,false),
  _w(940,true),_w(1080,false),
  _w(1220,false),_w(1360,true),
  _w(1500,false),_w(1640,false)
];
// Posición Y y alto de las ventanas en el canvas
const WIN_Y = 220, WIN_H = 70;

// ─── ASIENTOS ───
// Posiciones de los asientos dentro de la cabina.
// side: 0 = lado izquierdo, 1 = lado derecho
const BUS_SEATS = [
  {x:110,side:0},{x:140,side:1},{x:250,side:0},{x:280,side:1},
  {x:390,side:0},{x:420,side:1},{x:530,side:0},{x:560,side:1},
  {x:670,side:0},{x:700,side:1},{x:810,side:0},{x:840,side:1},
  {x:950,side:0},{x:980,side:1},{x:1070,side:0},{x:1100,side:1},
  {x:1210,side:0},{x:1240,side:1},{x:1350,side:0},{x:1380,side:1},
  {x:1490,side:0},{x:1520,side:1},{x:1610,side:0},{x:1640,side:1}
];
// Posiciones X de los tubos verticales de agarre (barandas)
// Tubos verticales de agarre (barandas) a lo largo del bus
const BUS_GRAB_POLES_X = [160,320,480,640,800,960,1120,1280,1440,1600];

// ─── VARIABLES DE ESTADO DEL BUS ───
// Desplazamiento para la animación parallax del paisaje urbano (3 capas)
let _busOffsets = [0,0,0];
// Temporizador de sacudida fuerte (shake) del bus
let _busShakeTimer = 0;
// Temporizador de vibración suave del bus
let _busVibeTimer = 0;
// Partículas de velocidad (líneas que simulan movimiento lateral)
let _busSpeedParticles = [];
// Partículas de lluvia
let _busRainParticles = [];
// Partículas de escape de los tubos de ventilación
let _busExhaustParticles = [];
// Brillo intermitente de la escotilla de emergencia
let _busHatchFlash = 0;
// Desplazamiento vertical de la cámara (sube/baja entre techo y cabina)
let _busCamY = 0;
// Tiempo de enfriamiento para reparar barricadas con la tecla T
let _barricadeCooldown = 0;
// Límite máximo del desplazamiento vertical de la cámara
const BUS_CAM_MAX = 320;
// Velocidad de la transición vertical de la cámara
const BUS_CAM_SPEED = 10;

// ─── CAJA MISTERIOSA (MYSTERY BOX) ───
// Aparece en el techo del bus. Cuando tienes >= 12500 pts aparece un arma.
// Presiona E cerca para gastar 12500 pts y obtenerla. Solo tú decides.
const _mysteryBoxX = 860;                // posición en el techo del bus

// ─── REINICIO DE BARRICADAS ───
// Vacía la vida de todas las barricadas y reinicia el enfriamiento y luces
function resetBusBarricades() {
  for (const w of BUS_WINDOWS) w.barricadeHp = 0;
  _barricadeCooldown = 0;
  resetElectricianLights();
}

// ─── INICIALIZACIÓN DE PARTÍCULAS ───
// Crea partículas de lluvia (20) y de velocidad (12) al cargar el mapa
for (let i=0;i<20;i++) {
  _busRainParticles.push({x:Math.random()*BUS_RIGHT,y:Math.random()*140,spd:200+Math.random()*100,len:2+Math.random()*2});
}
for (let i=0;i<12;i++) {
  _busSpeedParticles.push({x:Math.random()*BUS_RIGHT,y:BUS_ROOF_Y+Math.random()*140,len:60+Math.random()*100,spd:400+Math.random()*200});
}

// ─── FÍSICAS DEL BUS ───
// Controla el movimiento vertical entre techo (roof) y cabina (cabin).
// Las escotillas (hatch) son el único punto de paso entre ambas zonas.
// - Roof: el jugador camina sobre el techo del bus
// - Cabin: el jugador está dentro de la cabina de pasajeros
function updateBusPhysics(entity, dt) {
  // Calcula la altura y el centro aproximados de la entidad
  const hh = entity.h || entity.height || 50;
  const headY = entity.y - hh;
  const centerY = entity.y - hh/2;
  // Verifica si la entidad está dentro de alguna de las dos escotillas
  const inHatch1 = entity.x >= HATCH_X && entity.x <= HATCH_X + HATCH_W;
  const inHatch2 = entity.x >= HATCH2_X && entity.x <= HATCH2_X + HATCH2_W;
  const inHatch = inHatch1 || inHatch2;

  // Aplica gravedad y movimiento
  entity.vy += GRAVITY * dt;
  entity.x += entity.vx * dt;
  entity.y += entity.vy * dt;

  // ─── ZONA: TECHO (ROOF) ───
  // Si la entidad está arriba del techo de la cabina, se mueve sobre el techo
  if (centerY < CABIN_CEIL_Y) {
    // Si no está en una escotilla, no puede caerse del techo
    if (!inHatch && entity.y >= BUS_ROOF_Y) {
      entity.y = BUS_ROOF_Y; entity.vy = 0; entity.onGround = true;
    }
    entity.x = Math.max(BUS_LEFT+10, Math.min(BUS_RIGHT-10, entity.x));
  } else {
    // ─── ZONA: CABINA (interior del bus) ───
    // Si no está en escotilla, no puede atravesar el techo de la cabina
    if (!inHatch && entity.vy < 0 && headY <= CABIN_CEIL_Y) {
      entity.y = CABIN_CEIL_Y + hh; entity.vy = 0;
    }
    // Límite del piso de la cabina
    if (entity.y >= CABIN_FLOOR_Y) {
      entity.y = CABIN_FLOOR_Y; entity.vy = 0; entity.onGround = true;
    }
    entity.x = Math.max(BUS_LEFT+10, Math.min(BUS_RIGHT-10, entity.x));
  }
}

// ─── POST-PROCESO DEL BUS ───
// Se ejecuta después del updatePlaying original.
// Inicializa al jugador en la cabina, controla la cámara horizontal y vertical,
// anima el parallax, maneja barricadas (tecla T), spawn del electricista,
// y la interacción con la caja misteriosa.
function postProcessBus(gs, dt) {
  const p = gs.player;

  // ─── INICIALIZACIÓN DEL JUGADOR EN EL BUS ───
  // Solo la primera vez: ubica al jugador en la cabina
  if (!gs._busSpawned) {
    gs._busSpawned = true;
    resetBusBarricades();
    p.x = Math.floor(BUS_RIGHT * 0.35);
    p.y = CABIN_FLOOR_Y;
    p.onGround = true;
    p.vy = 0;
  }
  // Limita la posición del jugador dentro de los bordes del bus
  p.x = Math.max(BUS_LEFT+10, Math.min(BUS_RIGHT-10, p.x));

  // ─── CÁMARA HORIZONTAL ───
  // Sigue al jugador suavemente con interpolación (lerp)
  const busCamMaxX = Math.max(0, BUS_RIGHT - LOGICAL_W);
  const targetCamX = p.x - LOGICAL_W * 0.35;
  gs.camX += (targetCamX - gs.camX) * Math.min(1, dt * 8);
  gs.camX = Math.max(0, Math.min(busCamMaxX, gs.camX));

  // ─── ANIMACIÓN PARALLAX ───
  // Tres capas del paisaje urbano que se mueven a distintas velocidades
  _busOffsets[0] = (_busOffsets[0] + 80 * dt) % 2560;
  _busOffsets[1] = (_busOffsets[1] + 200 * dt) % 2560;
  _busOffsets[2] = (_busOffsets[2] + 400 * dt) % 2560;

  // ─── SACUDIDA (SHAKE) ───
  // Ocurre aleatoriamente para simular el movimiento del bus
  _busShakeTimer = Math.max(0, _busShakeTimer - dt);
  if (Math.random() < 0.002) _busShakeTimer = 0.08;

  // ─── VIBRACIÓN (VIBE) ───
  // Vibración suave y más frecuente que la sacudida
  _busVibeTimer = Math.max(0, _busVibeTimer - dt);
  if (Math.random() < 0.004) _busVibeTimer = 0.25;

  // ─── LIMITAR ZOMBIES DENTRO DEL BUS ───
  for (const z of gs.zombies) {
    if (!z.dead) {
      z.x = Math.max(BUS_LEFT, Math.min(BUS_RIGHT, z.x));
    }
  }

  // ─── LIMPIAR BALAS FUERA DEL MAPA ───
  for (let i=gs.bullets.length-1; i>=0; i--) {
    const b = gs.bullets[i];
    if (b.x < -50 || b.x > BUS_RIGHT + 50 || b.y < -250 || b.y > 500) b.dead = true;
  }

  // ─── CÁMARA VERTICAL ───
  // Se desplaza suavemente cuando el jugador sube al techo o baja a la cabina
  const hh = p.h || 50;
  const targetCamY = Math.min(1, Math.max(0, (CABIN_FLOOR_Y - (p.y - hh/2)) / (CABIN_FLOOR_Y - BUS_ROOF_Y))) * BUS_CAM_MAX;
  _busCamY += (targetCamY - _busCamY) * Math.min(1, dt * BUS_CAM_SPEED);
  gs.busCamY = _busCamY;

  // ─── AUDIO AMBIENTE ───
  updateBusAudio(gs);

  // ─── REPARAR BARRICADAS (TECLA T) ───
  // El jugador puede reparar la ventana rota más cercana si está cerca
  _barricadeCooldown -= dt;
  if ((keys['KeyT']) && _barricadeCooldown <= 0) {
    let nearest = null, minDist = Infinity;
    for (const w of BUS_WINDOWS) {
      if (!w.broken) continue;
      if (w.barricadeHp >= w.maxBarricadeHp) continue;
      const dist = Math.abs(p.x - (w.x + w.w / 2));
      if (dist < minDist) { minDist = dist; nearest = w; }
    }
    if (nearest && minDist < 90) {
      nearest.barricadeHp = Math.min(nearest.maxBarricadeHp, nearest.barricadeHp + 10);
      gs.score += 10;
      _barricadeCooldown = 0.35;
      try { playTone(400,60,'square',0.04,0.06); } catch(e){}
      if (typeof floatTexts !== 'undefined') {
        floatTexts.push({text:'+10 REPAIR', x:nearest.x+50, y:WIN_Y-10, life:0.7, maxLife:0.7, color:'#ffb833'});
      }
    }
  }

  // ─── ZOMBIE ELECTRICISTA ───
  // Aparece cada 3 oleadas (wave % 3 === 0) y apaga las luces de la cabina
  if (gs._prevWave !== gs.wave) {
    gs._prevWave = gs.wave;
    _electricianSpawnedThisWave = false;
  }
  if (!_electricianSpawnedThisWave && gs.wave % 3 === 0 && !gs.zombies.some(z => z.type === 6 && !z.dead) && gs.zombiesToSpawn.length > 0 && gs.waveAnnouncement && !gs.waveAnnouncement.active) {
    _electricianSpawnedThisWave = true;
    const ek = new ElectricianZombie(BUS_LEFT + 200 + Math.random() * (BUS_RIGHT - BUS_LEFT - 400));
    ek.y = WIN_Y + WIN_H + 10;
    ek.onGround = true;
    gs.zombies.push(ek);
    gs.zombiesRemaining++;
    initElectricianLights();
    try { playTone(100,50,'sawtooth',0.6,0.2); } catch(e){}
    if (typeof floatTexts !== 'undefined') {
      floatTexts.push({text:'⚠ ELECTRICIAN DETECTED ⚠', x:ek.x, y:WIN_Y-10, life:2.5, maxLife:2.5, color:'#66ff66'});
    }
  }

  // ─── CAJA MISTERIOSA (GASTA 12500 PTS SI QUIERES) ───
  // Si tienes >= 12500 pts y no hay arma en la caja, aparece una.
  // Presiona E cerca para gastar 12500 pts y quedártela.
  // ─── MOSTRAR ARMA CUANDO HAY PUNTOS SUFICIENTES ───
  const distToBoxGen = Math.abs(p.x - _mysteryBoxX);
  if (gs.score >= _MYSTERY_BOX_COST && _mysteryBoxWeaponIdx < 0 && !p.dead && distToBoxGen < 150 && Math.abs(p.y - BUS_ROOF_Y) < 50) {
    // Solo ofrece armas que el jugador no tenga ya en ninguno de sus slots
    const available = MYSTERY_WEAPON_INDICES.filter(
      idx => !p.slotWeaponIndices.includes(idx)
    );
    if (available.length > 0) {
      _mysteryBoxWeaponIdx = available[
        Math.floor(Math.random() * available.length)
      ];
      try { playTone(150, 600, 'triangle', 0.2, 0.2); } catch(e){}
      if (typeof floatTexts !== 'undefined') {
        floatTexts.push({
          text:'🎁 MYSTERY BOX READY!', x:_mysteryBoxX, y:BUS_ROOF_Y-60,
          life:2.5, maxLife:2.5, color:'#ffcc00'
        });
      }
      for (let i = 0; i < 8; i++) {
        if (typeof particles !== 'undefined') {
          particles.push({
            x: _mysteryBoxX + (Math.random()-0.5)*30,
            y: BUS_ROOF_Y - 18 + (Math.random()-0.5)*20,
            vx: (Math.random()-0.5)*150, vy: -Math.random()*150-50,
            life: 0.6, maxLife: 0.6,
            color: '#8B5E3C', gravity: 150, size: 3+Math.random()*2, isRect: true
          });
        }
      }
    }
  }
  // ─── RECOGIDA (MANTÉN E 1.5s PARA GASTAR 12500 PTS) ───
  if (p.y < CABIN_CEIL_Y && _mysteryBoxWeaponIdx >= 0 && !p.dead && gs.score >= _MYSTERY_BOX_COST) {
    const distToBox = Math.abs(p.x - _mysteryBoxX);
    const nearBox = distToBox < 55 && Math.abs(p.y - BUS_ROOF_Y) < 50;
    if (keys['KeyE'] && nearBox) {
      _mysteryBoxHoldTime += dt;
      if (_mysteryBoxHoldTime >= 1.5) {
        _mysteryBoxHoldTime = 0;
        gs.score -= _MYSTERY_BOX_COST;
        // ─── ASIGNAR ARMA ───
        const newWpn = WEAPONS[_mysteryBoxWeaponIdx];
        const slot = p.weaponIndex;
        p.slotWeaponIndices[slot] = _mysteryBoxWeaponIdx;
        p.weapon = Object.assign({}, newWpn);
        p.ammo = newWpn.magSize;
        p.totalAmmo = newWpn.totalAmmo;
        p.weaponAmmo[slot] = newWpn.magSize;
        p.weaponTotalAmmo[slot] = newWpn.totalAmmo;
        p.reloading = false;
        p.weaponSwap = 0;
        try { playTone(200,800,'sine',0.3,0.25); } catch(e){}
        try { playTone(400,1200,'sine',0.2,0.2); } catch(e){}
        if (typeof floatTexts !== 'undefined') {
          floatTexts.push({text:'🔫 ' + newWpn.name + '!', x:p.x, y:p.y-50, life:2, maxLife:2, color:'#ffcc00'});
        }
        for (let i = 0; i < 12; i++) {
          if (typeof particles !== 'undefined') {
            particles.push({
              x: _mysteryBoxX + (Math.random()-0.5)*30,
              y: BUS_ROOF_Y - 20 + (Math.random()-0.5)*20,
              vx: (Math.random()-0.5)*200, vy: -Math.random()*200-100,
              life: 0.8, maxLife: 0.8,
              color: ['#ffcc00','#ff8800','#ffffff'][Math.floor(Math.random()*3)],
              gravity: 200, size: 3+Math.random()*3, isRect: false
            });
          }
        }
        _mysteryBoxWeaponIdx = -1;
      }
    } else {
      _mysteryBoxHoldTime = 0;
    }
  } else {
    _mysteryBoxHoldTime = 0;
  }

  // ─── ACTUALIZAR LUCES DEL ELECTRICISTA ───
  updateElectricianLights(gs, dt);

  // ─── LIMPIAR EFECTOS DE DISPARO ───
  // Se fuerza a cero para evitar cualquier flash o sacudida en el renderizado
  gs.camShake = 0;
  if (gs.player) { gs.player.muzzleFlash = 0; gs.player.shootRecoil = 0; }
}

// ─── SONIDO AMBIENTE DEL BUS ───
// Crea un oscilador de tono grave para simular el rugido del motor (60 Hz).
// Cuando el jugador está en el techo, añade un sonido de viento (320 Hz).
// Usa la Web Audio API para generar sonidos en tiempo real.
function updateBusAudio(gs) {
  if (!audioCtx) return;
  try {
    // ─── MOTOR ───
    if (!window._busEngOsc) {
      window._busEngOsc = audioCtx.createOscillator();
      window._busEngGain = audioCtx.createGain();
      window._busEngOsc.type='sine'; window._busEngOsc.frequency.value=60;
      window._busEngGain.gain.value=0;
      window._busEngOsc.connect(window._busEngGain); window._busEngGain.connect(audioCtx.destination);
      window._busEngOsc.start();
    }
    window._busEngGain.gain.setTargetAtTime(0.04,audioCtx.currentTime,0.3);

    // ─── VIENTO (solo en el techo) ───
    const onRoof = gs.player.y < CABIN_CEIL_Y;
    if (onRoof && !window._busWindOsc) {
      window._busWindOsc = audioCtx.createOscillator();
      window._busWindGain = audioCtx.createGain();
      window._busWindOsc.type='sine'; window._busWindOsc.frequency.value=320;
      window._busWindGain.gain.value=0;
      window._busWindOsc.connect(window._busWindGain); window._busWindGain.connect(audioCtx.destination);
      window._busWindOsc.start();
    }
    if (window._busWindGain) {
      const tgt = onRoof ? 0.06 : 0;
      window._busWindGain.gain.setTargetAtTime(tgt,audioCtx.currentTime,0.3);
    }
  } catch(e) {}
}

// ─── GENERACIÓN DE ZOMBIES EN EL BUS ───
// Los zombies aparecen desde las ventanas rotas (BUS_WINDOWS).
// Si la ventana tiene barricada, el zombie la daña primero; si la barricada
// sigue en pie, el zombie no ingresa. Con 30% de probabilidad aparece un
// zombie adicional desde el techo.
function spawnBusZombie(gs) {
  if (gs.zombiesToSpawn.length===0) return;
  const type = gs.zombiesToSpawn.shift();
  // Filtra solo las ventanas rotas (por donde los zombies pueden entrar)
  const brokenWindows = BUS_WINDOWS.filter(w=>w.broken);
  if (brokenWindows.length === 0) return;

  // Elige una ventana rota al azar
  const w = brokenWindows[Math.floor(Math.random()*brokenWindows.length)];

  // ─── SI LA VENTANA TIENE BARRICADA, EL ZOMBIE LA DAÑA ───
  if (w.barricadeHp > 0) {
    const dmg = Math.max(5, 10 + Math.floor(gs.wave / 2));
    w.barricadeHp = Math.max(0, w.barricadeHp - dmg);
    try { playTone(200,100,'sawtooth',0.05,0.08); } catch(e){}
    try { playNoise(0.05,0.1); } catch(e){}
    // Si la barricada sigue en pie, el zombie no pasa (se devuelve a la cola)
    if (w.barricadeHp > 0) {
      gs.zombiesToSpawn.unshift(type);
      return;
    }
  }

  // ─── CREA EL ZOMBIE EN LA VENTANA ───
  const x = w.x + w.w/2;
  const z = new Zombie(type, x);
  z.y = WIN_Y + WIN_H + 30;
  z.vx = 0; z.vy = 0;
  applyWaveMods(z, gs.wave);
  gs.zombies.push(z);
  gs.zombiesRemaining++;
  try { playNoise(0.1,0.2); playTone(800,200,'square',0.08,0.15); } catch(e){}

  // ─── ZOMBIE ADICIONAL DESDE EL TECHO (30% de probabilidad) ───
  if (Math.random() < 0.3) {
    const rx = BUS_LEFT + 20 + Math.random()*(BUS_RIGHT-BUS_LEFT-40);
    const rz = new Zombie(type === 4 ? 0 : type, rx);
    rz.x = rx; rz.y = -40;
    rz.vx = 0; rz.vy = 0;
    applyWaveMods(rz, gs.wave);
    gs.zombies.push(rz);
    gs.zombiesRemaining++;
  }
}

// ─── HORIZONTE DE LA CIUDAD EN RUINAS ───
// Se dibuja solo cuando el jugador está en el techo del bus.
// Usa tres capas parallax con edificios, ventanas iluminadas y terreno.
function renderBusSkyline(gs) {
  // Tres capas parallax con distintas profundidades y velocidades
  const layers = [
    // Capa lejana (más lenta, más transparente, edificios más altos)
    { off: _busOffsets[0], color: '#1a1a2e', alpha: 0.45, minH: 200, maxH: 400, sp: 320 },
    // Capa media
    { off: _busOffsets[1], color: '#131328', alpha: 0.65, minH: 140, maxH: 300, sp: 300 },
    // Capa cercana (más rápida, más opaca, edificios más bajos)
    { off: _busOffsets[2], color: '#0d0d1e', alpha: 0.85, minH: 90, maxH: 220, sp: 280 },
  ];
  for (let L = 0; L < layers.length; L++) {
    const ly = layers[L];
    const baseX = -ly.off % 2560;  // Desplazamiento infinito (se repite cada 2560px)
    ctx.globalAlpha = ly.alpha;
    // Repite el patrón 4 veces para cubrir todo el ancho del mapa
    for (let rep = 0; rep < 4; rep++) {
      const ox = baseX + rep * 2560;
      for (let i = 0; i < 10; i++) {
        // Cada edificio tiene tamaño pseudoaleatorio basado en su posición
        const bx = ox + i * ly.sp;
        const bw = 50 + (i * 37 + L * 73) % 90;
        const bh = ly.minH + (i * 53 + L * 97) % (ly.maxH - ly.minH);
        const by = BUS_ROOF_Y - bh;
        // Omitir si está fuera de la pantalla (optimización)
        const sbx = bx - gs.camX;
        if (sbx > LOGICAL_W + 100 || sbx + bw < -100) continue;
        // ─── CUERPO DEL EDIFICIO ───
        ctx.fillStyle = ly.color;
        ctx.fillRect(bx, by, bw, bh);
        // ─── TECHO IRREGULAR ───
        const seed = i * 17 + L * 31;
        ctx.beginPath();
        ctx.moveTo(bx - 1, by + 3);
        for (let j = 0; j <= bw; j += 5)
          ctx.lineTo(bx + j, by + (j * 7 + seed) % 16);
        ctx.lineTo(bx + bw + 1, by + 3);
        ctx.closePath();
        ctx.fill();
        // ─── VENTANAS DE LOS EDIFICIOS ───
        ctx.fillStyle = 'rgba(170,150,70,' + (0.06 + L * 0.03) + ')';
        for (let wy = by + 14; wy < by + bh - 12; wy += 22) {
          for (let wx = bx + 7; wx < bx + bw - 10; wx += 17) {
            if ((wx * 7 + wy * 13 + i * 5) % 7 === 0) continue;
            ctx.fillRect(wx, wy, 8, 11);
            // Algunas ventanas tienen luz encendida (tono más claro)
            if ((wx * 17 + wy * 11 + i * 7) % 9 < 3) {
              ctx.fillStyle = 'rgba(255,200,80,0.15)';
              ctx.fillRect(wx + 1, wy + 1, 6, 9);
              ctx.fillStyle = 'rgba(170,150,70,' + (0.06 + L * 0.03) + ')';
            }
          }
        }
      }
    }
    ctx.globalAlpha = 1;
  }
}

// ─── RENDERIZADO PRINCIPAL DEL MAPA BUS ───
// Orquesta todo el dibujo: fondo, ciudad desde ventanas, exterior del bus,
// interior (asientos, barandas, escotillas, ventanas, barricadas),
// techo (ventilación, partículas de escape, lluvia y velocidad),
// y finalmente las entidades (jugador, zombies, balas, etc.).
function renderBusMap(gs) {
  const p = gs.player;
  const cx = gs.camX;
  ctx.save();
  ctx.translate(-cx, _busCamY);

  // ─── CAPAS DE FONDO Y ESTRUCTURA ───
  renderBusBackground(gs);
  if (gs.player.y < CABIN_CEIL_Y) renderBusSkyline(gs);
  renderBusExterior(gs);
  renderBusWindowCity(gs);
  renderBusInterior(gs);
  renderBusRooftop(gs);
  drawBusMysteryBox(gs);

  ctx.restore();
  ctx.save();
  ctx.translate(0, _busCamY);

  // ─── ENTIDADES Y EFECTOS ───
  drawPickups(gs);
  for (const z of gs.zombies) drawZombie(z, cx);
  if (gs.boss) drawBoss(gs.boss, cx);
  if (!p.dead || p.deathTimer < 1.5) drawPlayer(p, cx);
  drawBullets(gs);
  for (const a of gs.acidProjectiles) {
    if (a.dead) continue;
    const ax = a.x - cx;
    ctx.save();
    ctx.shadowColor='#39ff14'; ctx.shadowBlur=10;
    ctx.fillStyle='#39ff14';
    ctx.beginPath(); ctx.arc(ax,a.y,6,0,Math.PI*2); ctx.fill();
    ctx.restore();
  }
  for (const g of gs.grenades) {
    if (g.dead) continue;
    for (let ti=0;ti<g.trail.length;ti++){
      const t=g.trail[ti]; const alpha=ti/g.trail.length*0.5;
      ctx.globalAlpha=alpha; ctx.fillStyle='#555';
      ctx.beginPath(); ctx.arc(t.x - cx,t.y,2+ti*0.3,0,Math.PI*2); ctx.fill();
    }
    ctx.globalAlpha=1;
    const gx = g.x - cx;
    ctx.fillStyle='#222'; ctx.beginPath(); ctx.arc(gx,g.y,5,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#ff8800';
    const fuseSize=g.timer<0.5?2+Math.sin(Date.now()*0.03)*1.5:2;
    ctx.beginPath(); ctx.arc(gx+2,g.y-4,fuseSize,0,Math.PI*2); ctx.fill();
  }
  drawParticles(cx);
  ctx.restore();
  drawFloatTexts(cx);
  drawHUD(gs);
}

// ─── Rendering helpers ───
// ─── FONDO: CIELO Y CARRETERA ───
function renderBusBackground(gs) {
  // Cielo degradado oscuro (tonos púrpura y rojo)
  const sky = ctx.createLinearGradient(0,0,0,LOGICAL_H);
  sky.addColorStop(0,'#1a0a2e'); sky.addColorStop(0.5,'#3a1a3a'); sky.addColorStop(1,'#1a1a2e');
  ctx.fillStyle=sky; ctx.fillRect(0,-600,BUS_RIGHT,LOGICAL_H+600);

  // ─── CARRETERA ───
  ctx.fillStyle='#111'; ctx.fillRect(0,LOGICAL_H-60,BUS_RIGHT,360);
  // Línea segmentada central (se mueve con parallax)
  ctx.strokeStyle='rgba(255,200,50,0.3)'; ctx.lineWidth=1;
  const dashOff = _busOffsets[2]*1.5 % 160;
  for (let d=-dashOff; d<BUS_RIGHT+160; d+=160){
    ctx.beginPath(); ctx.moveTo(d,LOGICAL_H-30); ctx.lineTo(d+60,LOGICAL_H-30); ctx.stroke();
  }
  // Líneas de borde de la carretera
  ctx.strokeStyle='rgba(255,200,50,0.2)'; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(0,LOGICAL_H-34); ctx.lineTo(BUS_RIGHT,LOGICAL_H-34); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0,LOGICAL_H-26); ctx.lineTo(BUS_RIGHT,LOGICAL_H-26); ctx.stroke();
}

// ─── CIUDAD VISIBLE A TRAVÉS DE LAS VENTANAS ───
// Dibuja edificios y luces detrás de cada ventana, usando las mismas
// tres capas parallax del horizonte, recortadas al área de la ventana.
function renderBusWindowCity(gs) {
  for (const w of BUS_WINDOWS) {
    ctx.save();
    ctx.beginPath(); ctx.roundRect(w.x,WIN_Y,w.w,WIN_H,2); ctx.clip();

    for (let l=0;l<3;l++){
      const off = _busOffsets[l];
      const alphas = [0.15,0.25,0.12];
      ctx.globalAlpha=alphas[l];
      const baseX = -off % 2560;
      for (let rep=0;rep<3;rep++){
        const bx = baseX + rep*2560;
        if (l===0){
          ctx.fillStyle='#0d0d1a';
          for (let i=0;i<8;i++) ctx.fillRect(bx+i*300,WIN_Y-10,100+i*20,WIN_H+20);
        } else if (l===1){
          ctx.fillStyle='#2a2a3a';
          for (let i=0;i<6;i++) ctx.fillRect(bx+50+i*400,WIN_Y-5,80+(i*13)%40,WIN_H+10);
          ctx.fillStyle='rgba(60,60,80,0.3)';
          for (let i=0;i<5;i++) for (let r=0;r<3;r++) for (let c=0;c<2;c++)
            ctx.fillRect(bx+60+i*400+c*25,WIN_Y+5+r*20,15,12);
        } else {
          ctx.fillStyle='#1a1a2a';
          for (let i=0;i<4;i++) ctx.fillRect(bx+30+i*600,WIN_Y+10,80+(i*23)%50,WIN_H-20);
          ctx.fillStyle='rgba(50,50,70,0.5)';
          for (let i=0;i<2;i++) ctx.fillRect(bx+20+i*800,WIN_Y+55,12,3);
        }
      }
    }
    ctx.globalAlpha=1;
    ctx.restore();
  }
}

// ─── EXTERIOR DEL BUS ───
// Dibuja el cuerpo del bus (color verde militar), las llantas (con animación de giro),
// los cristales rotos de las ventanas, y la franja decorativa lateral.
function renderBusExterior(gs) {
  const vibe = _busVibeTimer > 0 ? (Math.random()-0.5)*2 : 0;
  ctx.fillStyle='#1e2e1e';
  ctx.fillRect(0,BUS_ROOF_Y+vibe,BUS_RIGHT,420);
  ctx.fillStyle='#162616';
  ctx.fillRect(0,BUS_ROOF_Y+vibe,BUS_RIGHT,10);
  ctx.fillStyle='#0a1a0a';
  ctx.fillRect(0,BUS_ROOF_Y+10+vibe,BUS_RIGHT,4);

  const stripeY = 300+vibe;
  ctx.fillStyle='#1e3a1e'; ctx.fillRect(0,stripeY,BUS_RIGHT,30);
  ctx.fillStyle='#162616'; ctx.fillRect(0,stripeY+2,BUS_RIGHT,1); ctx.fillRect(0,stripeY+27,BUS_RIGHT,1);
  ctx.fillStyle='rgba(0,0,0,0.3)'; ctx.fillRect(0,BUS_ROOF_Y+160+vibe,BUS_RIGHT,3);
  ctx.fillStyle='#111'; ctx.fillRect(0,CABIN_FLOOR_Y+vibe,BUS_RIGHT,30); ctx.fillRect(0,420+vibe,BUS_RIGHT,30);

  const wheelAngle = _busOffsets[2] * 0.02;
  // ─── DIBUJAR RUEDA ───
  // Dibuja una llanta del bus con rayos y tuerca central, con rotación animada
  function drawWheel(cx, y) {
    ctx.fillStyle='#1a1a1a';
    ctx.beginPath(); ctx.arc(cx,y,38,0,Math.PI*2); ctx.fill();
    ctx.save();
    ctx.translate(cx,y);
    ctx.rotate(wheelAngle);
    ctx.strokeStyle='#2a2a2a'; ctx.lineWidth=1.5;
    for (let i=0;i<16;i++){const a=i/16*Math.PI*2;
      ctx.beginPath(); ctx.moveTo(Math.cos(a)*33,Math.sin(a)*33);
      ctx.lineTo(Math.cos(a)*37,Math.sin(a)*37); ctx.stroke();
    }
    ctx.fillStyle='#444';
    ctx.beginPath(); ctx.arc(0,0,20,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#555';
    ctx.beginPath(); ctx.arc(0,0,6,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle='#333'; ctx.lineWidth=2;
    for (let a=0;a<6;a++){const ang=a*Math.PI/3;
      ctx.beginPath(); ctx.moveTo(Math.cos(ang)*8,Math.sin(ang)*8);
      ctx.lineTo(Math.cos(ang)*19,Math.sin(ang)*19); ctx.stroke();
    }
    ctx.restore();
    ctx.fillStyle='rgba(0,0,0,0.4)';
    ctx.beginPath(); ctx.arc(cx,390+vibe,40,Math.PI,0); ctx.fill();
  }
  drawWheel(60,440+vibe);
  drawWheel(BUS_RIGHT - 40,440+vibe);

  for (const w of BUS_WINDOWS){
    if (w.broken){
      ctx.strokeStyle='#555'; ctx.lineWidth=1;
      for (let i=0;i<6;i++){
        const bx=w.x+Math.random()*w.w, by=WIN_Y+Math.random()*WIN_H;
        ctx.beginPath(); ctx.moveTo(bx,by); ctx.lineTo(bx+8-Math.random()*16,by+8-Math.random()*16); ctx.stroke();
      }
      ctx.fillStyle='rgba(170,204,255,0.1)';
      for (let i=0;i<4;i++){
        ctx.beginPath();
        const cx=w.x+Math.random()*w.w, cy=WIN_Y+Math.random()*WIN_H;
        ctx.moveTo(cx,cy); ctx.lineTo(cx+10,cy-5); ctx.lineTo(cx+15,cy+8); ctx.closePath(); ctx.fill();
      }
    }
  }
}

// ─── INTERIOR DE LA CABINA ───
// Dibuja el techo interior, el piso, los asientos (izquierda/derecha),
// las barandas verticales, las lámparas con parpadeo, las escotillas de emergencia,
// las ventanas (intactas o rotas) y las barricadas de madera.
function renderBusInterior(gs) {
  const vibe = _busVibeTimer > 0 ? (Math.random()-0.5)*2 : 0;
  const shake = _busShakeTimer > 0 ? (Math.random()-0.5)*4 : 0;

  ctx.fillStyle='#222'; ctx.fillRect(0,CABIN_CEIL_Y+vibe+shake,BUS_RIGHT,4);
  ctx.fillStyle='#1a1a1a'; ctx.fillRect(0,CABIN_CEIL_Y+vibe+shake+4,BUS_RIGHT,12);

  ctx.fillStyle='#2a2a2a'; ctx.fillRect(0,CABIN_FLOOR_Y-8+vibe,BUS_RIGHT,8);
  ctx.fillStyle='#333';
  for (let i=0;i<BUS_RIGHT/22;i++) ctx.fillRect(i*22,CABIN_FLOOR_Y-6+vibe,14,2);

  for (const s of BUS_SEATS){
    const sx=s.x+vibe, sy=300+(s.side?0:25);
    ctx.fillStyle='#1a3a3a';
    ctx.beginPath(); ctx.roundRect(sx,sy,30,12,2); ctx.fill();
    ctx.fillStyle='#2a4a4a'; ctx.fillRect(sx,sy+12,30,20);
    ctx.strokeStyle='#555'; ctx.lineWidth=0.5; ctx.strokeRect(sx,sy,30,32);
    ctx.fillStyle='#3a5a5a'; ctx.fillRect(sx+4,sy-2,22,4);
    if (s.side===0){
      ctx.fillStyle='rgba(30,20,20,0.4)';
      ctx.fillRect(sx+8,sy+6,8,4); ctx.fillRect(sx+18,sy+16,6,8);
    }
  }

  ctx.strokeStyle='#777'; ctx.lineWidth=1;
  for (const px of BUS_GRAB_POLES_X){
    ctx.beginPath(); ctx.moveTo(px+vibe,CABIN_CEIL_Y); ctx.lineTo(px+vibe,CABIN_FLOOR_Y); ctx.stroke();
  }
  ctx.strokeStyle='#555'; ctx.lineWidth=1.5;
  ctx.beginPath(); ctx.moveTo(0+vibe,260); ctx.lineTo(BUS_RIGHT+vibe,260); ctx.stroke();

  const t=Date.now();
  ctx.fillStyle='#ffcc44';
  const lampXs=[150,450,750,1050,1350,1650];
  for (const lx of lampXs){
    let flicker=1;
    const fk = Math.floor(t/3000 + lx) % 4;
    if (fk===0 && t%180 < 240) flicker = 0.4 + Math.random()*0.6;
    ctx.save(); ctx.shadowColor='#ffcc44'; ctx.shadowBlur=flicker>0.8?15:4;
    ctx.globalAlpha=flicker; ctx.fillStyle='#ffcc44';
    ctx.fillRect(lx+vibe,CABIN_CEIL_Y-8+vibe+shake,40,8);
    ctx.restore();
  }

  // ─── DIBUJAR ESCOTILLA ───
  // Dibuja una escotilla de emergencia con franjas amarillas y negras,
  // y un brillo intermitente (flash) cuando está activa
  function drawHatch(hx, hw) {
    ctx.fillStyle='#1a1a1a';
    ctx.beginPath(); ctx.roundRect(hx+vibe,HATCH_Y+vibe+shake,hw,24,4); ctx.fill();
    ctx.fillStyle='#ffcc00';
    for (let i=0;i<8;i++){
      ctx.fillStyle=i%2===0?'#ffcc00':'#111';
      ctx.fillRect(hx+8+i*13+vibe,HATCH_Y+4+vibe+shake,8,16);
    }
    ctx.fillStyle='#888';
    ctx.fillRect(hx+hw/2-10+vibe,HATCH_Y+8+vibe+shake,20,6);
    if (_busHatchFlash>0){
      ctx.save(); ctx.globalAlpha=_busHatchFlash; ctx.fillStyle='#ffdd00';
      ctx.fillRect(hx+vibe,HATCH_Y+vibe+shake,hw,24);
      ctx.restore(); _busHatchFlash=Math.max(0,_busHatchFlash-0.03);
    }
    ctx.textAlign='center'; ctx.fillStyle='#ffcc00'; ctx.font='bold 9px monospace';
    ctx.fillText('EMERGENCY EXIT', hx+hw/2+vibe, HATCH_Y-6+vibe+shake);
  }
  drawHatch(HATCH_X, HATCH_W);
  drawHatch(HATCH2_X, HATCH2_W);
  ctx.textAlign='left';

  for (const w of BUS_WINDOWS){
    if (!w.broken){
      ctx.fillStyle='rgba(170,204,255,0.15)';
      ctx.fillRect(w.x+vibe,WIN_Y+vibe,w.w,WIN_H);
      ctx.strokeStyle='#333'; ctx.lineWidth=2;
      ctx.strokeRect(w.x+vibe,WIN_Y+vibe-2,w.w,WIN_H+4);
      ctx.strokeStyle='#444'; ctx.lineWidth=1;
      ctx.strokeRect(w.x+4+vibe,WIN_Y+4+vibe-2,w.w-8,WIN_H-8);
    } else {
      ctx.strokeStyle='#555'; ctx.lineWidth=2;
      ctx.strokeRect(w.x+vibe,WIN_Y+vibe-2,w.w,WIN_H+4);
    }
    if (w.barricadeHp > 0) {
      const hp = w.barricadeHp / w.maxBarricadeHp;
      const plankCount = Math.ceil(hp * 6);
      for (let i = 0; i < plankCount; i++) {
        const px = w.x + 8 + i * 14 + vibe;
        ctx.fillStyle = hp > 0.5 ? '#8B5E3C' : hp > 0.25 ? '#7A4E2C' : '#6A3E1C';
        ctx.fillRect(px, WIN_Y + vibe, 10, WIN_H);
        ctx.strokeStyle = '#5a2d0c';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(px, WIN_Y + vibe, 10, WIN_H);
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.fillRect(px + 2, WIN_Y + 4 + vibe, 2, WIN_H - 8);
        ctx.fillRect(px + 6, WIN_Y + 4 + vibe, 2, WIN_H - 8);
      }
    }
  }
}

// ─── TECHO DEL BUS ───
// Dibuja el techo con sus rejillas de ventilación, tubos de escape,
// partículas de escape (humo), partículas de velocidad (líneas de movimiento)
// y partículas de lluvia.
function renderBusRooftop(gs) {
  const vibe = _busVibeTimer > 0 ? (Math.random()-0.5)*2 : 0;
  ctx.fillStyle='#1e2e1e'; ctx.fillRect(0,BUS_ROOF_Y+vibe,BUS_RIGHT,4);
  ctx.fillStyle='#263626';
  for (let i=0;i<BUS_RIGHT/80;i++) ctx.fillRect(i*80,BUS_ROOF_Y+vibe,1,4);

  ctx.fillStyle='#2a2a2a'; ctx.fillRect(250,BUS_ROOF_Y-28+vibe,80,34);
  ctx.strokeStyle='#444'; ctx.lineWidth=1; ctx.strokeRect(250,BUS_ROOF_Y-28+vibe,80,34);
  for (let i=0;i<4;i++){ ctx.fillStyle='#444'; ctx.fillRect(258+i*16,BUS_ROOF_Y-22+vibe,10,3); }

  ctx.fillStyle='#2a2a2a'; ctx.fillRect(850,BUS_ROOF_Y-28+vibe,80,34);
  ctx.strokeStyle='#444'; ctx.strokeRect(850,BUS_ROOF_Y-28+vibe,80,34);
  for (let i=0;i<4;i++){ ctx.fillStyle='#444'; ctx.fillRect(858+i*16,BUS_ROOF_Y-22+vibe,10,3); }

  ctx.fillStyle='#2a2a2a'; ctx.fillRect(1450,BUS_ROOF_Y-28+vibe,80,34);
  ctx.strokeStyle='#444'; ctx.strokeRect(1450,BUS_ROOF_Y-28+vibe,80,34);
  for (let i=0;i<4;i++){ ctx.fillStyle='#444'; ctx.fillRect(1458+i*16,BUS_ROOF_Y-22+vibe,10,3); }

  ctx.fillStyle='#333'; ctx.fillRect(1180,BUS_ROOF_Y-60+vibe,16,60);
  ctx.fillStyle='#555'; ctx.fillRect(1178,BUS_ROOF_Y-62+vibe,20,6);
  ctx.fillStyle='#333'; ctx.fillRect(1720,BUS_ROOF_Y-60+vibe,16,60);
  ctx.fillStyle='#555'; ctx.fillRect(1718,BUS_ROOF_Y-62+vibe,20,6);

  _busExhaustParticles.push({x:1190+Math.random()*4,y:BUS_ROOF_Y-50-vibe,vy:-20+Math.random()*-10,vx:-10+Math.random()*20,life:1});
  _busExhaustParticles.push({x:1730+Math.random()*4,y:BUS_ROOF_Y-50-vibe,vy:-20+Math.random()*-10,vx:-10+Math.random()*20,life:1});
  for (let i=_busExhaustParticles.length-1;i>=0;i--){
    const e=_busExhaustParticles[i];
    e.x+=e.vx*0.02; e.y+=e.vy*0.02; e.life-=0.02;
    ctx.globalAlpha=e.life*0.4; ctx.fillStyle='#888';
    ctx.beginPath(); ctx.arc(e.x,e.y,2+e.life*2,0,Math.PI*2); ctx.fill();
    if (e.life<=0) _busExhaustParticles.splice(i,1);
  }
  ctx.globalAlpha=1;

  ctx.fillStyle='rgba(255,255,255,0.04)';
  for (const sp of _busSpeedParticles){
    sp.x = (sp.x - sp.spd*0.016 + BUS_RIGHT*2) % (BUS_RIGHT*2);
    ctx.fillRect(sp.x,BUS_ROOF_Y+10+sp.y%140,sp.len,1);
  }
  ctx.fillStyle='rgba(200,220,255,0.15)';
  for (const rp of _busRainParticles){
    rp.x = (rp.x - rp.spd*0.016 + BUS_RIGHT) % BUS_RIGHT;
    rp.y = (rp.y + 1.5) % 140;
    ctx.fillRect(rp.x,BUS_ROOF_Y+10+rp.y,1,rp.len);
  }
  ctx.globalAlpha=1;
}
// ─── [NEW] METEOR EVENT SYSTEM ───
const meteorEvent = { triggered: false, phase: 'idle', timer: 0, meteorX: 0, meteorY: -200, meteorVY: 0, meteorVX: 0, impactX: 0, impactY: 0, shakeIntensity: 0, shakeDecay: 0.92, flashOpacity: 0, atmosphereRed: 0, fireColumns: [], debrisParticles: [], smokeTrail: [], ashParticles: [], initialized: false, ambientAudioStarted: false };

// ─── REINICIAR EVENTO METEORITO ───
// Vuelve el sistema de meteorito a su estado inicial (idle)
function resetMeteorEvent() {
  meteorEvent.triggered = false;
  meteorEvent.phase = 'idle';
  meteorEvent.timer = 0;
  meteorEvent.shakeIntensity = 0;
  meteorEvent.flashOpacity = 0;
  meteorEvent.atmosphereRed = 0;
  meteorEvent.fireColumns = [];
  meteorEvent.debrisParticles = [];
  meteorEvent.smokeTrail = [];
  meteorEvent.ashParticles = [];
  meteorEvent.ambientAudioStarted = false;
  if (meteorEvent._windCleanup) { try { meteorEvent._windCleanup(); meteorEvent._windCleanup = null; } catch(e) {} }
}

// ─── SONIDO DE METEORITO ───
// Reproduce un sonido ascendente (silbido) mientras el meteorito cae
function initMeteorSounds() {
  if (!ensureCtx()) return;
  try {
    const now = audioCtx.currentTime;
    const wOsc = audioCtx.createOscillator();
    const wGain = audioCtx.createGain();
    wOsc.type = 'sine';
    wOsc.frequency.setValueAtTime(80, now);
    wOsc.frequency.exponentialRampToValueAtTime(400, now + 2.5);
    wOsc.frequency.exponentialRampToValueAtTime(60, now + 3.0);
    wGain.gain.setValueAtTime(0, now);
    wGain.gain.linearRampToValueAtTime(0.4, now + 1.5);
    wGain.gain.linearRampToValueAtTime(0, now + 3.0);
    wOsc.connect(wGain); wGain.connect(audioCtx.destination);
    wOsc.start(now); wOsc.stop(now + 3.2);
  } catch(e) {}
}

// ─── SONIDO DE IMPACTO ───
// Reproduce una explosión grave cuando el meteorito choca contra el suelo
function impactBoomSound() {
  if (!ensureCtx()) return;
  try {
    const now = audioCtx.currentTime;
    playNoise(0.08, 0.5);
    const osc = audioCtx.createOscillator();
    const gn = audioCtx.createGain();
    osc.type = 'sine'; osc.frequency.value = 30;
    gn.gain.setValueAtTime(0.9, now);
    gn.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc.connect(gn); gn.connect(audioCtx.destination);
    osc.start(now); osc.stop(now + 0.5);
    const osc2 = audioCtx.createOscillator();
    const gn2 = audioCtx.createGain();
    osc2.type = 'sine'; osc2.frequency.value = 45;
    gn2.gain.setValueAtTime(0.3, now + 0.1);
    gn2.gain.exponentialRampToValueAtTime(0.001, now + 2.6);
    osc2.connect(gn2); gn2.connect(audioCtx.destination);
    osc2.start(now + 0.1); osc2.stop(now + 2.7);
  } catch(e) {}
}

// ─── SONIDO DE CREPITACIÓN ───
// Reproduce sonidos aleatorios de crepitación (fuego) mientras dure la fase burning
function startFireCrackle() {
  if (!ensureCtx()) return;
  let crackleId = null;
  function doCrackle() {
    if (meteorEvent.phase !== 'burning') return;
    playNoise(0.04, 0.06);
    crackleId = setTimeout(doCrackle, 220 + Math.random() * 160);
  }
  crackleId = setTimeout(doCrackle, 300);
}

// ─── SONIDO DE VIENTO ───
// Crea un sonido ambiental de viento ululante usando dos osciladores con LFO
function startWindHowl() {
  if (!ensureCtx()) return;
  try {
    const now = audioCtx.currentTime;
    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const mix = audioCtx.createGain();
    const lfo = audioCtx.createOscillator();
    const lfoGain = audioCtx.createGain();
    osc1.type = 'sine'; osc1.frequency.value = 180;
    osc2.type = 'sine'; osc2.frequency.value = 220;
    lfo.type = 'sine'; lfo.frequency.value = 0.2;
    lfoGain.gain.value = 0.03;
    lfo.connect(lfoGain); lfoGain.connect(mix.gain);
    mix.gain.setValueAtTime(0.05, now);
    osc1.connect(mix); osc2.connect(mix);
    mix.connect(audioCtx.destination);
    osc1.start(now); osc2.start(now); lfo.start(now);
    meteorEvent._windCleanup = function() { try { osc1.stop(); osc2.stop(); lfo.stop(); } catch(e) {} };
  } catch(e) {}
}

// ─── ACTUALIZAR METEORITO (3 FASES) ───
// Controla el ciclo de vida del meteorito:
// - incoming: cae desde el cielo con estela de humo
// - impact: explosión, escombros, destello y sacudida
// - burning: ambiente de fuego, ceniza, atmósfera rojiza
function updateMeteorEvent(gs, dt) {
  if (gs.selectedMap !== 2) return;
  if (meteorEvent.phase === 'idle') return;

  meteorEvent.timer += dt;

  if (meteorEvent.phase === 'incoming') {
      // meteor falls at constant speed (~3.5s for 178px)
    meteorEvent.meteorX += meteorEvent.meteorVX * dt;
    meteorEvent.meteorY += meteorEvent.meteorVY * dt;

    meteorEvent.smokeTrail.push({ x: meteorEvent.meteorX + (Math.random() - 0.5) * 3, y: meteorEvent.meteorY });
    if (meteorEvent.smokeTrail.length > 12) meteorEvent.smokeTrail.shift();

    if (meteorEvent.timer % (4 * dt) < dt && meteorEvent.smokeTrail.length < 60) {
      meteorEvent.smokeTrail.push({ x: meteorEvent.meteorX + (Math.random() - 0.5) * 6, y: meteorEvent.meteorY + 10, life: 1.2 });
    }

    if (meteorEvent.meteorY >= meteorEvent.impactY) {
      meteorEvent.phase = 'impact';
      meteorEvent.timer = 0;
      meteorEvent.impactX = meteorEvent.meteorX;
      meteorEvent.impactY = meteorEvent.meteorY;
      meteorEvent.shakeIntensity = 18;
      meteorEvent.flashOpacity = 1.0;

      for (let i = 0; i < 20; i++) {
        meteorEvent.debrisParticles.push({
          x: meteorEvent.impactX, y: meteorEvent.impactY,
          vx: Math.random() * 400 - 200, vy: Math.random() * -500 - 100,
          size: 8 + Math.random() * 12, color: Math.random() < 0.5 ? '#444' : '#cc4400',
          life: 2.0, maxLife: 2.0, landed: false
        });
      }

      impactBoomSound();
    }
  }

  if (meteorEvent.phase === 'impact') {
    meteorEvent.shakeIntensity *= meteorEvent.shakeDecay;
    meteorEvent.flashOpacity = Math.max(0, meteorEvent.flashOpacity - dt * 3.5);

    for (let i = meteorEvent.debrisParticles.length - 1; i >= 0; i--) {
      const d = meteorEvent.debrisParticles[i];
      d.vy += 600 * dt;
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      d.life -= dt;
      if (d.life <= 0) {
        if (!d.landed) {
          meteorEvent.debrisParticles.splice(i, 1);
        } else {
          d.life = 0;
        }
      }
    }

    if (meteorEvent.timer > 1.8) {
      meteorEvent.phase = 'burning';
      meteorEvent.timer = 0;

      const fireCols = [];
      for (let bx = 100; bx < 4000; bx += 180 + Math.random() * 120) {
        fireCols.push({
          x: bx, baseY: 58, width: 30 + Math.random() * 50,
          height: 60 + Math.random() * 80,
          flickerOffset: Math.random() * Math.PI * 2,
          intensity: 0.4 + Math.random() * 0.6,
          colorShift: Math.random()
        });
      }
      meteorEvent.fireColumns = fireCols;

      for (let i = 0; i < 60; i++) {
        meteorEvent.ashParticles.push({
          x: Math.random() * LOGICAL_W, y: Math.random() * -200 - 20,
          vX: -1.5 + Math.random() * 3, vY: 15 + Math.random() * 35,
          size: 2 + Math.random() * 5, opacity: 0.3 + Math.random() * 0.5,
          wobble: Math.random() * Math.PI * 2,
          wobbleSpeed: 0.5 + Math.random() * 1.5
        });
      }

      if (!meteorEvent.ambientAudioStarted) {
        meteorEvent.ambientAudioStarted = true;
        startFireCrackle();
        startWindHowl();
      }
    }
  }

  if (meteorEvent.phase === 'burning') {
    meteorEvent.atmosphereRed = Math.min(1, meteorEvent.atmosphereRed + dt / 4);
    for (const a of meteorEvent.ashParticles) {
      a.y += a.vY * dt;
      a.x += Math.sin(a.wobble) * 0.8;
      a.wobble += a.wobbleSpeed * dt;
      if (a.y > 490) { a.y = -10; a.x = Math.random() * LOGICAL_W; }
    }
  }
}

// ─── [NEW] HELLFIRE ATMOSPHERE ───
function drawMeteorPhase1(gs) {
  if (meteorEvent.phase !== 'incoming') return;
  const cx = gs.camX;
  const progress = Math.min(1, Math.max(0, meteorEvent.meteorY / meteorEvent.impactY));
  const r = 10 + (28 - 10) * progress;
  const sx = meteorEvent.meteorX - cx;

  for (let i = meteorEvent.smokeTrail.length - 1; i >= 0; i--) {
    const t = meteorEvent.smokeTrail[i];
    const tr = r * (1 - i / meteorEvent.smokeTrail.length) + 2;
    const alpha = 0.7 * (1 - i / meteorEvent.smokeTrail.length);
    ctx.globalAlpha = Math.max(0, alpha);
    ctx.fillStyle = `rgba(255,80,0,${Math.max(0,0.7*(1-i/meteorEvent.smokeTrail.length))})`;
    ctx.beginPath(); ctx.arc(t.x - cx, t.y, Math.max(1, tr), 0, Math.PI * 2); ctx.fill();
    if (i > meteorEvent.smokeTrail.length - 3) {
      ctx.fillStyle = `rgba(80,80,80,${Math.max(0,0.3*(1-(i-meteorEvent.smokeTrail.length+3)/3))})`;
      ctx.beginPath(); ctx.arc(t.x - cx + (Math.random()-0.5)*2, t.y + 2, Math.max(1, tr * 0.6), 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.globalAlpha = 1;

  ctx.save();
  ctx.translate(sx, meteorEvent.meteorY);
  ctx.fillStyle = 'rgba(255,100,0,0.15)';
  ctx.beginPath(); ctx.arc(0, 0, r + 8, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,60,0,0.35)';
  ctx.beginPath(); ctx.arc(0, 0, r + 4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ff5500';
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffdd55';
  ctx.beginPath(); ctx.ellipse(r * 0.4, -r * 0.3, r * 0.5, r * 0.25, -0.5, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

// ─── EFECTOS VISUALES DE IMPACTO ───
// Dibuja el destello blanco, los rayos de luz, los escombros voladores
// y el resplandor naranja en el punto de impacto del meteorito
function drawImpactEffects(gs) {
  const cx = gs.camX;
  if (meteorEvent.flashOpacity > 0) {
    ctx.fillStyle = `rgba(255,200,120,${meteorEvent.flashOpacity})`;
    ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
    if (meteorEvent.flashOpacity > 0.8) {
      ctx.strokeStyle = `rgba(255,220,136,${meteorEvent.flashOpacity})`;
      ctx.lineWidth = 2;
      for (let i = 0; i < 16; i++) {
        const ang = i / 16 * Math.PI * 2;
        const len = 80 + Math.random() * 80;
        const sx2 = meteorEvent.impactX - cx;
        ctx.beginPath();
        ctx.moveTo(sx2, meteorEvent.impactY);
        ctx.lineTo(sx2 + Math.cos(ang) * len, meteorEvent.impactY + Math.sin(ang) * len);
        ctx.stroke();
      }
    }
  }

  for (const d of meteorEvent.debrisParticles) {
    if (d.life <= 0) continue;
    const dx = d.x - cx;
    ctx.globalAlpha = Math.max(0, d.life / d.maxLife);
    ctx.save();
    ctx.translate(dx, d.y);
    ctx.rotate(d.x * 0.1);
    ctx.fillStyle = d.color;
    ctx.fillRect(-d.size / 2, -d.size / 4, d.size, d.size / 2);
    ctx.restore();
  }
  ctx.globalAlpha = 1;

  if (meteorEvent.phase === 'burning' || meteorEvent.phase === 'impact') {
    ctx.save();
    ctx.globalAlpha = 0.35;
    const g = ctx.createRadialGradient(meteorEvent.impactX - cx, meteorEvent.impactY, 0, meteorEvent.impactX - cx, meteorEvent.impactY, 120);
    g.addColorStop(0, '#ff3300');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(meteorEvent.impactX - cx, meteorEvent.impactY, 120, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
}

// ─── COLUMNAS DE FUEGO ───
// Dibuja llamas parpadeantes a lo largo del escenario después del impacto del meteorito
function drawFireColumns(gs) {
  const cx = gs.camX;
  const now = Date.now();
  for (const col of meteorEvent.fireColumns) {
    const flicker = Math.sin(now * 0.008 + col.flickerOffset) * 0.3 + 0.7;
    const px = col.x - cx * 0.3;
    if (px < -100 || px > LOGICAL_W + 100) continue;
    const baseY = col.baseY;
    const h = col.height * flicker;
    const w = col.width;

    ctx.save();
    ctx.translate(px, 0);
    function drawFlame(w2, h2, color) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(0, baseY);
      ctx.bezierCurveTo(-w2 / 2, baseY - h2 * 0.3, -w2 / 3, baseY - h2 * 0.7, 0, baseY - h2);
      ctx.bezierCurveTo(w2 / 3, baseY - h2 * 0.7, w2 / 2, baseY - h2 * 0.3, 0, baseY);
      ctx.fill();
    }
    drawFlame(w * 1.4, h, `rgba(180,40,0,${0.25 * col.intensity})`);
    drawFlame(w, h * 0.85 * flicker, `rgba(220,80,0,${0.45 * col.intensity})`);
    drawFlame(w * 0.5, h * 0.6 * flicker, `rgba(255,160,20,${0.7 * col.intensity})`);
    ctx.restore();
  }
}

// ─── CAPA ATMOSFÉRICA ───
// Aplica un tinte rojo/anaranjado a toda la pantalla para simular el ambiente de incendio
function drawAtmosphereOverlay(gs) {
  if (meteorEvent.atmosphereRed <= 0) return;
  const alpha = meteorEvent.atmosphereRed * 0.38;
  ctx.fillStyle = `rgba(120,0,0,${alpha})`;
  ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
  const grad = ctx.createLinearGradient(0, 0, 0, 80);
  grad.addColorStop(0, `rgba(200,40,0,${meteorEvent.atmosphereRed * 0.5})`);
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, LOGICAL_W, 80);
}

// ─── PARTÍCULAS DE CENIZA ───
// Dibuja partículas de ceniza cayendo (solo durante la fase burning del meteorito)
function drawAshParticles(gs) {
  if (meteorEvent.ashParticles.length === 0) return;
  for (const a of meteorEvent.ashParticles) {
    ctx.globalAlpha = a.opacity;
    ctx.fillStyle = 'rgba(80,20,0,1)';
    ctx.beginPath(); ctx.arc(a.x, a.y, a.size, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// ─── CAJA MISTERIOSA ───
function drawBusMysteryBox(gs) {
  const boxActive = _mysteryBoxWeaponIdx >= 0;
  const mvibe = _busVibeTimer > 0 ? (Math.random()-0.5)*2 : 0;
  const bx = _mysteryBoxX, by = BUS_ROOF_Y + mvibe;
  const pulse = Math.sin(Date.now() * 0.004) * 0.12 + 0.88;
  ctx.save();
  if (boxActive) {
    ctx.shadowColor = '#ffcc00';
    ctx.shadowBlur = 18 * pulse;
  }
  ctx.fillStyle = '#5C3A1E';
  ctx.beginPath(); ctx.roundRect(bx - 22, by - 38, 44, 38, 4); ctx.fill();
  ctx.strokeStyle = boxActive ? '#C8943C' : '#8A6A3A';
  ctx.lineWidth = 2;
  ctx.strokeRect(bx - 22, by - 38, 44, 38);
  ctx.strokeStyle = 'rgba(0,0,0,0.2)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    const lx = bx - 14 + i * 14;
    ctx.beginPath(); ctx.moveTo(lx, by - 36); ctx.lineTo(lx, by - 2); ctx.stroke();
  }
  ctx.fillStyle = boxActive ? '#C8943C' : '#7A5A2A';
  ctx.fillRect(bx - 2, by - 20, 4, 16);
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(bx - 1, by - 18, 2, 12);
  ctx.shadowColor = boxActive ? '#ffcc00' : '#8A6A3A';
  ctx.shadowBlur = boxActive ? 10 * pulse : 0;
  ctx.fillStyle = boxActive ? '#FFD700' : '#A08050';
  ctx.font = 'bold 20px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('?', bx, by - 18);
  ctx.shadowBlur = 0;
  if (boxActive && Math.abs(gs.player.x - _mysteryBoxX) < 150 && Math.abs(gs.player.y - BUS_ROOF_Y) < 50) {
    const weaponName = WEAPONS[_mysteryBoxWeaponIdx].name;
    const floatY = by - 54 + Math.sin(Date.now() * 0.003) * 3;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.beginPath(); ctx.roundRect(bx - 50, floatY - 8, 100, 16, 4); ctx.fill();
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 10px monospace';
    ctx.fillText(weaponName, bx, floatY + 3);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '9px monospace';
    ctx.fillText('[E]', bx, by + 26);
  }
  ctx.restore();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

// ─── DISTORSIÓN POR CALOR ───
// Dibuja líneas curvas simulando el calor que irradia del suelo después del incendio
function drawHeatShimmer(gs) {
  if (!gs) return;
  const now = Date.now();
  for (let i = 0; i < 4; i++) {
    const hx = Math.random() * LOGICAL_W;
    const hy = 20 + Math.random() * 60;
    const hh = 40 + Math.random() * 40;
    ctx.strokeStyle = 'rgba(255,120,0,0.06)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(hx, hy);
    for (let s = 1; s <= 6; s++) {
      const sy = hy + hh * (s / 6);
      ctx.lineTo(hx + Math.sin(sy * 0.3 + now * 0.002) * 3, sy);
    }
    ctx.stroke();
  }
}

// ─── [NEW] ELECTRICIAN ZOMBIE LIGHTING SYSTEM ───
let _lightState = 'normal';
let _lightTimer = 0;
let _electricianSpawnedThisWave = false;
const LIGHT_FLICKER_DURATION = 2.5;
const LIGHT_RADIUS = 100;

// ─── INICIAR LUCES DE ELECTRICISTA ───
// Activa el estado de parpadeo cuando aparece un zombie electricista
function initElectricianLights() {
  _lightState = 'flicker';
  _lightTimer = 0;
}

// ─── REINICIAR LUCES ───
// Vuelve las luces a su estado normal (sin parpadeo ni apagón)
function resetElectricianLights() {
  _lightState = 'normal';
  _lightTimer = 0;
  _electricianSpawnedThisWave = false;
}

// ─── AL MATAR AL ELECTRICISTA ───
// Restaura las luces, reproduce un sonido y muestra un texto de "LIGHTS RESTORED!"
window._onElectricianKilled = function() {
  if (!gs || gs.selectedMap !== 2) return;
  _lightState = 'normal';
  _lightTimer = 0;
  try { playTone(600,1200,'sine',0.3,0.15); } catch(e){}
  if (typeof floatTexts !== 'undefined') {
    floatTexts.push({text:'LIGHTS RESTORED!', x:gs.player.x, y:gs.player.y-50, life:1.5, maxLife:1.5, color:'#88ff88'});
  }
};

// ─── ACTUALIZAR LUCES DEL ELECTRICISTA ───
// Controla la transición de estado: normal -> flicker (parpadeo) -> blackout (apagón)
function updateElectricianLights(gs, dt) {
  if (gs.selectedMap !== 2) return;
  const hasAliveElectrician = gs.zombies.some(z => z.type === 6 && !z.dead);

  if (!hasAliveElectrician) {
    if (_lightState !== 'normal') {
      _lightState = 'normal';
      _lightTimer = 0;
    }
    return;
  }

  if (_lightState === 'flicker') {
    _lightTimer += dt;
    if (_lightTimer >= LIGHT_FLICKER_DURATION) {
      _lightState = 'blackout';
      _lightTimer = 0;
    }
  }
}

// ─── CUBIERTA DE OSCURIDAD ───
// Dibuja una capa negra sobre la pantalla con un círculo de luz alrededor del jugador.
// Cuando hay electricista, simula parpadeo o apagón total.
function drawBusDarknessOverlay(gs) {
  if (_lightState === 'normal') return;
  if (gs.player.y < CABIN_CEIL_Y) return;

  const cx = gs.camX;
  const playerScreenX = gs.player.x - cx;
  const playerScreenY = gs.player.y + _busCamY - 10;

  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, LOGICAL_W, LOGICAL_H);
  ctx.arc(playerScreenX, playerScreenY, LIGHT_RADIUS, 0, Math.PI * 2, true);
  ctx.closePath();

  let darkAlpha = 1;
  if (_lightState === 'flicker') {
    const t = Date.now();
    const flickerVal = Math.sin(t * 0.02) * Math.sin(t * 0.05) * Math.sin(t * 0.011);
    if (flickerVal > 0.3) darkAlpha = 0.7;
    else if (flickerVal > -0.2) darkAlpha = 0.92;
  }
  ctx.fillStyle = `rgba(0,0,0,${darkAlpha})`;
  ctx.fill('evenodd');

  if (_lightState === 'flicker') {
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = '#66ff66';
    ctx.beginPath(); ctx.arc(playerScreenX, playerScreenY, LIGHT_RADIUS + 30, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}

// ─── WRAPPER DE RENDERIZADO CON EFECTOS ───
// Parchea (wrap) la función renderBusMap para inyectar:
// - Sacudida de cámara por el impacto del meteorito
// - Efectos visuales del meteorito (llamas, atmósfera, ceniza)
// - Cubierta de oscuridad por el electricista
// - Redibujado del HUD sobre todos los efectos
(function() {
  if (window.__electricianRenderPatched) return;
  window.__electricianRenderPatched = true;
  const _origRenderBus = window.renderBusMap;
  if (!_origRenderBus) return;
  window.renderBusMap = function(gs) {
    const si = meteorEvent.shakeIntensity;
    const doShake = si > 0.5;
    if (doShake) {
      ctx.save();
      ctx.translate((Math.random() * 2 - 1) * si, (Math.random() * 2 - 1) * si * 0.5);
    }
    _origRenderBus(gs);
    if (doShake) ctx.restore();

    if (gs.selectedMap === 2 && meteorEvent.phase !== 'idle') {
      if (meteorEvent.phase === 'incoming') drawMeteorPhase1(gs);
      drawImpactEffects(gs);
      if (meteorEvent.phase === 'burning') {
        drawFireColumns(gs);
        drawAtmosphereOverlay(gs);
      }
    }

    drawBusDarknessOverlay(gs);

    // ─── [NEW] TOUCH HUD + GAMEPAD (sobre el mapa del bus) ───
    if (showTouchControls && gs.state === 'playing') {
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillRect(0, LOGICAL_H - 40, LOGICAL_W, 40);
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(0, 0, LOGICAL_W, 36);
      ctx.restore();
    }
    if (showTouchControls) drawTouchGamepad();

    drawHUD(gs);
  };
})();

// ─── END BUS MAP ───
