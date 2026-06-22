// ─── DIBUJAR OBJETOS RECOGIBLES ───
// Renderiza todos los pickups del juego: salud, munición, insta-kill, doble disparo, munición infinita
// Recibe el estado global del juego (gs) para acceder a la lista de pickups y la posición de la cámara
// Cada pickup tiene un color distintivo y un icono único para identificarlo rápidamente
function drawPickups(gs) {
  // Itera sobre todos los pickups activos en el juego
  for (const pk of gs.pickups) {
    // Calcula la posición en pantalla restando el desplazamiento de la cámara
    const px = pk.x - gs.camX;
    // Aplica un efecto de flotación (bob) usando la función seno para que suba y baje suavemente
    const py = pk.y - 15 + Math.sin(pk.bob)*5;
    ctx.save();
    // ─── SALUD (cruz blanca sobre fondo rojo) ───
    if (pk.type==='health') {
      // Fondo rojo del objeto de salud
      ctx.fillStyle = '#cc2020';
      ctx.fillRect(px-12, py-12, 24, 24);
      // Borde rojo claro
      ctx.strokeStyle='#ff4040'; ctx.lineWidth=1;
      ctx.strokeRect(px-12,py-12,24,24);
      // Cruz blanca: barra vertical
      ctx.fillStyle = '#fff';
      ctx.fillRect(px-2, py-8, 4, 16);
      // Cruz blanca: barra horizontal
      ctx.fillRect(px-8, py-2, 16, 4);
    // ─── MUNICIÓN (caja amarilla con texto) ───
    } else if (pk.type==='ammo') {
      // Caja de munición de color amarillo oscuro
      ctx.fillStyle = '#b89020';
      ctx.fillRect(px-12, py-10, 24, 20);
      // Borde amarillo claro
      ctx.strokeStyle='#ffd060'; ctx.lineWidth=1;
      ctx.strokeRect(px-12,py-10,24,20);
      // Texto "AMMO" en blanco centrado
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign='center';
      ctx.fillText('AMMO', px, py+4);
      ctx.textAlign='left';
    // ─── INSTA-KILL (morado con calavera) ───
    } else if (pk.type==='instakill') {
      // Fondo morado
      ctx.fillStyle = '#cc00cc';
      ctx.fillRect(px-12, py-12, 24, 24);
      // Borde morado claro
      ctx.strokeStyle='#ff44ff'; ctx.lineWidth=1;
      ctx.strokeRect(px-12,py-12,24,24);
      // Símbolo de calavera (☠) en blanco
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px monospace';
      ctx.textAlign='center';
      ctx.fillText('\u2620', px, py+5);
      ctx.textAlign='left';
      // Texto "INSTA" en morado claro arriba del icono
      ctx.fillStyle = '#ff44ff';
      ctx.font = 'bold 6px monospace';
      ctx.textAlign='center';
      ctx.fillText('INSTA', px, py-14);
      ctx.textAlign='left';
    // ─── DOBLE DISPARO (naranja con espadas) ───
    } else if (pk.type==='doubleshot') {
      // Fondo naranja oscuro
      ctx.fillStyle = '#cc6600';
      ctx.fillRect(px-12, py-12, 24, 24);
      // Borde naranja claro
      ctx.strokeStyle='#ff8800'; ctx.lineWidth=1;
      ctx.strokeRect(px-12,py-12,24,24);
      // Símbolo de espadas cruzadas (⚔) en naranja
      ctx.fillStyle = '#ff8800';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign='center';
      ctx.fillText('\u2694', px, py+4);
      ctx.textAlign='left';
      // Texto "2X" en naranja arriba del icono
      ctx.fillStyle = '#ff8800';
      ctx.font = 'bold 6px monospace';
      ctx.textAlign='center';
      ctx.fillText('2X', px, py-14);
      ctx.textAlign='left';
    // ─── MUNICIÓN INFINITA (azul con símbolo infinito) ───
    } else if (pk.type==='unlimitedammo') {
      // Fondo azul oscuro
      ctx.fillStyle = '#006688';
      ctx.fillRect(px-12, py-12, 24, 24);
      // Borde azul claro
      ctx.strokeStyle='#00ccff'; ctx.lineWidth=1;
      ctx.strokeRect(px-12,py-12,24,24);
      // Símbolo de infinito (∞) en azul claro
      ctx.fillStyle = '#00ccff';
      ctx.font = 'bold 14px monospace';
      ctx.textAlign='center';
      ctx.fillText('\u221E', px, py+5);
      ctx.textAlign='left';
      // Texto "AMMO" en azul claro arriba del icono
      ctx.fillStyle = '#00ccff';
      ctx.font = 'bold 6px monospace';
      ctx.textAlign='center';
      ctx.fillText('AMMO', px, py-14);
      ctx.textAlign='left';
    }
    ctx.restore();
  }
}
