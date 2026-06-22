// ─── TEXTOS FLOTANTES ───
// Arreglo global con todos los textos flotantes activos (daño, mensajes, etc.)
const floatTexts = [];

// ─── CREAR TEXTO FLOTANTE ───
// Agrega un texto que sube y se desvanece; se usa típicamente para mostrar daño recibido
// Parámetros: texto a mostrar, posición (x,y), color (blanco por defecto)
function spawnFloat(text, x, y, color='#fff') {
  // Agrega un objeto con el texto, posición, color, vida y vida máxima (0.7 segundos)
  floatTexts.push({text, x, y, life:0.7, maxLife:0.7, color});
}

// ─── ACTUALIZAR TEXTOS FLOTANTES ───
// Mueve los textos hacia arriba y reduce su vida; elimina los que se desvanecieron
function updateFloatTexts(dt) {
  // Recorre en reversa para poder eliminar elementos sin problemas
  for (let i=floatTexts.length-1; i>=0; i--) {
    // Mueve el texto hacia arriba (Y disminuye) a 30 píxeles por segundo
    floatTexts[i].y -= 30 * dt;
    // Reduce la vida del texto según el tiempo transcurrido
    floatTexts[i].life -= dt;
    // Si la vida llegó a cero, elimina el texto del arreglo
    if (floatTexts[i].life <= 0) floatTexts.splice(i,1);
  }
}

// ─── DIBUJAR TEXTOS FLOTANTES ───
// Dibuja cada texto con transparencia según su vida restante
function drawFloatTexts(camX) {
  // Guarda el estado actual del contexto de dibujo
  ctx.save();
  // Recorre todos los textos flotantes activos
  for (const t of floatTexts) {
    // Calcula la transparencia: entre 1 (vida llena) y 0 (a punto de desaparecer)
    ctx.globalAlpha = t.life / t.maxLife;
    ctx.fillStyle = t.color;
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    // Dibuja el texto en su posición ajustada por la cámara
    ctx.fillText(t.text, t.x - camX, t.y);
  }
  // Restaura la opacidad y el estado del contexto
  ctx.globalAlpha = 1;
  ctx.restore();
}
