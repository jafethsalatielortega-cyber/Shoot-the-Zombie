// ─── PANTALLA DE TÍTULO ───
// Dibuja la pantalla principal del juego con el título, fondo decorativo y mensajes
// Incluye siluetas de zombies animadas, edificios, manchas de sangre decorativas y el título
// El mensaje "PRESS ENTER TO START" parpadea para indicar la acción esperada
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

  // ─── CONTROLES ───
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = '13px monospace';
  ctx.fillText('WASD / Arrows: Move   Space/W: Jump   Mouse: Aim & Shoot   Q: Switch Weapon   R: Reload', LOGICAL_W/2, 340);

  // ─── MENSAJE DE INICIO (parpadeante) ───
  // Calcula un valor de pulso entre 0 y 1 usando la función seno
  const pulse = (Math.sin(t*3)+1)/2;
  // El color va cambiando de opacidad para crear un efecto de parpadeo
  ctx.fillStyle = `rgba(255,200,50,${0.5 + pulse*0.5})`;
  ctx.font = 'bold 22px monospace';
  ctx.fillText('PRESS ENTER TO START', LOGICAL_W/2, 390);

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
  const by1 = 180;
  const hov1 = mouse.x > bx && mouse.x < bx+bw && mouse.y > by1 && mouse.y < by1+bh;
  ctx.fillStyle = hov1 ? '#6a4000' : '#3a2200';
  ctx.beginPath(); ctx.roundRect(bx, by1, bw, bh, 6); ctx.fill();
  ctx.strokeStyle = '#ffb833'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect(bx, by1, bw, bh, 6); ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 17px monospace';
  ctx.fillText('▶  REANUDAR', LOGICAL_W / 2, by1 + 29);

  // ─── BOTÓN: OPCIONES ───
  const by2 = by1 + bh + 12;
  const optH = optionsOpen ? 90 : bh;
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
    const vol = typeof masterVolume !== 'undefined' ? masterVolume : 1;
    const pct = Math.round(vol * 100);

    // Barra de volumen
    const barX = bx + 30, barY = by2 + 50, barW = bw - 60, barH = 16;
    ctx.fillStyle = '#333';
    ctx.beginPath(); ctx.roundRect(barX, barY, barW, barH, 8); ctx.fill();
    ctx.fillStyle = '#4aff8a';
    ctx.beginPath(); ctx.roundRect(barX, barY, barW * vol, barH, 8); ctx.fill();

    // Texto del porcentaje
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px monospace';
    ctx.fillText(pct + '%', LOGICAL_W / 2, barY + 12);

    // Botón − (restar volumen)
    const minusX = barX - 26, minusY = barY - 2, minusS = 20;
    const hovMinus = mouse.x > minusX && mouse.x < minusX+minusS && mouse.y > minusY && mouse.y < minusY+minusS;
    ctx.fillStyle = hovMinus ? '#555' : '#222';
    ctx.beginPath(); ctx.roundRect(minusX, minusY, minusS, minusS, 4); ctx.fill();
    ctx.strokeStyle = '#888'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.roundRect(minusX, minusY, minusS, minusS, 4); ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px monospace';
    ctx.fillText('−', minusX + minusS/2, minusY + minusS/2 + 5);

    // Botón + (sumar volumen)
    const plusX = barX + barW + 6, plusY = minusY;
    const hovPlus = mouse.x > plusX && mouse.x < plusX+minusS && mouse.y > plusY && mouse.y < plusY+minusS;
    ctx.fillStyle = hovPlus ? '#555' : '#222';
    ctx.beginPath(); ctx.roundRect(plusX, plusY, minusS, minusS, 4); ctx.fill();
    ctx.strokeStyle = '#888'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.roundRect(plusX, plusY, minusS, minusS, 4); ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px monospace';
    ctx.fillText('+', plusX + minusS/2, plusY + minusS/2 + 5);

    // Guarda bounds de los botones de volumen para detección de clics
    gs._pauseVolMinus = { x: minusX, y: minusY, w: minusS, h: minusS };
    gs._pauseVolPlus = { x: plusX, y: plusY, w: minusS, h: minusS };
  }

  // ─── BOTÓN: VOLVER AL MENÚ ───
  const by3 = by2 + optH + 12;
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
