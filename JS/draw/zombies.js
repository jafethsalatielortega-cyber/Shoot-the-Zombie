// ─── DIBUJAR ZOMBIE ───
// Renderiza un zombie según su tipo y muestra su barra de vida si está dañado
// Parámetros: z — objeto del zombie, camX — desplazamiento de cámara
// Los tipos de zombie (z.type): 0=Shambler, 1=Runner, 2=Brute, 3=Climber, 4=Shooter, 5=Bomber, 6=Electrician
function drawZombie(z, camX) {
  // Calcula la posición en pantalla ajustada por la cámara
  const x = z.x - camX;
  const y = z.y;
  // Si el zombie está fuera de la pantalla (con margen), no lo dibuja (optimización)
  if (x < -80 || x > LOGICAL_W+80) return;
  ctx.save();
  ctx.translate(x, y);
  // Si el zombie mira a la derecha (dir > 0), voltea el dibujo horizontalmente
  if (z.dir > 0) ctx.scale(-1,1);

  // Transparencia al morir (se desvanece gradualmente)
  if (z.dead) {
    ctx.globalAlpha = Math.max(0, z.deathTimer / 0.8);
  }

  const t = z.animTimer;

  // Selecciona la función de dibujo según el tipo de zombie
  if (z.type===0) drawShambler(ctx, t, z);
  else if (z.type===1) drawRunner(ctx, t, z);
  else if (z.type===2) drawBrute(ctx, t, z);
  else if (z.type===3) drawClimber(ctx, t, z);
  else if (z.type===5) drawBomber(ctx, t, z);
  else if (z.type===6) drawElectrician(ctx, t, z);
  else drawShooter(ctx, t, z);  // Tipo 4 por defecto

  ctx.restore();

  // ─── BARRA DE VIDA ───
  // Solo muestra la barra si el zombie está vivo y tiene daño (hp < maxHp)
  if (!z.dead && z.hp < z.maxHp) {
    const bw = 36;                    // Ancho total de la barra
    const bx = x - bw/2;               // Centrado horizontalmente
    const by = y - z.height - 10;      // Sobre la cabeza del zombie
    ctx.fillStyle = '#400';            // Fondo rojo oscuro
    ctx.fillRect(bx, by, bw, 5);
    ctx.fillStyle = '#f00';            // Barra roja proporcional a la vida restante
    ctx.fillRect(bx, by, bw * (z.hp/z.maxHp), 5);
  }
}

