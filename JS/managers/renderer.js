// ─── RENDERIZAR JUEGO ───
// Dibuja todos los elementos del juego en el canvas: mapa, zombies, jugador, balas,
// proyectiles, granadas, partículas y HUD. Aplica efectos de cámara como temblor y FOV.
// La función usa ctx.save()/restore() para aislar las transformaciones de cámara
// de los elementos de UI (HUD, textos) que se dibujan sin desplazamiento.
// Recibe el estado global del juego (gs) para acceder a todos los objetos que debe dibujar
function renderGame(gs) {
  const p = gs.player;

  // ─── EFECTOS DE CÁMARA ───
  // El temblor (shake) se aplica como desplazamiento aleatorio en X e Y,
  // más un ligero "rebote" vertical (rkY) que levanta la vista.
  // El FOV (field of view) se escala cuando el Electrician está vivo,
  // creando un efecto de zoom-out que da sensación de oscuridad.
  const shX = gs.camShake > 0 ? (Math.random()-0.5)*gs.camShake : 0;
  const shY = gs.camShake > 0 ? (Math.random()-0.5)*gs.camShake : 0;
  const rkY = gs.camShake > 0 ? gs.camShake * 0.4 : 0;

  ctx.save();
  const fov = gs.fov || 1;
  if (fov !== 1) {
    ctx.translate(LOGICAL_W / 2, LOGICAL_H / 2);
    ctx.scale(1 / fov, 1 / fov);
    ctx.translate(-LOGICAL_W / 2 + shX, -LOGICAL_H / 2 + shY + rkY);
  } else {
    ctx.translate(shX, shY + rkY);
  }

  // ─── DIBUJAR ELEMENTOS ───
  // Orden de dibujo (de atrás hacia adelante): mapa, pickups, zombies, jefe, jugador, balas, proyectiles, granadas, partículas
  drawMap(gs.camX);                                       // Fondo del mapa y plataformas
  // ─── CAJA MISTERIOSA (mapa ciudad) ───
  if (gs.selectedMap !== 2 && typeof _mysteryBoxX1 !== 'undefined') {
    const boxActive = _mysteryBoxWeaponIdx >= 0;
    const bx = _mysteryBoxX1 - gs.camX;
    const by = GROUND_Y;
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
    if (boxActive && Math.abs(p.x - _mysteryBoxX1) < 150 && Math.abs(p.y - GROUND_Y) < 50) {
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
  drawPickups(gs);                                        // Objetos recogibles (salud, munición, power-ups)

  for (const z of gs.zombies) drawZombie(z, gs.camX);    // Dibuja cada zombie activo

  if (gs.boss) drawBoss(gs.boss, gs.camX);                // Dibuja al jefe si existe

  // Dibuja al jugador (incluso si está en animación de muerte, hasta 1.5s)
  if (!p.dead || p.deathTimer < 1.5) drawPlayer(p, gs.camX);

  drawBullets(gs);                                         // Dibuja todas las balas activas

  // ─── PROYECTILES DE ÁCIDO ───
  // Proyectiles verdes neón con glow (sombra difuminada) lanzados por el jefe
  for (const a of gs.acidProjectiles) {
    if (a.dead) continue;
    const ax = a.x - gs.camX;
    ctx.save();
    ctx.shadowColor = '#39ff14';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#39ff14';
    ctx.beginPath();
    ctx.arc(ax, a.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // ─── GRANADAS ───
  // Dibuja la estela (círculos que se desvanecen), el cuerpo oscuro
  // y la mecha naranja que parpadea cuando está por explotar
  for (const g of gs.grenades) {
    if (g.dead) continue;
    const gx = g.x - gs.camX;
    for (let ti = 0; ti < g.trail.length; ti++) {
      const t = g.trail[ti];
      const alpha = ti / g.trail.length * 0.5;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#555';
      ctx.beginPath();
      ctx.arc(t.x - gs.camX, t.y, 2 + ti * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.arc(gx, g.y, 5, 0, Math.PI * 2);
    ctx.fill();
    // Mechón que parpadea cuando la granada está por estallar (timer < 0.5s)
    ctx.fillStyle = '#ff8800';
    const fuseSize = g.timer < 0.5 ? 2 + Math.sin(Date.now() * 0.03) * 1.5 : 2;
    ctx.beginPath();
    ctx.arc(gx + 2, g.y - 4, fuseSize, 0, Math.PI * 2);
    ctx.fill();
  }

  // ─── FOGONAZO DEL ARMA ───
  if (p.muzzleFlash > 0 && !p.dead) {
    drawMuzzleFlash(p.muzzleX - gs.camX, p.muzzleY, p.weapon);
  }

  drawParticles(gs.camX);                                  // Partículas visuales (sangre, explosiones, ceniza)

  ctx.restore();                                           // Restaura la transformación de la cámara

  // ─── ELEMENTOS DE UI (no afectados por cámara) ───
  // Estos elementos se dibujan en coordenadas de pantalla fijas
  drawFloatTexts(gs.camX);                                 // Textos flotantes (daño, power-ups, puntos)
  drawHUD(gs);                                             // Interfaz de usuario: barra de vida, puntuación, munición, etc.

  // ─── [NEW] TOUCH HUD ADJUSTMENTS ───
  // En dispositivos táctiles añade barras semi-transparentes para
  // mejorar la legibilidad del HUD y los botones virtuales sobre
  // fondos claros del mapa.
  if (showTouchControls && gs.state === 'playing') {
    ctx.save();
    // Banda oscura inferior para botones virtuales
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(0, LOGICAL_H - 40, LOGICAL_W, 40);
    // Banda oscura superior para textos del HUD
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(0, 0, LOGICAL_W, 36);
    ctx.restore();
  }

  // ─── [NEW] VIRTUAL GAMEPAD ───
  // Gamepad táctil que se dibuja solo en dispositivos táctiles.
  // Incluye joystick de movimiento, botones de acción y zona de puntería.
  if (showTouchControls) drawTouchGamepad(gs);
}

// ─── [NEW] DRAW TOUCH GAMEPAD ───
function drawTouchGamepad(gs) {
  ctx.save();

  // ─── JOYSTICK (movimiento, lado izquierdo) ───
  // Anillo exterior
  ctx.beginPath();
  ctx.arc(JOYSTICK_CENTER_X, JOYSTICK_CENTER_Y, JOYSTICK_OUTER_R, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 2;
  ctx.stroke();
  // Perilla interna (sigue el toque)
  const knobX = JOYSTICK_CENTER_X + joystickKnobX;
  const knobY = JOYSTICK_CENTER_Y + joystickKnobY;
  ctx.beginPath();
  ctx.arc(knobX, knobY, 30, 0, Math.PI * 2);
  ctx.fillStyle = joystickActive ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.25)';
  ctx.fill();
  // Etiqueta "MOVE"
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = '10px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('MOVE', JOYSTICK_CENTER_X, 472);

  // ─── BOTÓN SHOOT ───
  ctx.beginPath();
  ctx.arc(BTN_SHOOT_X, BTN_SHOOT_Y, BTN_SHOOT_R, 0, Math.PI * 2);
  ctx.fillStyle = touchShooting ? 'rgba(220,50,50,0.8)' : 'rgba(220,50,50,0.55)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,80,80,0.8)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 11px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('FIRE', BTN_SHOOT_X, BTN_SHOOT_Y + 4);

  // ─── BOTÓN JUMP ───
  ctx.beginPath();
  ctx.arc(BTN_JUMP_X, BTN_JUMP_Y, BTN_JUMP_R, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(80,150,255,0.5)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(120,180,255,0.8)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 10px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('JUMP', BTN_JUMP_X, BTN_JUMP_Y + 3);

  // ─── BOTÓN SPRINT ───
  ctx.beginPath();
  ctx.arc(BTN_SPRINT_X, BTN_SPRINT_Y, BTN_SPRINT_R, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,180,0,0.45)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,210,80,0.8)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 10px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('RUN', BTN_SPRINT_X, BTN_SPRINT_Y + 3);

  // ─── BOTÓN SWITCH (cambiar arma) ───
  ctx.beginPath();
  ctx.arc(BTN_SWITCH_X, BTN_SWITCH_Y, BTN_SWITCH_R, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(150,80,255,0.45)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(180,120,255,0.8)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 10px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('GUN', BTN_SWITCH_X, BTN_SWITCH_Y + 3);

  // ─── BOTÓN RELOAD ───
  ctx.beginPath();
  ctx.arc(BTN_RELOAD_X, BTN_RELOAD_Y, BTN_RELOAD_R, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(80,200,100,0.45)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(120,230,130,0.8)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 10px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('RLD', BTN_RELOAD_X, BTN_RELOAD_Y + 3);

  // ─── BOTÓN KNIFE ───
  ctx.beginPath();
  ctx.arc(BTN_KNIFE_X, BTN_KNIFE_Y, BTN_KNIFE_R, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,100,100,0.45)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,140,140,0.8)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 10px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('KNIFE', BTN_KNIFE_X, BTN_KNIFE_Y + 3);

  // ─── BOTÓN BOARD (solo en mapa bus) ───
  if (gs && gs.selectedMap === 2) {
    ctx.beginPath();
    ctx.arc(BTN_BOARD_X, BTN_BOARD_Y, BTN_BOARD_R, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(200,140,60,0.45)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(220,170,90,0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('BOARD', BTN_BOARD_X, BTN_BOARD_Y + 3);
  }

  // ─── INDICADOR DE PUNTERÍA TÁCTIL ───
  // Pequeña cruceta que muestra hacia dónde apunta el jugador con el toque
  if (aimPointer >= 0 && !showTouchControls) {
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 1;
    // Línea horizontal
    ctx.beginPath();
    ctx.moveTo(aimX - 8, aimY);
    ctx.lineTo(aimX + 8, aimY);
    ctx.stroke();
    // Línea vertical
    ctx.beginPath();
    ctx.moveTo(aimX, aimY - 8);
    ctx.lineTo(aimX, aimY + 8);
    ctx.stroke();
  }

  ctx.textAlign = 'left';
  ctx.restore();
}

// ─── [NEW] ORIENTATION OVERLAY ───
// Muestra un mensaje de "gira el dispositivo" cuando el teléfono
// está en orientación vertical en pantallas pequeñas (< 768px de ancho).
// En tablets (≥768px) el modo retrato es aceptable y no se muestra.
function drawOrientationOverlay() {
  if (!showTouchControls) return;
  if (window.innerWidth >= window.innerHeight) return;
  if (window.innerWidth >= 768) return;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,1)';
  ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 32px monospace';
  ctx.fillText('\uD83D\uDD04 Rotate your device', LOGICAL_W / 2, 220);
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = '16px monospace';
  ctx.fillText('Shoot the Zombie plays best in landscape', LOGICAL_W / 2, 270);
  ctx.restore();
}

// ─── DIBUJAR SUPERPOSICIONES DE TRANSICIÓN ───
// Superpone carteles informativos sobre el juego:
// - Banner de oleada completada (cuando el estado es 'waveComplete')
// - Anuncio de nueva oleada (aparece al inicio de cada oleada y se desvanece)
// - Anuncio de aparición del jefe (cada 5 oleadas, antes de que aparezca el boss)
// Se dibujan por encima del juego normal sin ser afectados por la cámara
function drawTransitionOverlay(gs) {
  if (gs.state === 'waveComplete') {
    drawWaveCompleteBanner(gs);
  }
  if (gs.waveAnnouncement && gs.waveAnnouncement.active && gs.waveAnnouncement.opacity > 0) {
    drawWaveAnnouncement(gs);
  }
  if (gs.bossAnnouncement && gs.bossAnnouncement.active && gs.bossAnnouncement.opacity > 0) {
    drawBossAnnouncement(gs);
  }
}

// ─── INICIAR JUEGO ───
// Reinicia completamente el estado del juego para comenzar una partida nueva.
// Se llama desde la pantalla de título (al presionar ENTER) y desde la
// pantalla de Game Over (al hacer clic en "Play Again").
// Configura todo desde cero: nuevo jugador, oleada 1 con su cola de zombies,
// limpia todas las listas (balas, pickups, granadas, etc.), y muestra el
// anuncio de "Wave 1".
function startGame() {
  gs.state = 'playing';                                    // Cambia el estado a "jugando"
  gs.wave = 1;                                             // Comienza en la oleada 1
  gs.score = 0;
  gs.zombiesKilled = 0;
  gs.zombiesKilledThisWave = 0;
  gs.zombiesTotalThisWave = 0;
  gs.wavesCleared = 0;
  gs.player = new Player();
  gs.zombies = [];
  gs.bullets = [];
  gs.pickups = [];
  gs.zombiesToSpawn = buildWaveQueue(1);                  // Cola de zombies para la oleada 1
  gs.zombiesRemaining = 0;
  gs.spawnTimer = 1;                                      // Primer zombie aparece después de 1 segundo
  gs.spawnInterval = 3;                                   // Intervalo entre spawns
  gs.camX = 0;
  gs.waveBanner = 0;
  gs.waveBannerScale = 0;
  gs.waveEndDelay = 0;
  gs.waveCompleteTimer = 0;
  gs.showWaveComplete = false;
  gs.waveAnnouncement = { active: true, wave: 1, opacity: 1.0 };
  gs.boss = null;
  gs.bossWave = false;
  gs.swarmTimer = 0;
  gs.acidProjectiles = [];
  gs.grenades = [];
  gs.bossAnnouncement = { active: false, opacity: 0, wave: 0, timer: 0 };
  if (typeof _mysteryBoxWeaponIdx !== 'undefined') { _mysteryBoxWeaponIdx = -1; }
  clearKeys();
}

// ─── SIGUIENTE OLEADA ───
// Avanza a la siguiente oleada: limpia el estado, construye una nueva cola
// de zombies según la configuración de la oleada, y cada 5 oleadas
// (5, 10, 15...) crea un jefe (BossZombie) con refuerzos reducidos.
// También recarga parcialmente la munición del jugador y muestra el anuncio
// de la nueva oleada.
function nextWave(gs) {
  gs.wave++;                                              // Avanza al siguiente número de oleada
  gs.state = 'playing';
  gs.showWaveComplete = false;
  gs.zombiesKilledThisWave = 0;
  gs.zombies = gs.zombies.filter(z=>z.dead && z.deathTimer>0); // Conserva solo los zombies que están en animación de muerte
  gs.bullets = [];                                        // Limpia todas las balas
  gs.boss = null;                                         // Elimina al jefe anterior
  gs.bossWave = false;
  gs.swarmTimer = 0;
  gs.acidProjectiles = [];
  gs.grenades = [];
  gs.bossAnnouncement = { active: false, opacity: 0, wave: 0, timer: 0 };

  // ─── OLEADA DE JEFE (cada 5 oleadas) ───
  // Ej: oleadas 5, 10, 15, 20...
  const isBossWave = gs.wave % 5 === 0;
  gs.bossWave = isBossWave;

  if (isBossWave) {
    // Crea una nueva instancia del jefe para esta oleada
    const boss = new BossZombie(gs.wave);
    const p = gs.player;
    // Posiciona al jefe a un lado del jugador (60% del ancho de pantalla)
    boss.x = p.x + (Math.random()<0.5 ? -1 : 1) * (LOGICAL_W * 0.6);
    boss.x = Math.max(50, Math.min(WORLD_W - 50, boss.x)); // Lo posiciona dentro del mundo
    boss.dir = boss.x < p.x ? 1 : -1;                       // El jefe mira hacia el jugador
    gs.boss = boss;

    // Reduce la cantidad de zombies normales en un 30% en oleadas de jefe
    // (para que el jugador se enfoque en el jefe)
    gs.zombiesToSpawn = buildWaveQueue(gs.wave);
    const reduceBy = Math.ceil(gs.zombiesToSpawn.length * 0.3);
    gs.zombiesToSpawn.splice(0, reduceBy);
    gs.zombiesTotalThisWave = gs.zombiesToSpawn.length;

    gs.swarmTimer = 8;                                     // Refuerzos después de 8 segundos
    gs.spawnTimer = 999;                                   // Pausa el spawn normal (el jefe aparece primero)

    // Anuncio de aparición del jefe
    gs.bossAnnouncement = { active: true, opacity: 1.0, wave: gs.wave, timer: 3.5 };

    SFX.bossRoar();                                        // Sonido de rugido del jefe
  } else {
    gs.zombiesToSpawn = buildWaveQueue(gs.wave);           // Oleada normal: construye cola según la configuración
  }

  // ─── CONFIGURACIÓN GENERAL ───
  gs.zombiesRemaining = 0;
  const cfg = getWaveConfig(gs.wave);
  gs.spawnTimer = 1.5;                                     // Primer spawn después de 1.5 segundos
  gs.spawnInterval = cfg.spawnInterval;                    // Intervalo según la configuración de la oleada
  gs.waveBanner = 0;
  gs.waveBannerScale = 0;
  gs.waveEndDelay = 0;
  gs.waveCompleteTimer = 0;
  gs.waveAnnouncement = { active: true, wave: gs.wave, opacity: 1.0 }; // Anuncio de la nueva oleada
  // Recarga parcial de munición entre oleadas
  const p = gs.player;
  p.totalAmmo = Math.max(p.totalAmmo, p.weapon.magSize * 2);  // Al menos 2 cargadores completos
  p.weaponTotalAmmo[p.weaponIndex] = p.totalAmmo;
  // Si el cargador tiene menos de la mitad, lo llena hasta la mitad
  if (!p.reloading && p.ammo < p.weapon.magSize/2) {
    p.ammo = Math.floor(p.weapon.magSize/2);
    p.weaponAmmo[p.weaponIndex] = p.ammo;
  }
  clearKeys();                                             // Limpia el buffer de teclas
}
