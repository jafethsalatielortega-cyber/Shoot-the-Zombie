// ─── PANTALLA DE TÍTULO ───
// Dibuja la pantalla principal del juego con el título, fondo decorativo y mensajes
// Incluye siluetas de zombies animadas, edificios, manchas de sangre decorativas y el título
// El mensaje "PRESS ENTER TO START" parpadea para indicar la acción esperada
// Variable para almacenar el botón táctil "JUGAR" (solo visible en móvil)
let _titlePlayBtn = null;
// Variable para el botón "OPCIONES" en la pantalla de título (solo móvil)
let _titleOptsBtn = null;
// Botones de volumen y retroceso en el overlay de opciones del título
let _titleMusicMinus = null, _titleMusicPlus = null;
let _titleSfxMinus = null, _titleSfxPlus = null;
let _titleOptsBack = null;
// Indica si el overlay de opciones en la pantalla de título está abierto
let _titleOptionsOpen = false;

function drawTitleScreen() {
  // Obtiene el tiempo actual en segundos para animaciones
  const t = Date.now()/1000;

  // Crea un degradado radial desde el centro de la pantalla (rojo oscuro a negro)
  const radGrad = ctx.createRadialGradient(LOGICAL_W/2, LOGICAL_H/2, 50, LOGICAL_W/2, LOGICAL_H/2, LOGICAL_W/1.2);
  radGrad.addColorStop(0, '#3a0000');   // Centro: rojo oscuro
  radGrad.addColorStop(1, '#050000');   // Borde: casi negro
  ctx.fillStyle = radGrad;
  ctx.fillRect(0,0,LOGICAL_W,LOGICAL_H);

  // ─── DIBUJAR EDIFICIOS EN EL FONDO ───
  ctx.fillStyle = '#0d0000';
  for (let i=0; i<16; i++) {
    // Posición horizontal de cada edificio
    const bx = i*90 - 30;
    // Altura variable de cada edificio
    const bh = 50 + (i*73%120);
    // Dibuja el cuerpo del edificio
    ctx.fillRect(bx, LOGICAL_H-bh-20, 70, bh+20);
    // Dibuja ventanas aleatorias en cada edificio (3 filas x 2 columnas)
    for (let r=0; r<3; r++) for (let c=0; c<2; c++) {
      // 30% de probabilidad de que la ventana esté iluminada (color naranja)
      if (Math.random()<0.3) ctx.fillStyle='rgba(255,180,50,0.2)';
      else ctx.fillStyle='#0d0000';  // Ventana apagada (mismo color que el fondo)
      ctx.fillRect(bx+8+c*20, LOGICAL_H-bh-20+8+r*18, 12, 10);
      ctx.fillStyle = '#0d0000';
    }
  }

  // ─── DIBUJAR SILUETAS DE ZOMBIES EN EL FONDO ───
  for (let i=0; i<3; i++) {
    // Posición horizontal con movimiento sinusoidal para dar sensación de movimiento
    const zx = 200 + i*400 + Math.sin(t*0.5+i)*15;
    // Posición vertical: cerca del suelo
    const zy = LOGICAL_H - 30;
    // Cuerpo del zombie (silueta oscura)
    ctx.fillStyle = '#0d0000';
    ctx.fillRect(zx-6, zy-50, 14, 30);
    // Cabeza del zombie (círculo)
    ctx.beginPath(); ctx.arc(zx, zy-58, 8, 0, Math.PI*2); ctx.fill();
    // Brazos del zombie
    ctx.fillRect(zx-3, zy-22, 6, 22);     // Brazo central
    ctx.fillRect(zx+5, zy-45, 5, 18);     // Brazo derecho
    ctx.fillRect(zx-12, zy-43, 5, 16);    // Brazo izquierdo
    // Piernas del zombie
    ctx.fillRect(zx-3, zy-3, 5, 12);      // Pierna izquierda
    ctx.fillRect(zx+1, zy-3, 5, 12);      // Pierna derecha
  }

  // ─── MANCHAS DE SANGRE / LUCES ROJAS ───
  // Círculos rojos semitransparentes decorativos en las esquinas
  ctx.fillStyle = 'rgba(150,0,0,0.3)';
  ctx.beginPath(); ctx.arc(60, 40, 35, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(40, 70, 20, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(LOGICAL_W-60, 40, 30, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(LOGICAL_W-45, 75, 18, 0, Math.PI*2); ctx.fill();

  // ─── TÍTULO DEL JUEGO ───
  ctx.textAlign = 'center';
  // Sombra para dar efecto de profundidad al texto
  ctx.shadowColor = '#000';
  ctx.shadowBlur = 20;
  // "SHOOT THE" en rojo oscuro (fuente grande)
  ctx.fillStyle = '#cc0000';
  ctx.font = 'bold 78px monospace';
  ctx.letterSpacing = '6px';
  ctx.fillText('SHOOT THE', LOGICAL_W/2, 130);
  // "ZOMBIE" en rojo brillante (fuente aún más grande)
  ctx.fillStyle = '#ff2020';
  ctx.font = 'bold 94px monospace';
  ctx.fillText('ZOMBIE', LOGICAL_W/2, 220);
  // Quita la sombra para los siguientes elementos
  ctx.shadowBlur = 0;

  // ─── SUBTÍTULO ───
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.font = 'italic 17px monospace';
  ctx.fillText('Survive the horde. Don\'t run out of ammo.', LOGICAL_W/2, 260);

  // ─── CONTROLES (ocultos en móvil) ───
  if (!showTouchControls) {
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '13px monospace';
    ctx.fillText('WASD / Arrows: Move   Space/W: Jump   Mouse: Aim & Shoot   Q: Switch Weapon   R: Reload', LOGICAL_W/2, 340);
  }

  // ─── MENSAJE DE INICIO (oculto en móvil) ───
  if (!showTouchControls) {
    const pulse = (Math.sin(t*3)+1)/2;
    ctx.fillStyle = `rgba(255,200,50,${0.5 + pulse*0.5})`;
    ctx.font = 'bold 22px monospace';
    ctx.fillText('PRESS ENTER TO START', LOGICAL_W/2, 390);
  }

  // ─── BOTONES "JUGAR" y "OPCIONES" (lado a lado) ───
  const btnW = 160, btnH = 48, btnGap = 14;
  const btnY = showTouchControls ? 370 : 440;
  const totalW = btnW * 2 + btnGap;
  const startX = LOGICAL_W / 2 - totalW / 2;

  // JUGAR
  const jx = startX, jy = btnY;
  const hovJ = mouse.x > jx && mouse.x < jx+btnW && mouse.y > jy && mouse.y < jy+btnH;
  ctx.fillStyle = hovJ ? '#cc0000' : '#880000';
  ctx.beginPath(); ctx.roundRect(jx, jy, btnW, btnH, 6); ctx.fill();
  ctx.strokeStyle = '#ff4444'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.roundRect(jx, jy, btnW, btnH, 6); ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 20px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('JUGAR', jx + btnW / 2, jy + 31);
  _titlePlayBtn = { x: jx, y: jy, w: btnW, h: btnH };

  // OPCIONES
  const ox = startX + btnW + btnGap, oy = btnY;
  const hovO = mouse.x > ox && mouse.x < ox+btnW && mouse.y > oy && mouse.y < oy+btnH;
  ctx.fillStyle = hovO ? '#2a4a3a' : '#1a2a1a';
  ctx.beginPath(); ctx.roundRect(ox, oy, btnW, btnH, 6); ctx.fill();
  ctx.strokeStyle = '#4aff8a'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect(ox, oy, btnW, btnH, 6); ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 16px monospace';
  ctx.fillText('OPCIONES', ox + btnW / 2, oy + 29);
  _titleOptsBtn = { x: ox, y: oy, w: btnW, h: btnH };

  // ─── OVERLAY DE OPCIONES EN TÍTULO ───
  if (_titleOptionsOpen) {
    drawTitleOptions();
  }

  // Restablece propiedades por defecto
  ctx.shadowBlur = 0;
  ctx.letterSpacing = '0px';
  ctx.textAlign = 'left';
}

// ─── PANTALLA DE GAME OVER ───
// Muestra la pantalla de fin del juego con estadísticas y opciones de reinicio
// Incluye puntuación final, oleadas sobrevividas y zombies eliminados
// Botones con detección de hover: Reiniciar (R) y Volver al menú principal
function drawGameOverScreen(gs) {
  // Fondo negro casi opaco que cubre toda la pantalla
  ctx.fillStyle = 'rgba(0,0,0,0.85)';
  ctx.fillRect(0,0,LOGICAL_W,LOGICAL_H);

  // ─── TEXTO "GAME OVER" CON SOMBRA ───
  ctx.textAlign = 'center';
  // Dibuja varias sombras desplazadas para dar un efecto de relieve
  const offsets = [[-3,-2],[2,3],[-1,2],[3,-1]];
  for (const [ox,oy] of offsets) {
    ctx.fillStyle = '#600';        // Sombra rojo oscuro
    ctx.font = 'bold 72px monospace';
    ctx.fillText('GAME OVER', LOGICAL_W/2+ox, 130+oy);
  }
  // Texto principal en rojo brillante
  ctx.fillStyle = '#f00';
  ctx.fillText('GAME OVER', LOGICAL_W/2, 130);

  // ─── ESTADÍSTICAS DE LA PARTIDA ───
  ctx.fillStyle = '#fff';
  ctx.font = '22px monospace';
  // Puntuación final (formateada a 6 dígitos)
  ctx.fillText('SCORE: ' + String(gs.score).padStart(6,'0'), LOGICAL_W/2, 200);
  // Oleadas sobrevividas
  ctx.fillText('WAVES SURVIVED: ' + gs.wavesCleared, LOGICAL_W/2, 232);
  // Zombies eliminados
  ctx.fillText('ZOMBIES KILLED: ' + gs.zombiesKilled, LOGICAL_W/2, 264);

  // ─── BOTÓN "REINICIAR" ───
  // Define la posición y tamaño del botón de reinicio
  const bx = LOGICAL_W/2 - 140, by = 310, bw = 280, bh = 44;
  // Detecta si el mouse está sobre el botón (hover)
  const hoverR = mouse.x > bx && mouse.x < bx+bw && mouse.y > by && mouse.y < by+bh;
  // Color más claro si el mouse está encima
  ctx.fillStyle = hoverR ? '#8a0000' : '#500';
  ctx.fillRect(bx, by, bw, bh);
  ctx.strokeStyle = '#f00'; ctx.lineWidth=2;
  ctx.strokeRect(bx, by, bw, bh);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 18px monospace';
  ctx.fillText('PRESS R TO RESTART', LOGICAL_W/2, by+29);

  // ─── BOTÓN "MENÚ PRINCIPAL" ───
  // Define la posición y tamaño del botón de menú principal
  const bx2 = LOGICAL_W/2 - 140, by2 = by + 58, bw2 = 280, bh2 = 44;
  // Detecta hover para este botón
  const hoverM = mouse.x > bx2 && mouse.x < bx2+bw2 && mouse.y > by2 && mouse.y < by2+bh2;
  // Color azul que se aclara al pasar el mouse
  ctx.fillStyle = hoverM ? '#2a4a6a' : '#1a2a3a';
  ctx.fillRect(bx2, by2, bw2, bh2);
  ctx.strokeStyle = '#4a8aff'; ctx.lineWidth=2;
  ctx.strokeRect(bx2, by2, bw2, bh2);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 18px monospace';
  ctx.fillText('MAIN MENU', LOGICAL_W/2, by2+29);

  // Restablece la alineación del texto a la izquierda
  ctx.textAlign = 'left';
}

// ─── CARTEL DE OLEADA COMPLETADA ───
// Muestra un banner con efecto de escala cuando el jugador completa una oleada
// El banner crece desde el centro (efecto de zoom) y muestra el mensaje según el número de oleada
function drawWaveCompleteBanner(gs) {
  // Escala actual del banner (para la animación de crecimiento)
  const sc = gs.waveBannerScale;
  // Tiempo restante para que desaparezca el banner
  const t = Math.ceil(gs.waveCompleteTimer);

  ctx.save();
  // Fondo semitransparente que oscurece la pantalla
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);

  // Centra el banner y aplica la escala para la animación
  ctx.translate(LOGICAL_W / 2, LOGICAL_H / 2);
  ctx.scale(sc, sc);

  // Fondo del banner (rectángulo oscuro)
  const bw = 500, bh = 200;
  ctx.fillStyle = '#0d0d0d';
  ctx.fillRect(-bw/2, -bh/2, bw, bh);
  // Borde del banner en color naranja
  ctx.strokeStyle = '#ffb833';
  ctx.lineWidth = 2;
  ctx.strokeRect(-bw/2, -bh/2, bw, bh);

  // ─── TEXTO PRINCIPAL ───
  ctx.textAlign = 'center';
  // Sombra del texto (desplazada para efecto 3D)
  ctx.shadowColor = 'rgba(255,184,51,0.3)';
  ctx.shadowBlur = 0;
  ctx.font = 'bold 52px monospace';
  ctx.fillStyle = 'rgba(255,184,51,0.3)';
  ctx.fillText('WAVE ' + (gs.wave) + ' COMPLETE', 2, -45);
  // Texto principal en naranja
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#ffb833';
  ctx.fillText('WAVE ' + (gs.wave) + ' COMPLETE', 0, -47);

  // Mensaje descriptivo de la oleada (varía según el número de oleada)
  ctx.fillStyle = '#ffffff';
  ctx.font = 'italic 18px monospace';
  ctx.fillText(getWaveMessage(gs.wave), 0, 10);

  // Tiempo restante para la siguiente oleada
  ctx.fillStyle = '#aaaaaa';
  ctx.font = '16px monospace';
  const secs = Math.max(0, Math.ceil(gs.waveCompleteTimer));
  ctx.fillText('Next wave in: ' + secs + '...', 0, 55);

  ctx.restore();
  ctx.textAlign = 'left';
}

// ─── ANUNCIO DE NUEVA OLEADA ───
// Muestra el número de oleada con un efecto de aparición (fade in/out)
// Se activa al comienzo de cada oleada y se desvanece gradualmente
function drawWaveAnnouncement(gs) {
  // Si no hay anuncio activo, sale de la función
  if (!gs.waveAnnouncement || !gs.waveAnnouncement.active) return;
  // Opacidad actual del anuncio (para el fade)
  const op = gs.waveAnnouncement.opacity;
  if (op <= 0) return;

  ctx.save();
  // Aplica la opacidad global al anuncio
  ctx.globalAlpha = op;
  ctx.textAlign = 'center';
  // Muestra "WAVE X" en rojo con fuente grande
  ctx.fillStyle = '#cc0000';
  ctx.font = 'bold 64px monospace';
  ctx.fillText('WAVE ' + gs.waveAnnouncement.wave, LOGICAL_W / 2, 100);
  ctx.restore();
  ctx.textAlign = 'left';
}

// ─── ANUNCIO DE JEFE ───
// Muestra un cartel especial cuando aparece un jefe (cada 5 oleadas)
// Tiene efecto de pulso (parpadeo) y sombra roja brillante en el texto
function drawBossAnnouncement(gs) {
  // Si no hay anuncio de jefe activo, sale de la función
  if (!gs.bossAnnouncement || !gs.bossAnnouncement.active) return;
  const op = gs.bossAnnouncement.opacity;
  if (op <= 0) return;

  // Efecto de pulso para que el anuncio parpadee
  const pulse = 0.85 + Math.sin(Date.now() * 0.005) * 0.15;

  ctx.save();
  // Aplica opacidad combinada con el pulso
  ctx.globalAlpha = op * pulse;
  ctx.textAlign = 'center';

  // Barra roja oscura de fondo
  ctx.fillStyle = 'rgba(139,0,0,0.85)';
  ctx.fillRect(0, 40, LOGICAL_W, 80);

  // Texto "BOSS WAVE" con brillo rojo (sombra)
  ctx.shadowColor = '#ff0000';
  ctx.shadowBlur = 20;
  ctx.fillStyle = '#ff0000';
  ctx.font = 'bold 36px monospace';
  ctx.fillText('\u26A0 BOSS WAVE \u26A0', LOGICAL_W / 2, 82);

  // Quita la sombra para el mensaje secundario
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#ffcccc';
  ctx.font = 'italic 18px monospace';
  ctx.fillText('A giant has risen. Survive.', LOGICAL_W / 2, 112);

  ctx.restore();
  ctx.textAlign = 'left';
}

// ─── SUPERPOSICIÓN DE PAUSA ───
// Muestra el menú de pausa con opciones: Reanudar, Opciones (volumen) y Volver al Menú
// Los botones se detectan por clic del mouse; las opciones de volumen se expanden al
// hacer clic en "OPCIONES"
function drawPauseOverlay(gs) {
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);

  ctx.textAlign = 'center';

  // Título PAUSED
  ctx.shadowColor = '#000';
  ctx.shadowBlur = 20;
  ctx.fillStyle = '#ffb833';
  ctx.font = 'bold 52px monospace';
  ctx.fillText('PAUSED', LOGICAL_W / 2, 110);
  ctx.shadowBlur = 0;

  const bw = 280, bh = 44;
  const bx = LOGICAL_W / 2 - bw / 2;
  const optionsOpen = gs._pauseOptionsOpen === true;

  // ─── BOTÓN: REANUDAR ───
  const by1 = 160;
  const hov1 = mouse.x > bx && mouse.x < bx+bw && mouse.y > by1 && mouse.y < by1+bh;
  ctx.fillStyle = hov1 ? '#6a4000' : '#3a2200';
  ctx.beginPath(); ctx.roundRect(bx, by1, bw, bh, 6); ctx.fill();
  ctx.strokeStyle = '#ffb833'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect(bx, by1, bw, bh, 6); ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 17px monospace';
  ctx.fillText('▶  REANUDAR', LOGICAL_W / 2, by1 + 29);

  // ─── BOTÓN: OPCIONES ───
  const by2 = by1 + bh + 8;
  const optH = optionsOpen ? 160 : bh;
  const hov2 = mouse.x > bx && mouse.x < bx+bw && mouse.y > by2 && mouse.y < by2+optH;
  ctx.fillStyle = hov2 ? '#2a4a3a' : '#1a2a1a';
  ctx.beginPath(); ctx.roundRect(bx, by2, bw, optH, 6); ctx.fill();
  ctx.strokeStyle = '#4aff8a'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect(bx, by2, bw, optH, 6); ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 17px monospace';
  ctx.fillText('🔊  OPCIONES', LOGICAL_W / 2, by2 + 29);

  // Controles de volumen (solo si OPCIONES está expandido)
  if (optionsOpen) {
    const mVol = typeof masterVolume !== 'undefined' ? masterVolume : 1;
    const sVol = typeof sfxVolume !== 'undefined' ? sfxVolume : 1;
    const barW = bw - 60, barH = 12;
    const drawVolSlider = function(label, vol, barY, minusKey, plusKey) {
      // Etiqueta
      ctx.fillStyle = '#aaa';
      ctx.font = '10px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(label, bx + 30, barY + 10);
      // Barra
      const barX = bx + 70, bw2 = barW - 40;
      ctx.fillStyle = '#333';
      ctx.beginPath(); ctx.roundRect(barX, barY + 14, bw2, barH, 6); ctx.fill();
      ctx.fillStyle = '#4aff8a';
      ctx.beginPath(); ctx.roundRect(barX, barY + 14, bw2 * vol, barH, 6); ctx.fill();
      // Texto porcentaje
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(Math.round(vol * 100) + '%', barX + bw2 / 2, barY + 24);
      // Botón −
      const btnS = 18;
      const minX = barX - btnS - 2, minY = barY + 12;
      ctx.fillStyle = '#333';
      ctx.beginPath(); ctx.roundRect(minX, minY, btnS, btnS, 4); ctx.fill();
      ctx.strokeStyle = '#666'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.roundRect(minX, minY, btnS, btnS, 4); ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('−', minX + btnS / 2, minY + btnS / 2 + 4);
      // Botón +
      const pluX = barX + bw2 + 2, pluY = minY;
      ctx.fillStyle = '#333';
      ctx.beginPath(); ctx.roundRect(pluX, pluY, btnS, btnS, 4); ctx.fill();
      ctx.strokeStyle = '#666'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.roundRect(pluX, pluY, btnS, btnS, 4); ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.fillText('+', pluX + btnS / 2, pluY + btnS / 2 + 4);
      ctx.textAlign = 'center';
      return { minus: { x: minX, y: minY, w: btnS, h: btnS }, plus: { x: pluX, y: pluY, w: btnS, h: btnS } };
    };
    // MUSIC slider
    const mBtns = drawVolSlider('MUSIC', mVol, by2 + 38, '_pauseVolMinus', '_pauseVolPlus');
    gs._pauseVolMinus = mBtns.minus;
    gs._pauseVolPlus = mBtns.plus;
    // SFX slider
    const sBtns = drawVolSlider('SFX', sVol, by2 + 68, '_pauseSfxMinus', '_pauseSfxPlus');
    gs._pauseSfxMinus = sBtns.minus;
    gs._pauseSfxPlus = sBtns.plus;

    // ─── BOTÓN: BUTTON LAYOUT ───
    const layoutBtnY = by2 + 108;
    const hovLayout = mouse.x > bx && mouse.x < bx+bw && mouse.y > layoutBtnY && mouse.y < layoutBtnY+bh;
    ctx.fillStyle = hovLayout ? '#2a4a6a' : '#1a2a3a';
    ctx.beginPath(); ctx.roundRect(bx, layoutBtnY, bw, bh, 6); ctx.fill();
    ctx.strokeStyle = '#4a8aff'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(bx, layoutBtnY, bw, bh, 6); ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 17px monospace';
    ctx.fillText('🎮  BUTTON LAYOUT', LOGICAL_W / 2, layoutBtnY + 29);
    gs._pauseLayoutBtn = { x: bx, y: layoutBtnY, w: bw, h: bh };
  }

  // ─── BOTÓN: VOLVER AL MENÚ ───
  const by3 = by2 + optH + 8;
  const hov3 = mouse.x > bx && mouse.x < bx+bw && mouse.y > by3 && mouse.y < by3+bh;
  ctx.fillStyle = hov3 ? '#5a2a2a' : '#3a1a1a';
  ctx.beginPath(); ctx.roundRect(bx, by3, bw, bh, 6); ctx.fill();
  ctx.strokeStyle = '#ff4a4a'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect(bx, by3, bw, bh, 6); ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 17px monospace';
  ctx.fillText('🏠  VOLVER AL MENÚ', LOGICAL_W / 2, by3 + 29);

  // Guarda bounds de los botones principales para detección de clics
  gs._pauseBtns = {
    resume: { x: bx, y: by1, w: bw, h: bh },
    options: { x: bx, y: by2, w: bw, h: optH },
    menu: { x: bx, y: by3, w: bw, h: bh }
  };

  ctx.restore();
  ctx.textAlign = 'left';
}

// ─── OVERLAY DE OPCIONES EN PANTALLA DE TÍTULO ───
// Panel con controles de volumen MUSIC y SFX accesible desde el título (móvil)
function drawTitleOptions() {
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.75)';
  ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
  ctx.textAlign = 'center';

  const pw = 280, ph = 200;
  const px = LOGICAL_W / 2 - pw / 2, py = LOGICAL_H / 2 - ph / 2 - 20;
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath(); ctx.roundRect(px, py, pw, ph, 10); ctx.fill();
  ctx.strokeStyle = '#4aff8a'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect(px, py, pw, ph, 10); ctx.stroke();

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 18px monospace';
  ctx.fillText('OPCIONES', LOGICAL_W / 2, py + 30);

  // Helper para dibujar un slider (label + − barra +)
  const drawSlider = function(label, vol, rowY) {
    ctx.fillStyle = '#aaa';
    ctx.font = '11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(label, px + 20, rowY + 14);
    const btnS = 18;
    const cLeft = px + 70;
    const cRight = px + pw - 12;
    const avail = cRight - cLeft;
    const barW = avail - btnS * 2 - 8;
    // Minus
    let mx = cLeft, my = rowY;
    ctx.fillStyle = '#333';
    ctx.beginPath(); ctx.roundRect(mx, my, btnS, btnS, 4); ctx.fill();
    ctx.strokeStyle = '#666'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.roundRect(mx, my, btnS, btnS, 4); ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('−', mx + btnS / 2, my + btnS / 2 + 5);
    // Plus
    let px2 = cRight - btnS, py2 = my;
    ctx.fillStyle = '#333';
    ctx.beginPath(); ctx.roundRect(px2, py2, btnS, btnS, 4); ctx.fill();
    ctx.strokeStyle = '#666'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.roundRect(px2, py2, btnS, btnS, 4); ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.fillText('+', px2 + btnS / 2, py2 + btnS / 2 + 5);
    // Bar
    const barX = mx + btnS + 4, barY = rowY + 3;
    ctx.fillStyle = '#333';
    ctx.beginPath(); ctx.roundRect(barX, barY, barW, 12, 6); ctx.fill();
    ctx.fillStyle = '#4aff8a';
    ctx.beginPath(); ctx.roundRect(barX, barY, barW * vol, 12, 6); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(Math.round(vol * 100) + '%', barX + barW / 2, barY + 10);
    return { minus: { x: mx, y: my, w: btnS, h: btnS }, plus: { x: px2, y: py2, w: btnS, h: btnS } };
  };

  const mVol = typeof masterVolume !== 'undefined' ? masterVolume : 1;
  const mBtns = drawSlider('MUSIC', mVol, py + 46);
  _titleMusicMinus = mBtns.minus;
  _titleMusicPlus = mBtns.plus;

  const sVol = typeof sfxVolume !== 'undefined' ? sfxVolume : 1;
  const sBtns = drawSlider('SFX', sVol, py + 76);
  _titleSfxMinus = sBtns.minus;
  _titleSfxPlus = sBtns.plus;

  // BACK button
  const bkW = 120, bkH = 36;
  const bkx = LOGICAL_W / 2 - bkW / 2, bky = py + ph - 50;
  const hovBk = mouse.x > bkx && mouse.x < bkx + bkW && mouse.y > bky && mouse.y < bky + bkH;
  ctx.fillStyle = hovBk ? '#5a2a2a' : '#3a1a1a';
  ctx.beginPath(); ctx.roundRect(bkx, bky, bkW, bkH, 6); ctx.fill();
  ctx.strokeStyle = '#ff4a4a'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect(bkx, bky, bkW, bkH, 6); ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 14px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('VOLVER', LOGICAL_W / 2, bky + 24);
  _titleOptsBack = { x: bkx, y: bky, w: bkW, h: bkH };

  ctx.restore();
  ctx.textAlign = 'left';
}

