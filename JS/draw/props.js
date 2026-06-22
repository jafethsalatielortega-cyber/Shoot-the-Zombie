// ─── DIBUJAR OBJETOS DEL ESCENARIO (PROPS) ───
// Dibuja un objeto decorativo según su tipo: barril, barricada o letrero
// Los props son elementos estáticos del escenario que no interactúan con la física
// Parámetros: contexto de dibujo, tipo de objeto ('barrel','barricade','sign'), posición (x,y)
function drawProp(ctx, type, x, y) {
  // Guarda el estado actual del contexto (posición, rotación, estilos)
  ctx.save();
  // ─── BARRIL ───
  if (type==='barrel') {
    // Sombra del barril proyectada en el suelo (elipse inclinada)
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath(); ctx.ellipse(x+3, y-2, 13, 4, 0, 0, Math.PI*2); ctx.fill();
    // Cuerpo del barril con degradado de color marrón (de claro a oscuro)
    const grad = ctx.createLinearGradient(x-12, y, x+12, y);
    grad.addColorStop(0,'#4a2a0a'); grad.addColorStop(0.6,'#7a4a1a'); grad.addColorStop(1,'#3a1a00');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(x, y-15, 12, 15, 0, 0, Math.PI*2);
    ctx.fill();
    // Líneas verticales del barril (laterales izquierdo y derecho)
    ctx.strokeStyle = '#2a1800'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(x-12,y-25); ctx.lineTo(x-12,y-5); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x+12,y-25); ctx.lineTo(x+12,y-5); ctx.stroke();
    // Aros horizontales del barril (cinturones metálicos)
    ctx.strokeStyle = '#8a5a2a'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.ellipse(x,y-20,11,3,0,0,Math.PI*2); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(x,y-10,11,3,0,0,Math.PI*2); ctx.stroke();
    // Brillo sutil en la parte superior para dar efecto de iluminación
    ctx.fillStyle='rgba(255,200,100,0.2)';
    ctx.beginPath(); ctx.ellipse(x-3,y-22,4,8,-.3,0,Math.PI*2); ctx.fill();
  // ─── BARRICADA ───
  } else if (type==='barricade') {
    // Sombra de la barricada en el suelo
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(x-28, y, 56, 4);
    // Tablones horizontales (dos niveles: superior e inferior)
    ctx.fillStyle = '#5a4020';
    ctx.fillRect(x-25, y-35, 50, 10);
    ctx.fillRect(x-20, y-25, 40, 10);
    // Postes verticales que sostienen los tablones
    ctx.fillRect(x-30, y-42, 10, 40);
    ctx.fillRect(x+20, y-42, 10, 40);
    // Bordes de los tablones para darles profundidad
    ctx.strokeStyle='#7a6040'; ctx.lineWidth=1;
    ctx.strokeRect(x-25,y-35,50,10);
    ctx.strokeRect(x-20,y-25,40,10);
  // ─── LETRERO ───
  } else if (type==='sign') {
    // Sombra del poste proyectada en el suelo
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath(); ctx.ellipse(x+3, y, 8, 3, 0, 0, Math.PI*2); ctx.fill();
    // Poste vertical de metal
    ctx.fillStyle = '#666';
    ctx.fillRect(x-3, y-45, 6, 45);
    // Cartel (panel rectangular donde va el texto)
    ctx.fillStyle = '#888';
    ctx.fillRect(x-20, y-50, 40, 20);
    ctx.strokeStyle='#aaa'; ctx.lineWidth=1;
    ctx.strokeRect(x-20,y-50,40,20);
    // Zona de texto del cartel (rectángulo interior más oscuro)
    ctx.fillStyle='#444';
    ctx.fillRect(x-15,y-47,30,14);
  }
  // Restaura el estado del contexto al original
  ctx.restore();
}
