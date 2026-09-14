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
// Escala interna de render. En telefonos evita dibujar muchos mas pixeles de
// los que realmente se muestran; las coordenadas logicas siguen siendo 1280x480.
let canvasRenderScale = 1;

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

  const coarsePointer = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  const phoneSized = coarsePointer && Math.min(vw, vh) < 600;
  canvasRenderScale = phoneSized ? Math.max(0.65, Math.min(1, scale)) : 1;
  const backingWidth = Math.max(1, Math.round(LOGICAL_W * canvasRenderScale));
  const backingHeight = Math.max(1, Math.round(LOGICAL_H * canvasRenderScale));

  // En telefono el buffer se aproxima al tamaño visible. setTransform conserva
  // todas las coordenadas y mecanicas originales del juego.
  if (canvas.width !== backingWidth) canvas.width = backingWidth;
  if (canvas.height !== backingHeight) canvas.height = backingHeight;
  ctx.setTransform(canvasRenderScale, 0, 0, canvasRenderScale, 0, 0);
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