// ─── [NEW] LAYOUT EDITOR ───
// Permite al jugador mover y redimensionar los botones táctiles
const _BTN_NAMES = ['shoot','jump','sprint','switch','reload','knife','grenade','board'];
const _BTN_LABELS = ['FIRE','JUMP','RUN','GUN','RLD','KNIFE','GREN','BOARD'];
const _BTN_PROPS = [
  () => ({ x: BTN_SHOOT_X, y: BTN_SHOOT_Y, r: BTN_SHOOT_R }),
  (x,y,r) => { BTN_SHOOT_X=x; BTN_SHOOT_Y=y; BTN_SHOOT_R=r; },
  () => ({ x: BTN_JUMP_X, y: BTN_JUMP_Y, r: BTN_JUMP_R }),
  (x,y,r) => { BTN_JUMP_X=x; BTN_JUMP_Y=y; BTN_JUMP_R=r; },
  () => ({ x: BTN_SPRINT_X, y: BTN_SPRINT_Y, r: BTN_SPRINT_R }),
  (x,y,r) => { BTN_SPRINT_X=x; BTN_SPRINT_Y=y; BTN_SPRINT_R=r; },
  () => ({ x: BTN_SWITCH_X, y: BTN_SWITCH_Y, r: BTN_SWITCH_R }),
  (x,y,r) => { BTN_SWITCH_X=x; BTN_SWITCH_Y=y; BTN_SWITCH_R=r; },
  () => ({ x: BTN_RELOAD_X, y: BTN_RELOAD_Y, r: BTN_RELOAD_R }),
  (x,y,r) => { BTN_RELOAD_X=x; BTN_RELOAD_Y=y; BTN_RELOAD_R=r; },
  () => ({ x: BTN_KNIFE_X, y: BTN_KNIFE_Y, r: BTN_KNIFE_R }),
  (x,y,r) => { BTN_KNIFE_X=x; BTN_KNIFE_Y=y; BTN_KNIFE_R=r; },
  () => ({ x: BTN_GRENADE_X, y: BTN_GRENADE_Y, r: BTN_GRENADE_R }),
  (x,y,r) => { BTN_GRENADE_X=x; BTN_GRENADE_Y=y; BTN_GRENADE_R=r; },
  () => ({ x: BTN_BOARD_X, y: BTN_BOARD_Y, r: BTN_BOARD_R }),
  (x,y,r) => { BTN_BOARD_X=x; BTN_BOARD_Y=y; BTN_BOARD_R=r; },
];
function getBtnProps(i) { return _BTN_PROPS[i*2](); }
function setBtnProps(i, x, y, r) { _BTN_PROPS[i*2+1](x,y,r); }

