// ─── DIBUJAR FOGONAZO ───
// Pequeña explosión de luz en la boca del cañón al disparar (6 puntas triangulares)
// Crea una estrella de 6 puntas con triángulos amarillos que simula la llama del disparo
// Recibe las coordenadas (x, y) donde aparecerá el fogonazo y el arma que se está usando
function drawMuzzleFlash(x, y, weapon) {
  // Guarda el estado actual del contexto de dibujo
  ctx.save();
  // Traslada el origen al punto donde debe aparecer el fogonazo
  ctx.translate(x, y);
  // Color amarillo claro para la llama del fogonazo
  ctx.fillStyle = '#ffdd55';
  // Dibuja 6 triángulos dispuestos en círculo (como una estrella de 6 puntas)
  for (let i=0; i<6; i++) {
    // Calcula el ángulo para cada punta (cada 60 grados = PI/3 radianes)
    const a = i * Math.PI/3;
    ctx.beginPath();
    // Punto central del fogonazo
    ctx.moveTo(0,0);
    // Primer lado del triángulo (se extiende 10px hacia afuera)
    ctx.lineTo(Math.cos(a)*10, Math.sin(a)*10);
    // Segundo lado del triángulo (se extiende 5px con un pequeño desplazamiento)
    ctx.lineTo(Math.cos(a+0.3)*5, Math.sin(a+0.3)*5);
    // Rellena el triángulo con el color amarillo
    ctx.fill();
  }
  // Restaura el contexto de dibujo a su estado original
  ctx.restore();
}
