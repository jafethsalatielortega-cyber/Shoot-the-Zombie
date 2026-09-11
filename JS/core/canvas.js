// ─── CONFIGURACIÓN DEL LIENZO (CANVAS) ───
// Inicializa el canvas del juego y su contexto de renderizado 2D.
// El canvas usa una resolución lógica fija (LOGICAL_W x LOGICAL_H)
// y se escala visualmente para llenar la ventana del navegador.

// Obtiene el elemento <canvas> del HTML por su id "c"
const canvas = document.getElementById('c');
// Obtiene el contexto de renderizado 2D para dibujar en el canvas
const ctx = canvas.getContext('2d');
// Factor de escala que adapta el canvas a la ventana del navegador
let scale = 1;

// ─── REDIMENSIONADO ESTABLE ───
// Usa un único cálculo por frame. visualViewport representa el área realmente
// visible en móviles y evita saltos cuando aparecen/desaparecen las barras del
// navegador o al entrar en pantalla completa.
let resizeFrame = 0;

function applyCanvasSize() {
  resizeFrame = 0;
  const viewport = window.visualViewport;
  const vw = Math.max(1, viewport ? viewport.width : document.documentElement.clientWidth);
  const vh = Math.max(1, viewport ? viewport.height : document.documentElement.clientHeight);
  const vx = viewport ? viewport.offsetLeft : 0;
  const vy = viewport ? viewport.offsetTop : 0;
  const bodyStyle = window.getComputedStyle(document.body);
  const safeTop = parseFloat(bodyStyle.paddingTop) || 0;
  const safeRight = parseFloat(bodyStyle.paddingRight) || 0;
  const safeBottom = parseFloat(bodyStyle.paddingBottom) || 0;
  const safeLeft = parseFloat(bodyStyle.paddingLeft) || 0;
  const usableWidth = Math.max(1, vw - safeLeft - safeRight);
  const usableHeight = Math.max(1, vh - safeTop - safeBottom);

  scale = Math.min(usableWidth / LOGICAL_W, usableHeight / LOGICAL_H);
  const renderedWidth = LOGICAL_W * scale;
  const renderedHeight = LOGICAL_H * scale;

  // La resolución lógica nunca cambia; así el contexto no se reinicia durante
  // los eventos de resize emitidos por el navegador móvil.
  if (canvas.width !== LOGICAL_W) canvas.width = LOGICAL_W;
  if (canvas.height !== LOGICAL_H) canvas.height = LOGICAL_H;
  canvas.style.width = renderedWidth + 'px';
  canvas.style.height = renderedHeight + 'px';
  canvas.style.left = (vx + safeLeft + (usableWidth - renderedWidth) / 2) + 'px';
  canvas.style.top = (vy + safeTop + (usableHeight - renderedHeight) / 2) + 'px';
  canvas.style.imageRendering = vw > 1800 ? 'auto' : 'pixelated';
}

function resizeCanvas() {
  if (resizeFrame) cancelAnimationFrame(resizeFrame);
  resizeFrame = requestAnimationFrame(applyCanvasSize);
}

applyCanvasSize();
window.addEventListener('resize', resizeCanvas, { passive: true });
window.addEventListener('orientationchange', resizeCanvas, { passive: true });
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', resizeCanvas, { passive: true });
  window.visualViewport.addEventListener('scroll', resizeCanvas, { passive: true });
}
