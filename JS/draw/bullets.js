// ─── DIBUJAR BALAS ───
// Renderiza todas las balas activas: enemigas (rojas con estela) y del jugador (amarillas, rotadas)
// Recibe el estado global del juego (gs) para acceder a la lista de balas y la posición de la cámara
// Las balas enemigas tienen un brillo rojo y estela visible; las del jugador son rectángulos rotados
function drawBullets(gs) {
  // Itera sobre todas las balas activas
  for (const b of gs.bullets) {
    // Calcula la posición horizontal en pantalla restando el desplazamiento de la cámara
    const cx = b.x - gs.camX;
    // La posición vertical no necesita ajuste de cámara (el juego es 2D lateral)
    const cy = b.y;
    ctx.save();

    // ─── BALA ENEMIGA (roja con brillo y estela) ───
    if (b.isEnemy) {
      // Dibuja la estela (trail) de la bala: una línea roja semitransparente
      ctx.strokeStyle = 'rgba(255,80,80,0.6)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      // Comienza la línea desde la posición actual de la bala
      ctx.moveTo(cx, cy);
      // Conecta todas las posiciones anteriores guardadas en el trail
      for (const tp of b.trail) ctx.lineTo(tp.x - gs.camX, tp.y);
      ctx.stroke();
      // Crea un brillo radial alrededor de la bala (efecto de glow)
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 10);
      grad.addColorStop(0, 'rgba(255,120,120,0.9)');   // Centro brillante
      grad.addColorStop(0.5, 'rgba(255,60,60,0.3)');   // Borde medio
      grad.addColorStop(1, 'rgba(255,0,0,0)');         // Exterior transparente
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(cx, cy, 10, 0, Math.PI*2); ctx.fill();
      // Centro blanco de la bala (núcleo brillante)
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(cx, cy, 3, 0, Math.PI*2); ctx.fill();
    // ─── BALA DEL JUGADOR (amarilla, rectangular, rotada según dirección) ───
    } else {
      // Estela muy tenue de la bala del jugador
      ctx.strokeStyle = 'rgba(255,220,80,0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      for (const tp of b.trail) ctx.lineTo(tp.x - gs.camX, tp.y);
      ctx.stroke();
      // Calcula el ángulo de la bala según su velocidad (atan2: arco tangente de vy/vx)
      const angle = Math.atan2(b.vy, b.vx);
      // Traslada el origen al centro de la bala y la rota según su dirección
      ctx.translate(cx, cy);
      ctx.rotate(angle);
      // Dibuja la bala como un rectángulo con el color y tamaño definidos por el arma
      ctx.fillStyle = b.weapon.bulletColor;
      ctx.fillRect(-b.weapon.bulletW/2, -b.weapon.bulletH/2, b.weapon.bulletW, b.weapon.bulletH);
    }

    ctx.restore();
  }
}
