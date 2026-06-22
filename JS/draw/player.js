// ─── DIBUJAR JUGADOR ───
// Renderiza al jugador: cuerpo, estela de velocidad, cuchillo, indicador de recarga
// Parámetros: p — objeto del jugador, camX — desplazamiento de cámara
function drawPlayer(p, camX) {
  // Ajusta la posición según la cámara (desplazamiento horizontal)
  const x = p.x - camX;
  const y = p.y;
  const t = p.animTimer;
  ctx.save();

  // ─── ESTELA DE SPRINT ───
  // Al correr rápido dibuja fantasmas semitransparentes detrás del jugador
  if (p.sprinting && Math.abs(p.vx)>10) {
    // Dibuja 3 fantasmas con transparencia decreciente detrás del jugador
    for (let g=1; g<=3; g++) {
      ctx.save();
      ctx.globalAlpha = 0.07 * (4-g);          // Más opaco cerca del jugador
      ctx.translate(x - p.dir*g*8, y);           // Desplazado hacia atrás
      if (p.dir<0) ctx.scale(-1,1);              // Voltear si mira a la izquierda
      drawPlayerBody(ctx, p, t - g*0.05);        // Dibuja el fantasma con ligero retraso
      ctx.restore();
    }
  }

  // ─── CUERPO PRINCIPAL ───
  ctx.translate(x, y);
  if (p.dir < 0) ctx.scale(-1, 1);  // Voltea horizontalmente si mira a la izquierda
  drawPlayerBody(ctx, p, t);
  ctx.restore();

  // ─── ATAQUE DE CUCHILLO ───
  // Dibuja una línea blanca simulando el cuchillo cuando ataca
  if (p.knifeTimer > 0) {
    ctx.save();
    // Posición del cuchillo: adelante del jugador según la dirección
    const kx = x + p.dir * 20;
    const ky = y - 20;
    // Hoja del cuchillo (línea blanca)
    ctx.strokeStyle = '#c0c0c0';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(kx, ky);
    ctx.lineTo(kx + p.dir * 25, ky);
    ctx.stroke();
    // Mango del cuchillo (línea más gruesa y oscura)
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(kx + p.dir * 10, ky - 2);
    ctx.lineTo(kx + p.dir * 10, ky + 2);
    ctx.stroke();
    ctx.restore();
  }

  // ─── INDICADOR DE RECARGA ───
  // Círculo de progreso sobre la cabeza del jugador mientras recarga
  if (p.reloading) {
    // Calcula el progreso de la recarga (0 = empezando, 1 = completa)
    const prog = 1 - (p.reloadTimer / p.weapon.reloadTime);
    ctx.save();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    // Dibuja un arco que se va cerrando (círculo de progreso)
    ctx.beginPath();
    ctx.arc(x, y - 55, 14, -Math.PI/2, -Math.PI/2 + prog*Math.PI*2);
    ctx.stroke();
    ctx.restore();
  }
}

