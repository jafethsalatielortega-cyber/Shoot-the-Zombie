// ─── DIBUJAR MAPA ───
// Renderiza el fondo del escenario: cielo, luna, edificios lejanos, suelo, plataformas y objetos decorativos
// El mapa usa múltiples capas con distintos niveles de parallax para dar sensación de profundidad
// Parámetro: camX — desplazamiento horizontal de la cámara para seguir al jugador
function drawMap(camX) {
  // ─── CIELO (degradado nocturno) ───
  // Crea un degradado vertical desde arriba (0) hasta el suelo (GROUND_Y)
  const sky = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  // Colores del atardecer/nocturno: morado oscuro, rojo, naranja, naranja claro
  sky.addColorStop(0, '#1a0a2e');
  sky.addColorStop(0.4, '#6b1a1a');
  sky.addColorStop(0.7, '#c4501a');
  sky.addColorStop(1, '#d4803a');
  ctx.fillStyle = sky;
  // Dibuja un rectángulo que cubre toda la pantalla con el degradado
  ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);

  // ─── LUNA (con parallax suave 0.05x) ───
  // Calcula la posición horizontal de la luna, se mueve muy lentamente con la cámara
  const moonX = (850 - camX*0.05 + LOGICAL_W*2) % (LOGICAL_W + 200) - 100;
  ctx.fillStyle = '#fff5e0';
  ctx.beginPath(); ctx.arc(moonX, 60, 30, 0, Math.PI*2); ctx.fill();
  // Cráteres de la luna (círculos más pequeños y oscuros)
  ctx.fillStyle = '#d4c8a0';
  ctx.beginPath(); ctx.arc(moonX-8, 55, 6, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(moonX+12, 68, 4, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(moonX+2, 48, 5, 0, Math.PI*2); ctx.fill();

  // ─── EDIFICIOS LEJANOS (capa 1, parallax 0.1x) ───
  // Se mueven al 10% de la velocidad de la cámara (efecto de profundidad)
  ctx.fillStyle = '#1a1020';
  const p1off = -camX * 0.1;
  // Dibuja 14 edificios que se repiten horizontalmente
  for (let i=0; i<14; i++) {
    // Calcula la posición X con desplazamiento cíclico (para que se repita infinitamente)
    const bx = (i * 210 + p1off % (14*210) + 14*210) % (14*210) - 50;
    // Altura del edificio varía según el índice (i*73%80 da valores entre 0 y 79)
    const bh = 60 + (i*73%80);
    ctx.fillRect(bx, GROUND_Y - bh - 40, 90 + (i*37%60), bh + 40);
    // Ventanas iluminadas (cuadritos amarillos tenues)
    ctx.fillStyle = 'rgba(255,200,80,0.15)';
    for (let r=0; r<4; r++) for (let c=0; c<3; c++) {
      // Patrón para que algunas ventanas estén apagadas (no todas se dibujan)
      if ((i+r+c)%3!==0) ctx.fillRect(bx+8+c*18, GROUND_Y-bh-40+8+r*16, 10, 9);
    }
    ctx.fillStyle = '#1a1020';
  }

  // ─── EDIFICIOS CERCANOS (capa 2, parallax 0.3x) ───
  // Se mueven al 30% de la velocidad de la cámara (más cerca que los lejanos)
  ctx.fillStyle = '#2a1820';
  const p2off = -camX * 0.3;
  // Dibuja 10 edificios más cercanos
  for (let i=0; i<10; i++) {
    const bx = (i * 280 + p2off % (10*280) + 10*280) % (10*280) - 50;
    const bh = 40 + (i*61%70);
    ctx.fillRect(bx, GROUND_Y - bh - 20, 110+(i*43%50), bh+20);
    // Detalles de ventanas en esta capa (rectángulos más oscuros)
    ctx.fillStyle = '#3a2830';
    ctx.fillRect(bx+10, GROUND_Y-bh-20, 20, 15);
    ctx.fillRect(bx+60, GROUND_Y-bh-20, 30, 20);
    ctx.fillStyle = '#2a1820';
    // Ventanas iluminadas azul tenue
    ctx.fillStyle = 'rgba(80,150,255,0.1)';
    for (let r=0; r<3; r++) for (let c=0; c<4; c++) {
      // Patrón para alternar ventanas encendidas/apagadas
      if ((i+r*c)%2===0) ctx.fillRect(bx+6+c*22, GROUND_Y-bh-20+6+r*18, 14, 12);
    }
    ctx.fillStyle = '#2a1820';
  }

  // ─── SUELO ───
  // Rellena el área desde GROUND_Y hasta el fondo con color gris oscuro
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(0, GROUND_Y, LOGICAL_W, LOGICAL_H - GROUND_Y);

  // Grietas o líneas decorativas en el suelo (dibuja 30 marcas)
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 1;
  for (let i=0; i<30; i++) {
    // Posición X con desplazamiento de cámara para que se muevan con el suelo
    const cx = ((i*137 + (-camX*0.6|0)) % LOGICAL_W + LOGICAL_W) % LOGICAL_W;
    const cy = GROUND_Y + 5 + (i*17%25);
    // Dibuja una pequeña línea quebrada simulando una grieta
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + (i%2?1:-1)*(10+i%15), cy + 3 + i%8);
    ctx.lineTo(cx + (i%2?1:-1)*(15+i%10), cy + 6 + i%12);
    ctx.stroke();
  }

  // ─── PLATAFORMAS ───
  // Recorre todas las plataformas del nivel
  for (const pl of PLATFORMS) {
    const px = pl.x - camX;
    // Solo dibuja si la plataforma está visible en pantalla (con margen)
    if (px > -200 && px < LOGICAL_W + 200) {
      // Sombra proyectada debajo de la plataforma
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(px+4, pl.y+pl.h+2, pl.w, 6);
      // Degradado del cuerpo (gris claro arriba, oscuro abajo)
      const grad = ctx.createLinearGradient(px, pl.y, px, pl.y+pl.h);
      grad.addColorStop(0, '#5a5a5a');
      grad.addColorStop(1, '#2a2a2a');
      ctx.fillStyle = grad;
      ctx.fillRect(px, pl.y, pl.w, pl.h);
      // Borde de la plataforma
      ctx.strokeStyle = '#777';
      ctx.lineWidth = 1;
      ctx.strokeRect(px, pl.y, pl.w, pl.h);
      // Líneas de detalle horizontal (pequeñas marcas decorativas)
      ctx.strokeStyle = '#666';
      for (let j=10; j<pl.w-10; j+=20) {
        ctx.beginPath(); ctx.moveTo(px+j, pl.y+3); ctx.lineTo(px+j+8, pl.y+3); ctx.stroke();
      }
    }
  }

  // ─── OBJETOS DECORATIVOS (barriles, barricadas, letreros) ───
  // Dibuja los objetos del escenario que están visibles en pantalla
  for (const pr of PROPS) {
    const px = pr.x - camX;
    if (px > -100 && px < LOGICAL_W+100) drawProp(ctx, pr.type, px, pr.y);
  }
}
