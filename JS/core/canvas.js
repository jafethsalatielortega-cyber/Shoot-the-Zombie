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

// ─── REDIMENSIONADO ───

// Ajusta el tamaño visual del canvas para que encaje en la ventana
// sin deformar la resolución lógica interna del juego.
function resize() {
  const sw = window.innerWidth / LOGICAL_W;   // Escala horizontal
  const sh = window.innerHeight / LOGICAL_H;   // Escala vertical
  scale = Math.min(sw, sh);                     // Usa la escala más pequeña para evitar recortes
  canvas.width  = LOGICAL_W;                    // Tamaño interno fijo (lógico)
  canvas.height = LOGICAL_H;
  canvas.style.width  = (LOGICAL_W * scale) + 'px';  // Tamaño visual escalado
  canvas.style.height = (LOGICAL_H * scale) + 'px';
}
resize();                                      // Aplica el tamaño inicial al cargar la página
// Reajusta el canvas cuando el usuario cambia el tamaño de la ventana
window.addEventListener('resize', resize);

// ─── [NEW] UNIVERSAL CANVAS SCALING ───
// Reemplaza el escalado básico por uno que centra el canvas en cualquier
// pantalla: teléfonos, tablets, laptops, Smart TVs 4K.
function resizeCanvas() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const scaleX = vw / LOGICAL_W;
  const scaleY = vh / LOGICAL_H;
  scale = Math.min(scaleX, scaleY);
  canvas.width = LOGICAL_W;
  canvas.height = LOGICAL_H;
  canvas.style.position = 'absolute';
  canvas.style.width = Math.floor(LOGICAL_W * scale) + 'px';
  canvas.style.height = Math.floor(LOGICAL_H * scale) + 'px';
  canvas.style.left = Math.floor((vw - LOGICAL_W * scale) / 2) + 'px';
  canvas.style.top = Math.floor((vh - LOGICAL_H * scale) / 2) + 'px';
  // Smart TV 4K: imagen suave en vez de pixelada
  canvas.style.imageRendering = vw > 1800 ? 'auto' : 'pixelated';
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);
window.addEventListener('orientationchange', resizeCanvas);