// ─── DIBUJAR CUERPO DEL JUGADOR ───
// Dibuja piernas, torso, brazos, cabeza y el arma que lleva
// Parámetros: contexto de dibujo, objeto del jugador, temporizador de animación (segundos)
function drawPlayerBody(ctx, p, t) {
  // Oscilación leve de idle (respiración) usando seno del tiempo
  const idle = Math.sin(t*2) * 1;
  // Rotación y caída al morir (se inclina hasta 90 grados)
  const dead = p.dead ? Math.min(p.deathTimer/1.2, 1) * Math.PI/2 : 0;
  // Si está muerto, rota el cuerpo y lo desplaza hacia abajo
  if (dead > 0) {
    ctx.rotate(dead);
    ctx.translate(0, dead * 20);
  }

  // ─── PIERNAS ───
  // La fase de animación de piernas depende de si está en el suelo y moviéndose
  const legPhase = (p.onGround && Math.abs(p.vx)>20) ? t*8 : 0;
  // Si está saltando las piernas se encogen, si no, se mueven alternadamente
  const legOff1 = p.jumping ? -3 : Math.sin(legPhase)*8;
  const legOff2 = p.jumping ? -3 : Math.sin(legPhase+Math.PI)*8;

  // Pantalones (color azul oscuro)
  ctx.fillStyle = '#2a2a3a';
  ctx.fillRect(-6, idle+10, 10, 18+legOff1);   // Pierna izquierda
  ctx.fillRect(-2, idle+10, 10, 18+legOff2);   // Pierna derecha
  // Botas (color marrón)
  ctx.fillStyle = '#3a2010';
  ctx.fillRect(-7, idle+28+legOff1, 11, 6);    // Bota izquierda
  ctx.fillRect(-3, idle+28+legOff2, 11, 6);    // Bota derecha

  // ─── TORSO ───
  // Cuerpo principal (verde militar)
  ctx.fillStyle = '#3d4a2a';
  ctx.fillRect(-9, idle-15, 18, 26);
  // Detalles del chaleco (líneas decorativas)
  ctx.strokeStyle = '#5a6a40'; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(-4, idle-12); ctx.lineTo(-4, idle+8); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-9, idle-5); ctx.lineTo(9, idle-5); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-7, idle-10); ctx.lineTo(7, idle+2); ctx.stroke();

  // ─── BRAZOS ───
  // Retroceso del arma al disparar (desplaza el brazo derecho)
  const recoil = p.shootRecoil > 0 ? p.shootRecoil * -3 : 0;
  ctx.fillStyle = '#d4956a';                      // Color piel
  ctx.fillRect(7+recoil, idle-10, 8, 5);          // Brazo derecho (con retroceso)
  ctx.fillRect(-14, idle-8, 7, 5);                // Brazo izquierdo

  // ─── ARMA (con efecto de intercambio) ───
  ctx.save();
  // Si está intercambiando arma, anima la entrada/salida
  if (p.weaponSwap > 0) {
    ctx.translate(0, (1-p.weaponSwap)*12);    // Desplazamiento vertical
    ctx.globalAlpha = p.weaponSwap;              // Transparencia
  }
  drawWeaponHeld(ctx, p.slotWeaponIndices[p.weaponIndex], idle + recoil);
  ctx.restore();

  // ─── CABEZA ───
  ctx.fillStyle = '#d4956a';                      // Color piel
  ctx.beginPath(); ctx.roundRect(-8, idle-32, 16, 17, 3); ctx.fill();
  // Casco / pelo (color marrón oscuro)
  ctx.fillStyle = '#1a0a00';
  ctx.fillRect(-7, idle-35, 16, 8);               // Parte de arriba del casco
  ctx.beginPath(); ctx.arc(0, idle-32, 8, Math.PI, 0); ctx.fill(); // Curva del casco
  // Ojos (blanco)
  ctx.fillStyle = '#fff';
  ctx.fillRect(-5, idle-27, 4, 3);                // Ojo izquierdo
  ctx.fillRect(1, idle-27, 4, 3);                 // Ojo derecho
  // Pupilas (negro)
  ctx.fillStyle = '#111';
  ctx.fillRect(-4, idle-26, 2, 2);                // Pupila izquierda
  ctx.fillRect(2, idle-26, 2, 2);                 // Pupila derecha
  // Boca
  ctx.fillStyle = '#c0705a';
  ctx.fillRect(-3, idle-21, 6, 2);
}