function drawLayoutEditor(gs) {
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);

  ctx.textAlign = 'center';

  // ─── TÍTULO ───
  ctx.fillStyle = '#4aff8a';
  ctx.font = 'bold 30px monospace';
  ctx.fillText('BUTTON LAYOUT', LOGICAL_W/2, 55);

  // ─── BOTONES DE SELECCIÓN ───
  const idx = gs._layoutEditIdx || 0;
  const selW = LOGICAL_W / 8;
  ctx.font = 'bold 11px monospace';
  for (let i = 0; i < 8; i++) {
    const sx = i * selW, sy = 75, sw = selW - 4, sh = 28;
    const sel = i === idx;
    const hov = mouse.x > sx && mouse.x < sx+sw && mouse.y > sy && mouse.y < sy+sh;
    ctx.fillStyle = sel ? '#4aff8a' : hov ? '#2a4a3a' : '#1a2a1a';
    ctx.beginPath(); ctx.roundRect(sx+2, sy, sw, sh, 4); ctx.fill();
    ctx.strokeStyle = sel ? '#4aff8a' : '#333';
    ctx.lineWidth = sel ? 2 : 1;
    ctx.beginPath(); ctx.roundRect(sx+2, sy, sw, sh, 4); ctx.stroke();
    ctx.fillStyle = sel ? '#000' : '#ccc';
    ctx.fillText(_BTN_LABELS[i], sx + sw/2 + 2, sy + 19);
    // Guarda bounds
    gs['_layoutBtn_' + i] = { x: sx+2, y: sy, w: sw, h: sh };
  }

  // ─── INFORMACIÓN DEL BOTÓN SELECCIONADO ───
  const bp = getBtnProps(idx);
  ctx.fillStyle = '#fff';
  ctx.font = '16px monospace';
  ctx.fillText(_BTN_LABELS[idx] + '  X:' + bp.x + '  Y:' + bp.y + '  R:' + bp.r, LOGICAL_W/2, 120);

  // ─── CONTROLES ───
  // Flechas X (← X →)
  const ctrY = 145, ctrGap = 80;
  const ctrCX = LOGICAL_W / 2;
  // ←
  const lx = ctrCX - ctrGap - 22, ly = ctrY, lw = 44, lh = 30;
  const hovL = mouse.x > lx && mouse.x < lx+lw && mouse.y > ly && mouse.y < ly+lh;
  ctx.fillStyle = hovL ? '#555' : '#222';
  ctx.beginPath(); ctx.roundRect(lx, ly, lw, lh, 4); ctx.fill();
  ctx.strokeStyle = '#888'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.roundRect(lx, ly, lw, lh, 4); ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.font = 'bold 16px monospace';
  ctx.fillText('←', lx + lw/2, ly + 20);
  gs._layoutArrowL = { x: lx, y: ly, w: lw, h: lh };
  // X label
  ctx.fillStyle = '#aaa'; ctx.font = '12px monospace';
  ctx.fillText('X', ctrCX, ctrY + 20);
  // →
  const rx = ctrCX + ctrGap - 22;
  const hovR = mouse.x > rx && mouse.x < rx+lw && mouse.y > ly && mouse.y < ly+lh;
  ctx.fillStyle = hovR ? '#555' : '#222';
  ctx.beginPath(); ctx.roundRect(rx, ly, lw, lh, 4); ctx.fill();
  ctx.strokeStyle = '#888'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.roundRect(rx, ly, lw, lh, 4); ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.fillText('→', rx + lw/2, ly + 20);
  gs._layoutArrowR = { x: rx, y: ly, w: lw, h: lh };

  // Flechas Y (↑ Y ↓)
  const ctrY2 = ctrY + 40;
  // ↑
  const ux = ctrCX - ctrGap - 22, uy = ctrY2;
  const hovU = mouse.x > ux && mouse.x < ux+lw && mouse.y > uy && mouse.y < uy+lh;
  ctx.fillStyle = hovU ? '#555' : '#222';
  ctx.beginPath(); ctx.roundRect(ux, uy, lw, lh, 4); ctx.fill();
  ctx.strokeStyle = '#888'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.roundRect(ux, uy, lw, lh, 4); ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.fillText('↑', ux + lw/2, uy + 20);
  gs._layoutArrowU = { x: ux, y: uy, w: lw, h: lh };
  // Y label
  ctx.fillStyle = '#aaa'; ctx.font = '12px monospace';
  ctx.fillText('Y', ctrCX, ctrY2 + 20);
  // ↓
  const dx2 = ctrCX + ctrGap - 22;
  const hovD = mouse.x > dx2 && mouse.x < dx2+lw && mouse.y > uy && mouse.y < uy+lh;
  ctx.fillStyle = hovD ? '#555' : '#222';
  ctx.beginPath(); ctx.roundRect(dx2, uy, lw, lh, 4); ctx.fill();
  ctx.strokeStyle = '#888'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.roundRect(dx2, uy, lw, lh, 4); ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.fillText('↓', dx2 + lw/2, uy + 20);
  gs._layoutArrowD = { x: dx2, y: uy, w: lw, h: lh };

  // Radius controls (− R +)
  const ctrY3 = ctrY2 + 40;
  // −
  const minX = ctrCX - ctrGap - 22, minY = ctrY3;
  const hovMin = mouse.x > minX && mouse.x < minX+lw && mouse.y > minY && mouse.y < minY+lh;
  ctx.fillStyle = hovMin ? '#553333' : '#331111';
  ctx.beginPath(); ctx.roundRect(minX, minY, lw, lh, 4); ctx.fill();
  ctx.strokeStyle = '#aa4444'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.roundRect(minX, minY, lw, lh, 4); ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.fillText('−', minX + lw/2, minY + 20);
  gs._layoutRadiusMinus = { x: minX, y: minY, w: lw, h: lh };
  // R label
  ctx.fillStyle = '#aaa'; ctx.font = '12px monospace';
  ctx.fillText('R', ctrCX, ctrY3 + 20);
  // +
  const plusX = ctrCX + ctrGap - 22;
  const hovPlus = mouse.x > plusX && mouse.x < plusX+lw && mouse.y > minY && mouse.y < minY+lh;
  ctx.fillStyle = hovPlus ? '#335533' : '#112211';
  ctx.beginPath(); ctx.roundRect(plusX, minY, lw, lh, 4); ctx.fill();
  ctx.strokeStyle = '#44aa44'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.roundRect(plusX, minY, lw, lh, 4); ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.fillText('+', plusX + lw/2, minY + 20);
  gs._layoutRadiusPlus = { x: plusX, y: minY, w: lw, h: lh };

  // ─── BOTONES INFERIORES ───
  const bBotY = 270;
  const bBotW = 160, bBotH = 38, bBotGap = 20;
  const bBotX1 = LOGICAL_W/2 - bBotW*1.5 - bBotGap;
  const bBotX2 = LOGICAL_W/2 - bBotW/2;
  const bBotX3 = LOGICAL_W/2 + bBotW/2 + bBotGap;

  // SAVE
  const hovSave = mouse.x > bBotX1 && mouse.x < bBotX1+bBotW && mouse.y > bBotY && mouse.y < bBotY+bBotH;
  ctx.fillStyle = hovSave ? '#2a6a2a' : '#1a4a1a';
  ctx.beginPath(); ctx.roundRect(bBotX1, bBotY, bBotW, bBotH, 6); ctx.fill();
  ctx.strokeStyle = '#4aff8a'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect(bBotX1, bBotY, bBotW, bBotH, 6); ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.font = 'bold 16px monospace';
  ctx.fillText('SAVE', bBotX1 + bBotW/2, bBotY + 25);
  gs._layoutSave = { x: bBotX1, y: bBotY, w: bBotW, h: bBotH };

  // RESET
  const hovReset = mouse.x > bBotX2 && mouse.x < bBotX2+bBotW && mouse.y > bBotY && mouse.y < bBotY+bBotH;
  ctx.fillStyle = hovReset ? '#5a4a2a' : '#3a2a1a';
  ctx.beginPath(); ctx.roundRect(bBotX2, bBotY, bBotW, bBotH, 6); ctx.fill();
  ctx.strokeStyle = '#ffb833'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect(bBotX2, bBotY, bBotW, bBotH, 6); ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.fillText('RESET', bBotX2 + bBotW/2, bBotY + 25);
  gs._layoutReset = { x: bBotX2, y: bBotY, w: bBotW, h: bBotH };

  // BACK
  const hovBack = mouse.x > bBotX3 && mouse.x < bBotX3+bBotW && mouse.y > bBotY && mouse.y < bBotY+bBotH;
  ctx.fillStyle = hovBack ? '#5a2a2a' : '#3a1a1a';
  ctx.beginPath(); ctx.roundRect(bBotX3, bBotY, bBotW, bBotH, 6); ctx.fill();
  ctx.strokeStyle = '#ff4a4a'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect(bBotX3, bBotY, bBotW, bBotH, 6); ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.fillText('BACK', bBotX3 + bBotW/2, bBotY + 25);
  gs._layoutBack = { x: bBotX3, y: bBotY, w: bBotW, h: bBotH };

  ctx.restore();
  ctx.textAlign = 'left';
}
