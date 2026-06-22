// ─── DIBUJAR JEFE (BOSS) ───
// Renderiza al jefe final: cuerpo, cabeza, ojos brillantes, brazos, piernas y barra de vida
// El jefe es mucho más grande que los zombies normales y tiene un borde verde brillante
// Parámetros: boss — objeto del jefe, camX — desplazamiento de cámara
function drawBoss(boss, camX) {
  // Si el jefe no existe o ya terminó la animación de muerte, no dibuja nada
  if (!boss || boss.dead && boss.deathTimer <= 0 && !boss.deathCircles) return;
  // Posición en pantalla ajustada por la cámara
  const x = boss.x - camX;
  const y = boss.y;
  // Si está fuera de la pantalla (con margen), no lo dibuja
  if (x < -120 || x > LOGICAL_W + 120) return;

  // ─── CÍRCULOS DE MUERTE ───
  // Animación de ondas expansivas al morir el jefe
  // Múltiples círculos concéntricos rojos que crecen y se desvanecen
  if (boss.deathCircles) {
    // Dibuja cada círculo expansivo de la animación de muerte
    for (const c of boss.deathCircles) {
      if (c.timer <= 0) continue;
      // Progreso: 0 = empieza, 1 = termina
      const prog = 1 - c.timer / c.maxT;
      const r = c.maxR * prog;       // Radio crece con el progreso
      const alpha = 1 - prog;         // Transparencia disminuye (se desvanece)
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = '#ff4400';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(c.x - camX, c.y, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    return;  // No dibuja el cuerpo si está en animación de círculos
  }

  // Transparencia al morir (se desvanece gradualmente)
  if (boss.dead) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, boss.deathTimer / 1.5);
  }

  const t = boss.animTimer;
  // Leve balanceo vertical (bob) usando seno del tiempo
  const bob = Math.sin(t * 1.5) * 3;

  ctx.save();
  ctx.translate(x, y + bob);
  // Voltea si el jefe mira a la izquierda
  if (boss.dir < 0) ctx.scale(-1, 1);

  // ─── CUERPO ───
  // Cuerpo principal verde oscuro con bordes redondeados
  ctx.fillStyle = '#3a4a2e';
  ctx.beginPath();
  ctx.roundRect(-20, -boss.height + 10, 40, boss.height - 10, 6);
  ctx.fill();

  // Borde verde brillante alrededor del cuerpo
  ctx.strokeStyle = '#8aff00';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(-20, -boss.height + 10, 40, boss.height - 10, 6);
  ctx.stroke();

  // ─── PECHO ───
  // Zona del pecho (elipse más oscura)
  ctx.fillStyle = '#2d3a22';
  ctx.beginPath();
  ctx.ellipse(0, -boss.height + 30, 18, 22, 0, 0, Math.PI * 2);
  ctx.fill();

  // ─── OJOS (rojos con brillo) ───
  ctx.fillStyle = '#ff2222';
  ctx.shadowColor = '#ff0000';
  ctx.shadowBlur = 12;                    // Sombra roja brillante alrededor de los ojos
  ctx.beginPath();
  ctx.arc(-8, -boss.height + 26, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(8, -boss.height + 26, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;                     // Restaura para no afectar otros dibujos

  // Pupilas (puntos negros dentro de los ojos)
  ctx.fillStyle = '#1a1a0a';
  ctx.beginPath();
  ctx.arc(-8, -boss.height + 26, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(8, -boss.height + 26, 2, 0, Math.PI * 2);
  ctx.fill();

  // ─── BRAZOS ───
  ctx.fillStyle = '#2a3a1e';
  ctx.save();
  ctx.translate(-18, -boss.height + 50);
  ctx.rotate(-0.3);
  ctx.fillRect(-4, -5, 8, 25);            // Brazo izquierdo
  ctx.restore();
  ctx.save();
  ctx.translate(18, -boss.height + 50);
  ctx.rotate(0.3);
  ctx.fillRect(-4, -5, 8, 25);            // Brazo derecho
  ctx.restore();

  // ─── PIERNAS ───
  // Balanceo alternado de piernas
  const legOff = Math.sin(t * 2) * 4;
  ctx.fillStyle = '#2a3a1e';
  ctx.fillRect(-14, -15, 10, 15 + legOff); // Pierna izquierda
  ctx.fillRect(4, -15, 10, 15 - legOff);   // Pierna derecha
  // Botas
  ctx.fillStyle = '#1a1a0a';
  ctx.fillRect(-15, legOff, 11, 5);        // Bota izquierda
  ctx.fillRect(3, -legOff, 11, 5);         // Bota derecha

  // ─── ETIQUETA "BOSS" ───
  // Texto verde brillante sobre la cabeza indicando que es el jefe
  ctx.fillStyle = '#88ff00';
  ctx.font = 'bold 12px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('BOSS', 0, -boss.height - 2);
  ctx.textAlign = 'left';

  // ─── BARRA DE VIDA ───
  // Solo se muestra si el jefe está vivo y ha recibido daño
  if (!boss.dead && boss.hp < boss.maxHp) {
    const bw = 80, bh = 8;                  // Ancho y alto de la barra
    const bx = -bw / 2;                      // Centrada horizontalmente
    const by = -boss.height - 16;            // Posición sobre la cabeza
    ctx.fillStyle = '#400000';               // Fondo rojo oscuro
    ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = '#ff2200';               // Relleno rojo brillante según vida
    ctx.fillRect(bx, by, bw * (boss.hp / boss.maxHp), bh);
    ctx.strokeStyle = '#ff6600';             // Borde naranja
    ctx.lineWidth = 1;
    ctx.strokeRect(bx, by, bw, bh);
  }

  ctx.restore();

  // Restaura el estado guardado al inicio si el jefe estaba muerto
  if (boss.dead) ctx.restore();
}