// ─── ZOMBIE TIPO 0: SHAMBLER (lento, verde) ───
// Zombie básico: lento, cuerpo verde con costillas visibles,步态 tambaleante
function drawShambler(ctx, t, z) {
  // Oscilación lateral al caminar
  const sw = Math.sin(t*1.5)*4;
  ctx.save(); ctx.rotate(0.26);
  // Torso superior
  ctx.fillStyle = '#6b7c3a';
  ctx.fillRect(-6, -25, 14, 20);
  // Costillas marcadas (dibuja 4 arcos simulando costillas visibles)
  ctx.strokeStyle = '#4a5820'; ctx.lineWidth=1;
  for (let i=0; i<4; i++) {
    ctx.beginPath();
    ctx.arc(1, -23+i*5, 5, -0.8, 0.8);
    ctx.stroke();
  }
  // Torso inferior
  ctx.fillStyle = '#5a6830';
  ctx.fillRect(-6, -5, 14, 18);
  // Piernas con oscilación lateral
  ctx.fillRect(-4+sw, 13, 9, 16);
  ctx.fillRect(-8+sw, 13, 9, 14);
  // Botas
  ctx.fillStyle = '#3a2818';
  ctx.fillRect(-5+sw, 26, 10, 5);
  ctx.fillRect(-9+sw, 24, 10, 5);
  // Brazos
  ctx.fillStyle = '#6b7c3a';
  ctx.fillRect(6, -28, 6, 18);                              // Brazo derecho
  ctx.save(); ctx.translate(-8, -18); ctx.rotate(0.4);
  ctx.fillStyle = '#6b7c3a';
  ctx.fillRect(-3, 0, 6, 20);                                // Brazo izquierdo
  ctx.restore();
  // Cabeza
  ctx.fillStyle = '#7a8c4a';
  ctx.beginPath(); ctx.roundRect(-7, -38, 14, 14, 2); ctx.fill();
  // Ojos blancos
  ctx.fillStyle = '#f0f0f0';
  ctx.beginPath(); ctx.arc(-3, -33, 4, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(4, -33, 4, 0, Math.PI*2); ctx.fill();
  // Pelo/casco
  ctx.fillStyle = '#5a6830';
  ctx.fillRect(-6, -42, 13, 6);
  ctx.restore();
}

// ─── ZOMBIE TIPO 1: RUNNER (rápido, azul) ───
// Zombie veloz: cuerpo azul, brazos extendidos y piernas que se mueven muy rápido (t*10)
function drawRunner(ctx, t, z) {
  // Fase de animación de piernas (corre muy rápido: t*10)
  const legPhase = t * 10;
  ctx.save(); ctx.rotate(-0.3);
  // Brazos extendidos (color gris claro)
  ctx.fillStyle = '#aaa';
  ctx.fillRect(-4, -22, 10, 16);
  // Torso azul
  ctx.fillStyle = '#3060cc';
  ctx.fillRect(-5, -6, 12, 14);
  // Piernas con movimiento alternado (seno y seno desfasado PI)
  const l1 = Math.sin(legPhase)*12;
  const l2 = Math.sin(legPhase+Math.PI)*12;
  ctx.fillStyle = '#3060cc';
  ctx.fillRect(-4, 8, 8, 12+l1);    // Pierna izquierda
  ctx.fillRect(-1, 8, 8, 12+l2);    // Pierna derecha
  // Zapatos
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(-5, 18+l1, 9, 5);
  ctx.fillRect(-2, 18+l2, 9, 5);
  // Brazos inferiores (antebrazos)
  ctx.fillStyle = '#aaa';
  ctx.save(); ctx.translate(-5,-14); ctx.rotate(1.2);
  ctx.fillRect(-2, 0, 5, 16); ctx.restore();
  ctx.save(); ctx.translate(5,-14); ctx.rotate(1.0);
  ctx.fillRect(-2, 0, 5, 16); ctx.restore();
  // Cabeza
  ctx.fillStyle = '#bbb';
  ctx.beginPath(); ctx.roundRect(-5, -32, 11, 12, 2); ctx.fill();
  // Ojos rojos (3 pequeños rectángulos rojos)
  ctx.fillStyle = '#f00';
  ctx.fillRect(-4, -30, 3, 2);
  ctx.fillRect(-4, -27, 3, 2);
  ctx.fillRect(1, -29, 3, 3);
  // Pelo
  ctx.fillStyle = '#888';
  ctx.fillRect(-4, -38, 10, 7);
  // Dientes (4 pequeños rectángulos blancos en la boca)
  ctx.fillStyle = '#f0f0f0';
  for (let i=0; i<4; i++) ctx.fillRect(-3+i*2, -22, 1, 3);
  ctx.restore();
}

// ─── ZOMBIE TIPO 2: BRUTE (grande, verde oscuro, escala 1.8x) ───
// Zombie enorme: 1.8 veces más grande que los demás, cuerpo ancho, pisadas fuertes y cicatrices
function drawBrute(ctx, t, z) {
  // Animación de pisada fuerte (alterna entre 0 y 2 cada ~0.66s)
  const stomp = Math.floor(t*1.5)%2===0 ? 0 : 2;
  ctx.save();
  ctx.scale(1.8, 1.8);   // El Brute es 1.8 veces más grande que los demás
  // Torso superior ancho
  ctx.fillStyle = '#4a5520';
  ctx.beginPath(); ctx.roundRect(-9, -24, 20, 22, 4); ctx.fill();
  // Hombros redondeados
  ctx.fillStyle = '#5a6530';
  ctx.beginPath(); ctx.ellipse(-4, -20, 5, 7, -0.3, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(4, -20, 5, 7, 0.3, 0, Math.PI*2); ctx.fill();
  // Torso inferior
  ctx.fillStyle = '#3a4510';
  ctx.fillRect(-9, -2, 20, 18);
  // Piernas con balanceo y pisada
  const ll = Math.sin(t*2)*5;
  ctx.fillRect(-8, 16+stomp, 8, 14+ll);   // Pierna izquierda
  ctx.fillRect(0, 16+stomp, 8, 14-ll);    // Pierna derecha
  // Botas grandes
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(-9, 28+stomp+ll, 9, 5);
  ctx.fillRect(-1, 28+stomp-ll, 9, 5);
  // Cicatrices en el torso (círculos en los costados)
  ctx.strokeStyle = '#888'; ctx.lineWidth=1.5;
  for (let i=0; i<5; i++) {
    ctx.beginPath(); ctx.arc(-12+i*2, -14+i*3, 2, 0, Math.PI*2); ctx.stroke();
  }
  for (let i=0; i<5; i++) {
    ctx.beginPath(); ctx.arc(10+i*2, -14+i*3, 2, 0, Math.PI*2); ctx.stroke();
  }
  // Brazos musculosos
  ctx.fillStyle = '#4a5520';
  ctx.save(); ctx.translate(-11,-16); ctx.rotate(-0.4);
  ctx.fillRect(-3,0,7,18); ctx.restore();
  ctx.save(); ctx.translate(10,-16); ctx.rotate(0.4);
  ctx.fillRect(-3,0,7,18); ctx.restore();
  // Cabeza grande
  ctx.fillStyle = '#5a6530';
  ctx.beginPath(); ctx.roundRect(-8, -36, 17, 14, 3); ctx.fill();
  // Ojos rojos con pupilas blancas
  ctx.fillStyle = '#f00';
  ctx.beginPath(); ctx.arc(-3, -31, 3, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(4, -31, 3, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(-3, -31, 1.5, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(4, -31, 1.5, 0, Math.PI*2); ctx.fill();
  ctx.restore();
}

// ─── ZOMBIE TIPO 3: CLIMBER (morado, trepador) ───
// Zombie trepador: cuerpo morado con rayas brillantes, brazos estirados y ojos verde neón
function drawClimber(ctx, t, z) {
  // Fase de animación rápida (t*8) para movimiento de piernas
  const legPhase = t * 8;
  ctx.save(); ctx.rotate(-0.15);
  // Torso
  ctx.fillStyle = '#9933cc';
  ctx.fillRect(-4, -20, 9, 15);
  // Rayas brillantes en el torso (3 líneas verticales fluorescentes)
  ctx.fillStyle = '#cc66ff';
  ctx.fillRect(-3, -18, 1, 12);
  ctx.fillRect(0, -18, 1, 12);
  ctx.fillRect(3, -18, 1, 12);
  // Piernas con movimiento alternado
  ctx.fillStyle = '#7722aa';
  const l1 = Math.sin(legPhase)*8;
  const l2 = Math.sin(legPhase+Math.PI)*8;
  ctx.fillRect(-3, 0, 7, 14+l1);    // Pierna izquierda
  ctx.fillRect(0, 0, 7, 14+l2);     // Pierna derecha
  // Zapatos oscuros
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(-3, 12+l1, 8, 4);
  ctx.fillRect(0, 12+l2, 8, 4);
  // Brazos estirados (postura de trepador)
  ctx.fillStyle = '#9933cc';
  ctx.save(); ctx.translate(-6,-12); ctx.rotate(1.4);
  ctx.fillRect(-2, 0, 5, 15); ctx.restore();
  ctx.save(); ctx.translate(6,-12); ctx.rotate(-1.4);
  ctx.fillRect(-2, 0, 5, 15); ctx.restore();
  // Cabeza
  ctx.fillStyle = '#aa44dd';
  ctx.beginPath(); ctx.roundRect(-5, -32, 11, 12, 2); ctx.fill();
  // Ojos verde brillante (neón) con pupilas negras
  ctx.fillStyle = '#88ff00';
  ctx.beginPath(); ctx.arc(-3, -27, 2.5, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(3, -27, 2.5, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#0a0a0a';
  ctx.beginPath(); ctx.arc(-3, -27, 1, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(3, -27, 1, 0, Math.PI*2); ctx.fill();
  // Pelo
  ctx.fillStyle = '#5a4a6a';
  ctx.fillRect(-5, -36, 11, 5);
  ctx.restore();
}

// ─── ZOMBIE TIPO 4: SHOOTER (rojo, dispara a distancia) ───
// Zombie que dispara: cuerpo rojo, brazo derecho extendido sujetando un rifle oscuro
// Es el único zombie con animación de apuntar (aimY oscila con el tiempo)
function drawShooter(ctx, t, z) {
  // Fase de piernas más lenta (t*4) porque se mueve menos
  const legPhase = t * 4;
  // Torso superior con costillas visibles
  ctx.fillStyle = '#6b2a2a';
  ctx.fillRect(-5, -24, 12, 18);
  // Línea vertical decorativa en el torso
  ctx.strokeStyle = '#8a4a4a'; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(-3, -21); ctx.lineTo(-3, -9); ctx.stroke();
  // Torso inferior
  ctx.fillStyle = '#5a1a1a';
  ctx.fillRect(-5, -6, 12, 16);
  // Piernas con movimiento alternado suave
  const l1 = Math.sin(legPhase)*5;
  const l2 = Math.sin(legPhase+Math.PI)*5;
  ctx.fillRect(-5, 10, 8, 12+l1);
  ctx.fillRect(0, 10, 8, 12+l2);
  // Zapatos
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(-5, 20+l1, 9, 4);
  ctx.fillRect(0, 20+l2, 9, 4);
  // Brazo izquierdo (apunta hacia atrás)
  ctx.fillStyle = '#6b2a2a';
  ctx.fillRect(-10, -22, 5, 12);
  // Brazo derecho (apunta hacia adelante, sujetando el arma)
  const aimY = Math.sin(t*2)*2;                 // Leve oscilación al apuntar
  ctx.fillStyle = '#6b2a2a';
  ctx.fillRect(6, -24+aimY, 5, 14);
  // Arma (rifle oscuro) en la mano derecha
  ctx.fillStyle = '#2a2a2a';
  ctx.fillRect(8, -22+aimY, 12, 5);             // Cuerpo del arma
  ctx.fillStyle = '#3a3a3a';
  ctx.fillRect(15, -23+aimY, 5, 3);              // Mira superior
  // Cabeza
  ctx.fillStyle = '#a06050';
  ctx.beginPath(); ctx.roundRect(-6, -37, 13, 13, 2); ctx.fill();
  // Ojos rojos brillantes
  ctx.fillStyle = '#ff2222';
  ctx.fillRect(-4, -33, 3, 2);
  ctx.fillRect(2, -33, 3, 2);
  // Casco
  ctx.fillStyle = '#3a1a1a';
  ctx.fillRect(-6, -41, 13, 5);
}

// ─── ZOMBIE TIPO 5: BOMBER (gris, explota al morir o al armarse) ───
// Zombie bomba: cuerpo redondo gris con núcleo que cambia de color al armarse
// Cuando se arma (z.arming), el núcleo pulsa rojo/naranja con halos de brillo expansivos
function drawBomber(ctx, t, z) {
  // Efecto de pulso cuando está armándose (listo para explotar)
  const pulse = z.arming ? Math.sin(t * 12) : 0;
  // Colores del núcleo: rojo/naranja intenso cuando se arma, marrón apagado en reposo
  const r = z.arming ? Math.floor(180 + pulse * 75) : 100;
  const g = z.arming ? Math.floor(80 + pulse * 60) : 60;
  const b = 0;
  // Color del brillo exterior pulsante (naranja semitransparente)
  const glowColor = z.arming ? `rgba(255,150,0,${0.15 + Math.abs(pulse) * 0.25})` : 'transparent';

  // Brillo pulsante alrededor del cuerpo cuando está armado
  if (z.arming) {
    ctx.fillStyle = glowColor;
    ctx.beginPath(); ctx.arc(0, -10, 14 + Math.abs(pulse) * 4, 0, Math.PI*2); ctx.fill();
  }

  // Cuerpo redondo (como una bomba)
  ctx.fillStyle = '#3a3a3a';
  ctx.beginPath(); ctx.ellipse(0, -10, 10, 12, 0, 0, Math.PI*2); ctx.fill();

  // Núcleo central que cambia de color y tamaño al armarse
  ctx.fillStyle = `rgb(${r},${g},${b})`;
  ctx.beginPath(); ctx.arc(0, -10, z.arming ? 4 + Math.abs(pulse) * 2 : 3, 0, Math.PI*2); ctx.fill();

  // Segundo halo de brillo cuando está armado
  if (z.arming) {
    ctx.fillStyle = `rgba(255,200,0,${0.08 + Math.abs(pulse) * 0.15})`;
    ctx.beginPath(); ctx.arc(0, -10, 7, 0, Math.PI*2); ctx.fill();
  }

  // Piernas con movimiento rápido
  const legPhase = t * 10;
  const l1 = Math.sin(legPhase) * 8;
  const l2 = Math.sin(legPhase + Math.PI) * 8;
  ctx.fillStyle = '#333';
  ctx.fillRect(-5, 2, 5, 10 + l1);
  ctx.fillRect(1, 2, 5, 10 + l2);
  // Zapatos oscuros
  ctx.fillStyle = '#222';
  ctx.fillRect(-5, 10 + l1, 6, 4);
  ctx.fillRect(1, 10 + l2, 6, 4);

  // Brazos
  ctx.fillStyle = '#444';
  ctx.save(); ctx.translate(-11, -15); ctx.rotate(-0.4);
  ctx.fillRect(-2, 0, 5, 12); ctx.restore();
  ctx.save(); ctx.translate(11, -15); ctx.rotate(0.4);
  ctx.fillRect(-2, 0, 5, 12); ctx.restore();

  // Cabeza
  ctx.fillStyle = '#4a4a4a';
  ctx.beginPath(); ctx.roundRect(-5, -27, 10, 10, 3); ctx.fill();
  // Ojos rojos
  ctx.fillStyle = '#ff3300';
  ctx.fillRect(-3, -24, 2, 2);
  ctx.fillRect(2, -24, 2, 2);
  // Casco
  ctx.fillStyle = '#333';
  ctx.fillRect(-5, -30, 10, 4);
}

// ─── ZOMBIE TIPO 6: ELECTRICIAN (verde eléctrico, con chispas y brillo) ───
// Zombie eléctrico: cuerpo verde con sombra brillante pulsante, chispas curvas y cinturón de herramientas
// El brillo externo y las chispas varían con un pulso basado en el seno del tiempo
function drawElectrician(ctx, t, z) {
  // Pulso de electricidad (valor entre 0 y 1 usando seno)
  const pulse = Math.sin(t * 3 + z.sparkTimer) * 0.5 + 0.5;
  // Componente verde del brillo (varía entre 100 y 255 según el pulso)
  const glow = Math.floor(100 + pulse * 155);

  ctx.save();
  // Brillo externo verde que pulsa (sombra brillante alrededor del zombie)
  ctx.shadowColor = `rgb(${glow},255,${glow})`;
  ctx.shadowBlur = 8 + pulse * 6;

  // Torso superior
  ctx.fillStyle = '#3a5a3a';
  ctx.beginPath(); ctx.roundRect(-6, -25, 14, 20, 2); ctx.fill();
  // Torso inferior
  ctx.fillStyle = '#2a4a2a';
  ctx.fillRect(-6, -5, 14, 18);

  // Piernas con movimiento alternado
  const legPhase = t * 5;
  const l1 = Math.sin(legPhase) * 7;
  const l2 = Math.sin(legPhase + Math.PI) * 7;
  ctx.fillStyle = '#2a4a2a';
  ctx.fillRect(-5, 13, 8, 14 + l1);
  ctx.fillRect(1, 13, 8, 14 + l2);
  // Zapatos
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(-5, 25 + l1, 8, 4);
  ctx.fillRect(1, 25 + l2, 8, 4);

  // Brazos
  ctx.fillStyle = '#3a5a3a';
  ctx.save(); ctx.translate(-8, -18); ctx.rotate(0.4);
  ctx.fillRect(-2, 0, 5, 18); ctx.restore();
  ctx.save(); ctx.translate(8, -18); ctx.rotate(-0.4);
  ctx.fillRect(-2, 0, 5, 18); ctx.restore();

  // Cabeza
  ctx.fillStyle = '#4a6a4a';
  ctx.beginPath(); ctx.roundRect(-7, -38, 15, 14, 3); ctx.fill();
  // Ojos rojos con pupilas blancas
  ctx.fillStyle = '#ff4444';
  ctx.beginPath(); ctx.arc(-3, -32, 3, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(4, -32, 3, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(-3, -32, 1.2, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(4, -32, 1.2, 0, Math.PI*2); ctx.fill();
  // Casco
  ctx.fillStyle = '#5a7a5a';
  ctx.fillRect(-6, -44, 14, 6);

  // Chispas eléctricas curvas alrededor del cuerpo
  ctx.shadowBlur = 0;
  ctx.strokeStyle = `rgba(100,255,100,${0.2 + pulse * 0.5})`;
  ctx.lineWidth = 1.5;
  // Dibuja 3 rayos curvos con posiciones y formas variables
  for (let i = 0; i < 3; i++) {
    const wx = -3 + i * 5;
    const wy = -10 + i * 7;
    ctx.beginPath();
    ctx.moveTo(wx, wy);
    // Curva cuadrática que se mueve con el tiempo (efecto de electricidad)
    ctx.quadraticCurveTo(wx + Math.sin(t * 4 + i) * 8, wy - 4, wx + Math.sin(t * 3 + i * 2) * 12, wy + 2);
    ctx.stroke();
  }

  // Pulso de luz verde alrededor del cuerpo cuando el pulso es intenso
  if (pulse > 0.7) {
    ctx.fillStyle = `rgba(100,255,100,${pulse * 0.15})`;
    ctx.beginPath(); ctx.arc(0, -10, 10 + pulse * 6, 0, Math.PI * 2); ctx.fill();
  }

  // Cinturón con herramientas (accesorios de electricista)
  ctx.fillStyle = '#8a6a3a';
  ctx.fillRect(-5, 5, 10, 6);
  ctx.fillRect(-6, 8, 12, 3);
  ctx.fillStyle = '#666';
  ctx.fillRect(-4, 11, 3, 4);   // Herramienta 1
  ctx.fillRect(1, 11, 3, 4);    // Herramienta 2

  ctx.restore();
}