// ─── DIBUJAR ARMA EN MANO ───
// Dibuja el arma según el índice con un diseño único para cada una.
function drawWeaponHeld(ctx, idx, yOff) {
  // ─── PISTOLA (SEMI-AUTO) ───
  if (idx===0) {
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(6, yOff-8, 20, 7);               // Slide
    ctx.fillRect(8, yOff-4, 8, 5);                 // Grip
    ctx.fillStyle = '#3a3a3a';
    ctx.fillRect(14, yOff-9, 12, 3);               // Slide top (serrations area)
    ctx.fillRect(24, yOff-8, 2, 4);                // Front sight post
    ctx.strokeStyle = '#555'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.arc(10, yOff-1, 4, 0.3, Math.PI+0.3); ctx.stroke(); // Trigger guard
    ctx.fillStyle = '#111';
    ctx.fillRect(8, yOff-1, 3, 1);                 // Trigger
    ctx.fillStyle = '#444';
    ctx.fillRect(6, yOff-9, 3, 2);                 // Rear sight
    ctx.fillRect(16, yOff-8, 1, 2);                // Slide serration
    ctx.fillRect(18, yOff-8, 1, 2);
    ctx.fillRect(20, yOff-8, 1, 2);
    ctx.fillStyle = '#555';
    ctx.fillRect(8, yOff+1, 8, 1);                 // Magazine floor plate

  // ─── AK-47 (ASSAULT RIFLE) ───
  } else if (idx===1) {
    ctx.fillStyle = '#5C3A1E';
    ctx.fillRect(3, yOff-6, 10, 10);               // Wooden stock
    ctx.fillRect(9, yOff-9, 3, 3);                 // Stock comb (cheek rest)
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(12, yOff-9, 28, 8);               // Metal receiver + barrel
    ctx.fillStyle = '#5C3A1E';
    ctx.fillRect(16, yOff-2, 12, 6);               // Wooden handguard
    ctx.fillRect(14, yOff-9, 3, 3);                 // Receiver top cover
    ctx.fillStyle = '#333';
    ctx.fillRect(12, yOff+2, 6, 8);                 // Magazine (straight top)
    ctx.beginPath();
    ctx.moveTo(18, yOff+10); ctx.lineTo(22, yOff+10);
    ctx.lineTo(18, yOff+2); ctx.closePath();
    ctx.fill();                                     // Magazine curve (banana shape)
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(38, yOff-9, 4, 8);                // Barrel extension / muzzle
    ctx.fillRect(40, yOff-10, 2, 10);               // Flash hider
    ctx.fillStyle = '#444';
    ctx.fillRect(12, yOff-10, 4, 2);                // Rear sight
    ctx.fillRect(20, yOff-10, 2, 2);                // Front sight base
    ctx.fillStyle = '#111';
    ctx.fillRect(13, yOff-1, 3, 2);                 // Trigger area
    ctx.strokeStyle = '#555'; ctx.lineWidth=0.5;
    ctx.beginPath(); ctx.arc(14, yOff, 4, 0.2, Math.PI+0.2); ctx.stroke(); // Trigger guard

  // ─── SHOTGUN (PUMP-ACTION) ───
  } else if (idx===2) {
    ctx.fillStyle = '#5C3A1E';
    ctx.fillRect(2, yOff-7, 10, 10);               // Wooden stock
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(11, yOff-8, 30, 8);               // Receiver + barrel
    ctx.fillStyle = '#3a3a3a';
    ctx.fillRect(11, yOff-1, 14, 7);               // Pump forend (metal)
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(24, yOff-1, 2, 7);                // Pump grip detail
    ctx.fillStyle = '#111';
    ctx.fillRect(12, yOff+2, 3, 4);                 // Tube magazine under barrel
    ctx.fillRect(25, yOff+2, 14, 3);                // Magazine continuation
    ctx.fillStyle = '#5C3A1E';
    ctx.fillRect(12, yOff-9, 4, 2);                 // Receiver top
    ctx.fillRect(14, yOff+6, 6, 4);                 // Pistol grip
    ctx.fillStyle = '#333';
    ctx.fillRect(39, yOff-8, 4, 8);                // Muzzle / choke
    ctx.fillRect(41, yOff-9, 2, 10);               // Front bead
    ctx.fillStyle = '#555';
    ctx.fillRect(12, yOff-10, 3, 2);                // Rear sight
    ctx.fillStyle = '#444';
    ctx.fillRect(11, yOff-1, 3, 2);                 // Trigger area
    ctx.fillStyle = '#222';
    ctx.fillRect(11, yOff+1, 2, 2);                 // Loading port

  // ─── DUAL PISTOLS ───
  } else if (idx===3) {
    // Right hand pistol (same base as idx=0 but positioned slightly differently)
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(6, yOff-8, 18, 6);                // Right slide
    ctx.fillRect(8, yOff-4, 7, 4);                  // Right grip
    ctx.fillStyle = '#3a3a3a';
    ctx.fillRect(13, yOff-9, 10, 3);                // Right slide top
    ctx.fillRect(22, yOff-8, 2, 3);                 // Right front sight
    ctx.fillStyle = '#444';
    ctx.fillRect(6, yOff-9, 3, 2);                  // Right rear sight
    ctx.fillStyle = '#555';
    ctx.fillRect(8, yOff, 7, 1);                    // Right mag plate
    // Left hand pistol (mirrored)
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(-24, yOff-8, 18, 6);              // Left slide
    ctx.fillRect(-15, yOff-4, 7, 4);                // Left grip
    ctx.fillStyle = '#3a3a3a';
    ctx.fillRect(-23, yOff-9, 10, 3);               // Left slide top
    ctx.fillRect(-24, yOff-8, 2, 3);                // Left front sight
    ctx.fillStyle = '#444';
    ctx.fillRect(-9, yOff-9, 3, 2);                 // Left rear sight
    ctx.fillStyle = '#555';
    ctx.fillRect(-15, yOff, 7, 1);                  // Left mag plate
    // Muzzle flashes (small horizontal lines at both barrels when shooting)
    ctx.fillStyle = '#111';
    ctx.fillRect(22, yOff-8, 2, 6);                 // Right barrel exit
    ctx.fillRect(-24, yOff-8, 2, 6);                // Left barrel exit

  // ─── MACHINE GUN (LMG) ───
  } else if (idx===4) {
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(2, yOff-6, 44, 9);                 // Main body + barrel
    ctx.fillStyle = '#5C3A1E';
    ctx.fillRect(2, yOff-8, 10, 11);                // Wooden stock
    ctx.fillStyle = '#333';
    ctx.fillRect(12, yOff-10, 20, 4);               // Top-mounted box magazine
    ctx.fillRect(14, yOff-13, 12, 4);                // Magazine top extension
    ctx.fillStyle = '#444';
    ctx.fillRect(14, yOff-1, 10, 6);                 // Forward grip
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(12, yOff+2, 5, 5);                  // Trigger housing
    ctx.fillStyle = '#3a3a3a';
    ctx.fillRect(34, yOff-7, 12, 7);                // Heavy barrel shroud
    ctx.fillStyle = '#555';
    ctx.fillRect(34, yOff-7, 2, 7);                  // Cooling fin 1
    ctx.fillRect(38, yOff-7, 2, 7);                  // Cooling fin 2
    ctx.fillRect(42, yOff-7, 2, 7);                  // Cooling fin 3
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(44, yOff-8, 4, 9);                 // Muzzle / flash hider
    ctx.fillStyle = '#666';
    ctx.fillRect(12, yOff-11, 6, 2);                 // Carry handle base
    ctx.fillRect(12, yOff-14, 2, 5);                 // Carry handle left
    ctx.fillRect(16, yOff-14, 2, 5);                 // Carry handle right
    ctx.fillRect(12, yOff-14, 6, 1);                 // Carry handle top
    ctx.fillStyle = '#222';
    ctx.fillRect(6, yOff-9, 3, 2);                   // Rear sight
  }
}
