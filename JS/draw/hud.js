// ─── HUD (INTERFAZ DE USUARIO) ───
// Muestra toda la información en pantalla: vida, puntuación, oleada, munición, armas, granadas, power-ups, etc.
// Recibe el estado global del juego (gs) para acceder a todos los datos del jugador y la partida
// Esta función se dibuja en coordenadas de pantalla fijas (no afectadas por la cámara)
function drawHUD(gs) {
  // Obtiene la referencia al jugador desde el estado global del juego
  const p = gs.player;
  // Guarda el estado actual del contexto de dibujo para restaurarlo después
  ctx.save();

  // ─── BARRA DE VIDA ───
  // Dibuja el fondo oscuro de la barra de vida (rectángulo de 120px de ancho)
  ctx.fillStyle = '#222';
  ctx.fillRect(14, 14, 120, 14);
  // Elige el color de la vida según la cantidad: verde >50, naranja >25, rojo <=25
  const hpColor = p.hp > 50 ? '#30e030' : p.hp > 25 ? '#e09020' : '#e03030';
  // Dibuja 10 segmentos individuales que representan la vida (cada segmento = 10 HP)
  for (let i=0; i<10; i++) {
    // Solo pinta los segmentos que corresponden a la vida actual del jugador
    if (i < Math.ceil(p.hp/10)) {
      ctx.fillStyle = hpColor;
      ctx.fillRect(15+i*12, 15, 10, 12);
    }
  }
  // Dibuja el borde de la barra de vida
  ctx.strokeStyle = '#555'; ctx.lineWidth=1;
  ctx.strokeRect(14, 14, 120, 14);
  // Muestra el texto "HP" al lado de la barra
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 10px monospace';
  ctx.fillText('HP', 140, 25);

  // ─── PUNTUACIÓN ───
  // Muestra la puntuación actual centrada en la pantalla, con formato de 6 dígitos (ej. 000500)
  ctx.fillStyle = '#00ff88';
  ctx.font = 'bold 14px monospace';
  ctx.fillText('SCORE: ' + String(gs.score).padStart(6,'0'), LOGICAL_W / 2, 50);

  // ─── OLEADA (parpadea en rojo si es pesadilla, oleada >= 10) ───
  // Cambia la alineación del texto a centrado para los elementos del medio
  ctx.textAlign = 'center';
  // Comprueba si la oleada actual es modo pesadilla (oleada 10 o superior)
  const isNightmare = gs.wave >= 10;
  // Si es modo pesadilla, el texto parpadea en rojo cada 500ms
  if (isNightmare && Date.now() % 500 < 250) {
    ctx.fillStyle = '#ff0000';
  } else {
    ctx.fillStyle = '#ffb833';
  }
  ctx.font = 'bold 16px monospace';
  ctx.fillText('WAVE ' + gs.wave, LOGICAL_W / 2, 18);

  // ─── ENEMIGOS RESTANTES ───
  // Cuenta cuántos zombies siguen vivos (no muertos)
  const alive = gs.zombies.filter(z=>!z.dead).length;
  // Cuenta si el jefe sigue vivo (1 o 0)
  const bossAlive = gs.boss && !gs.boss.dead ? 1 : 0;
  // Total de enemigos: vivos + pendientes de aparecer + jefe
  const remaining = alive + gs.zombiesToSpawn.length + bossAlive;
  // Cambia a verde si no quedan enemigos, blanco si aún hay
  ctx.fillStyle = remaining === 0 ? '#44ff44' : '#ffffff';
  ctx.font = '12px monospace';
  // Muestra el icono de calavera (☠) seguido del número de enemigos restantes
  ctx.fillText('\u2620 ' + remaining + ' remaining', LOGICAL_W / 2, 34);

  // ─── BARRA DE PROGRESO DE LA OLEADA ───
  // Calcula el progreso como la proporción de zombies eliminados vs total de la oleada
  const progress = gs.zombiesTotalThisWave > 0 ? Math.min(1, gs.zombiesKilledThisWave / gs.zombiesTotalThisWave) : 0;
  // Fondo oscuro de la barra de progreso
  ctx.fillStyle = '#333';
  ctx.fillRect(LOGICAL_W / 2 - 100, 38, 200, 6);
  // Barra de progreso roja que se llena según el avance
  ctx.fillStyle = '#cc0000';
  ctx.fillRect(LOGICAL_W / 2 - 100, 38, 200 * progress, 6);

  // ─── MUNICIÓN (parpadea si quedan 3 o menos balas) ───
  // Referencia al arma actual del jugador para acceder a nombre y capacidad
  const w = p.weapon;
  // Si quedan 3 o menos balas, el texto parpadea entre rojo y naranja cada 500ms
  const ammoColor = p.ammo <= 3 ? (Date.now()%500<250 ? '#f00' : '#fa0') : '#fff';
  // Alinea el texto a la derecha para la sección de munición
  ctx.textAlign = 'right';
  ctx.fillStyle = ammoColor;
  ctx.font = 'bold 16px monospace';
  // Muestra "RELOADING..." si está recargando, o "balas / total" si no
  ctx.fillText((p.reloading ? 'RELOADING...' : p.ammo + ' / ' + p.totalAmmo), LOGICAL_W - 50, 28);
  // Muestra el nombre del arma actual debajo de la munición
  ctx.fillStyle = '#aaa';
  ctx.font = '11px monospace';
  ctx.fillText(w.name, LOGICAL_W - 50, 44);

  // ─── SELECCIÓN DE ARMAS (ranuras 1 y 2) ───
  // Alinea el texto a la izquierda para el panel de armas
  ctx.textAlign = 'left';
  // Fondo semitransparente del panel de selección de armas
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(14, LOGICAL_H-66, 150, 52);
  // Borde del panel
  ctx.strokeStyle = '#444'; ctx.lineWidth=1;
  ctx.strokeRect(14, LOGICAL_H-66, 150, 52);
  // Obtiene los nombres de las dos armas asignadas a las ranuras del jugador
  const wNames = [WEAPONS[p.slotWeaponIndices ? p.slotWeaponIndices[0] : 0].name, WEAPONS[p.slotWeaponIndices ? p.slotWeaponIndices[1] : 1].name];
  // Itera sobre las 2 ranuras de armas para mostrarlas
  for (let i=0; i<2; i++) {
    // La ranura activa se muestra en naranja, la inactiva en gris
    ctx.fillStyle = p.weaponIndex===i ? '#ffb833' : '#666';
    ctx.font = (p.weaponIndex===i ? 'bold' : 'normal') + ' 12px monospace';
    // Muestra una flecha (▶) junto al arma activa
    ctx.fillText((p.weaponIndex===i?'\u25B6 ':' ') + wNames[i], 22, LOGICAL_H-50+i*15);
  }
  // ─── GRANADA ───
  // Tiempo restante de enfriamiento de la granada (redondeado hacia arriba)
  const gcd = Math.ceil(p.grenadeCooldown);
  // Si el enfriamiento terminó, se muestra naranja; si no, gris
  ctx.fillStyle = p.grenadeCooldown <= 0 ? '#ff8800' : '#555';
  ctx.font = '11px monospace';
  // Muestra "[G] GRENADE" si está lista, o "[G] Xs" con los segundos restantes
  ctx.fillText('[G] ' + (p.grenadeCooldown <= 0 ? 'GRENADE' : gcd + 's'), 22, LOGICAL_H-22);

  // ─── BARRA DE VIDA DEL JEFE ───
  // Solo se muestra si hay un jefe vivo
  if (gs.boss && !gs.boss.dead) {
    // Dimensiones y posición de la barra de vida del jefe
    const bw = 200, bh = 16;
    const bx = LOGICAL_W / 2 - bw / 2;
    const by = LOGICAL_H - 60;
    // Fondo oscuro con borde para el panel del jefe
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(bx - 58, by - 2, bw + 64, bh + 4);
    ctx.strokeStyle = '#8aff00';
    ctx.lineWidth = 1;
    ctx.strokeRect(bx - 58, by - 2, bw + 64, bh + 4);
    // Etiqueta "BOSS" al lado izquierdo de la barra
    ctx.fillStyle = '#ff0000';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'right';
    ctx.fillText('BOSS', bx - 6, by + 12);
    ctx.textAlign = 'left';
    // Proporción de vida restante del jefe (0 a 1)
    const hpRatio = gs.boss.hp / gs.boss.maxHp;
    // Fondo oscuro de la barra de vida
    ctx.fillStyle = '#400000';
    ctx.fillRect(bx, by, bw, bh);
    // Color de la barra: cambia según la vida restante
    let barColor = '#ff2200';
    if (hpRatio < 0.25) barColor = '#ffff00';    // menos del 25% → amarillo
    else if (hpRatio < 0.5) barColor = '#ff8800'; // menos del 50% → naranja
    ctx.fillStyle = barColor;
    ctx.fillRect(bx, by, bw * hpRatio, bh);
    // Borde de la barra de vida
    ctx.strokeStyle = '#ff6600';
    ctx.lineWidth = 1;
    ctx.strokeRect(bx, by, bw, bh);
  }

  // ─── PARPADEO ROJO AL RECIBIR DAÑO ───
  // Si el jugador acaba de recibir daño, se muestra un destello rojo semitransparente
  if (gs.damageFlash > 0) {
    ctx.fillStyle = `rgba(200,0,0,${gs.damageFlash * 0.35})`;
    ctx.fillRect(0,0,LOGICAL_W,LOGICAL_H);
  }

  // ─── POWER-UPS ACTIVOS (insta-kill, doble disparo, munición infinita) ───
  // Verifica si al menos uno de los power-ups está activo
  if (p.instaKillTimer > 0 || p.doubleShotTimer > 0 || p.unlimitedAmmoTimer > 0) {
    // ─── INSTA-KILL (mata a cualquier enemigo de un solo golpe) ───
    if (p.instaKillTimer > 0) {
      // Capa de color morado parpadeante en toda la pantalla
      ctx.fillStyle = `rgba(180,0,180,${0.08 + Math.sin(Date.now() * 0.008) * 0.04})`;
      ctx.fillRect(0,0,LOGICAL_W,LOGICAL_H);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ff44ff';
      ctx.font = 'bold 12px monospace';
      // Muestra el tiempo restante del power-up con calaveras decorativas
      ctx.fillText('\u2620 INSTA-KILL ' + Math.ceil(p.instaKillTimer) + 's \u2620', LOGICAL_W / 2, 70);
      ctx.textAlign = 'left';
    }
    // ─── DOBLE DISPARO (dispara el doble de rápido) ───
    if (p.doubleShotTimer > 0) {
      // Capa de color naranja parpadeante
      ctx.fillStyle = `rgba(200,120,0,${0.06 + Math.sin(Date.now() * 0.01) * 0.03})`;
      ctx.fillRect(0,0,LOGICAL_W,LOGICAL_H);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ff8800';
      ctx.font = 'bold 12px monospace';
      // Muestra el tiempo restante con icono de espadas cruzadas
      ctx.fillText('\u2694 DOUBLE SHOT ' + Math.ceil(p.doubleShotTimer) + 's \u2694', LOGICAL_W / 2, 86);
      ctx.textAlign = 'left';
    }
    // ─── MUNICIÓN INFINITA (no gasta balas al disparar) ───
    if (p.unlimitedAmmoTimer > 0) {
      // Capa de color azul parpadeante
      ctx.fillStyle = `rgba(0,180,255,${0.06 + Math.sin(Date.now() * 0.009) * 0.03})`;
      ctx.fillRect(0,0,LOGICAL_W,LOGICAL_H);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#00ccff';
      ctx.font = 'bold 12px monospace';
      // Muestra el tiempo restante con el símbolo de infinito
      ctx.fillText('\u221E UNLIMITED AMMO ' + Math.ceil(p.unlimitedAmmoTimer) + 's \u221E', LOGICAL_W / 2, 102);
      ctx.textAlign = 'left';
    }
  }

  // ─── PUNTERO DEL RATÓN ───
  // Obtiene la posición actual del mouse
  const cx = mouse.x;
  const cy = mouse.y;
  const gWidth = LOGICAL_W;
  const gHeight = LOGICAL_H;
  // Solo dibuja el puntero si el mouse está dentro de los límites de la pantalla
  if (cx >= 0 && cx <= gWidth && cy >= 0 && cy <= gHeight) {
    ctx.save();
    // Traslada el origen al centro del cursor
    ctx.translate(cx, cy);
    // Dibuja una cruz blanca (líneas horizontal y vertical)
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-8, 0); ctx.lineTo(8, 0);
    ctx.moveTo(0, -8); ctx.lineTo(0, 8);
    ctx.stroke();
    // Dibuja un círculo rojo semitransparente en el centro
    ctx.strokeStyle = 'rgba(255,0,0,0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // ─── BOTÓN DE PAUSA ───
  // Define la posición y tamaño del botón de pausa en la esquina superior derecha
  const pauseBtn = { x: LOGICAL_W - 36, y: 10, w: 28, h: 24 };
  // Cambia el color si el juego está pausado (naranja) o no (gris semitransparente)
  ctx.fillStyle = gs.paused ? '#ffb833' : 'rgba(255,255,255,0.15)';
  ctx.strokeStyle = gs.paused ? '#ffb833' : 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 1.5;
  // Dibuja el botón con bordes redondeados (roundRect)
  ctx.beginPath(); ctx.roundRect(pauseBtn.x, pauseBtn.y, pauseBtn.w, pauseBtn.h, 4); ctx.fill(); ctx.stroke();
  ctx.fillStyle = gs.paused ? '#ffb833' : 'rgba(255,255,255,0.6)';
  ctx.font = 'bold 14px monospace';
  ctx.textAlign = 'center';
  // Dibuja el texto "II" (símbolo de pausa) dentro del botón
  ctx.fillText('II', pauseBtn.x + pauseBtn.w / 2, pauseBtn.y + 20);
  ctx.textAlign = 'left';
  // Guarda la referencia del botón en el estado global para detectar clics
  gs._pauseBtn = pauseBtn;

  // ─── MENSAJE DE MYSTERY BOX ───
  // Muestra arma disponible (gasta 12500 pts con E) o progreso hacia 12500
  const _mbx = gs.selectedMap === 2 ? (typeof _mysteryBoxX !== 'undefined' ? _mysteryBoxX : -1) : _mysteryBoxX1;
  if (_mbx > 0 && gs.state === 'playing' && typeof _mysteryBoxWeaponIdx !== 'undefined' && typeof _MYSTERY_BOX_COST !== 'undefined') {
    if (gs.selectedMap === 2 && !(gs.player.y < CABIN_CEIL_Y)) { /* no mostrar dentro de la cabina */ }
    else {
    const distX = Math.abs(gs.player.x - _mbx);
    const distY = Math.abs(gs.player.y - (gs.selectedMap === 2 ? BUS_ROOF_Y : GROUND_Y));
    if (distX < 120 && distY < 50) {
      const weaponReady = _mysteryBoxWeaponIdx >= 0;
      const canAfford = gs.score >= _MYSTERY_BOX_COST;
      ctx.textAlign = 'center';
      if (weaponReady && canAfford) {
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.beginPath(); ctx.roundRect(LOGICAL_W / 2 - 110, LOGICAL_H - 94, 220, 44, 6); ctx.fill();
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 12px monospace';
        ctx.fillText('🗲 ' + WEAPONS[_mysteryBoxWeaponIdx].name, LOGICAL_W / 2, LOGICAL_H - 75);
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = '9px monospace';
        ctx.fillText('[E] HOLD 1.5s - ' + _MYSTERY_BOX_COST + ' PTS', LOGICAL_W / 2, LOGICAL_H - 84);
        if (typeof _mysteryBoxHoldTime !== 'undefined' && _mysteryBoxHoldTime > 0) {
          const progress = Math.min(1, _mysteryBoxHoldTime / 1.5);
          ctx.fillStyle = 'rgba(0,0,0,0.6)';
          ctx.beginPath(); ctx.roundRect(LOGICAL_W / 2 - 90, LOGICAL_H - 64, 180, 10, 5); ctx.fill();
          ctx.fillStyle = '#FFD700';
          ctx.beginPath(); ctx.roundRect(LOGICAL_W / 2 - 90, LOGICAL_H - 64, 180 * progress, 10, 5); ctx.fill();
        }
      } else if (weaponReady && !canAfford) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.beginPath(); ctx.roundRect(LOGICAL_W / 2 - 100, LOGICAL_H - 86, 200, 24, 6); ctx.fill();
        ctx.fillStyle = '#ff4444';
        ctx.font = 'bold 10px monospace';
        ctx.fillText('NEED ' + Math.ceil(_MYSTERY_BOX_COST - gs.score) + ' PTS', LOGICAL_W / 2, LOGICAL_H - 71);
      } else {
        const prog = Math.min(1, Math.max(0, gs.score / _MYSTERY_BOX_COST));
        const needed = _MYSTERY_BOX_COST - gs.score;
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.beginPath(); ctx.roundRect(LOGICAL_W / 2 - 120, LOGICAL_H - 96, 240, 34, 6); ctx.fill();
        ctx.fillStyle = '#A08050';
        ctx.font = 'bold 10px monospace';
        ctx.fillText('MYSTERY BOX', LOGICAL_W / 2, LOGICAL_H - 79);
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 1;
        ctx.strokeRect(LOGICAL_W / 2 - 90, LOGICAL_H - 68, 180, 8);
        ctx.fillStyle = '#8B5E3C';
        ctx.fillRect(LOGICAL_W / 2 - 90, LOGICAL_H - 68, 180 * prog, 8);
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.font = '8px monospace';
        ctx.fillText(Math.ceil(needed) + ' pts', LOGICAL_W / 2, LOGICAL_H - 61);
      }
      ctx.textAlign = 'left';
    }
  }
  }

  // Restaura el contexto de dibujo a su estado original
  ctx.restore();
}
