// ─── VIEWPORT RESPONSIVE DEL JUEGO ───
// Mantiene las físicas verticales en 480 unidades y adapta únicamente el ancho
// lógico en pantallas táctiles. Así no se deforma ni se vuelve diminuto en retrato.
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });

let scale = 1;
let viewportScaleX = 1;
let viewportScaleY = 1;
let isCompactViewport = false;
let isPortraitViewport = false;

const coarsePointerQuery = window.matchMedia ? window.matchMedia('(pointer: coarse)') : null;
const reducedMotionQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
const lowPerformanceMode = Boolean(
  (navigator.deviceMemory && navigator.deviceMemory <= 4) ||
  (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) ||
  (reducedMotionQuery && reducedMotionQuery.matches)
);
const effectQuality = lowPerformanceMode ? 0.55 : 1;

function hasTouchInput() {
  return navigator.maxTouchPoints > 0 || ('ontouchstart' in window) ||
    Boolean(coarsePointerQuery && coarsePointerQuery.matches);
}

function shouldUseTouchLayout() {
  // El segundo caso cubre navegadores/escritorios muy estrechos y emuladores que
  // no exponen maxTouchPoints, manteniendo disponibles también teclado y mouse.
  return hasTouchInput() || (window.innerWidth < 600 && window.innerHeight > window.innerWidth);
}

function getSafeAreaInsets() {
  const style = getComputedStyle(document.body);
  return {
    top: parseFloat(style.paddingTop) || 0,
    right: parseFloat(style.paddingRight) || 0,
    bottom: parseFloat(style.paddingBottom) || 0,
    left: parseFloat(style.paddingLeft) || 0,
  };
}

let resizeFrame = 0;
function resizeCanvas() {
  cancelAnimationFrame(resizeFrame);
  resizeFrame = requestAnimationFrame(function applyResponsiveViewport() {
    const vv = window.visualViewport;
    const safe = getSafeAreaInsets();
    const viewportW = Math.max(1, vv ? vv.width : window.innerWidth);
    const viewportH = Math.max(1, vv ? vv.height : window.innerHeight);
    const availableW = Math.max(1, viewportW - safe.left - safe.right);
    const availableH = Math.max(1, viewportH - safe.top - safe.bottom);
    const touchLayout = shouldUseTouchLayout();

    isPortraitViewport = availableH > availableW;
    isCompactViewport = touchLayout && (isPortraitViewport || availableW < 900 || availableH < 560);

    const nextLogicalW = touchLayout
      ? Math.max(320, Math.min(BASE_LOGICAL_W, Math.round(LOGICAL_H * availableW / availableH)))
      : BASE_LOGICAL_W;
    const logicalChanged = LOGICAL_W !== nextLogicalW;
    LOGICAL_W = nextLogicalW;

    const nextScale = Math.min(availableW / LOGICAL_W, availableH / LOGICAL_H);
    const cssW = Math.max(1, Math.floor(LOGICAL_W * nextScale));
    const cssH = Math.max(1, Math.floor(LOGICAL_H * nextScale));
    const offsetLeft = (vv ? vv.offsetLeft : 0) + safe.left + Math.floor((availableW - cssW) / 2);
    const offsetTop = (vv ? vv.offsetTop : 0) + safe.top + Math.floor((availableH - cssH) / 2);

    if (canvas.width !== LOGICAL_W) canvas.width = LOGICAL_W;
    if (canvas.height !== LOGICAL_H) canvas.height = LOGICAL_H;
    canvas.style.width = cssW + 'px';
    canvas.style.height = cssH + 'px';
    canvas.style.left = offsetLeft + 'px';
    canvas.style.top = offsetTop + 'px';
    canvas.style.imageRendering = lowPerformanceMode || availableW > 1800 ? 'auto' : 'pixelated';

    scale = nextScale;
    viewportScaleX = cssW / LOGICAL_W;
    viewportScaleY = cssH / LOGICAL_H;
    document.body.classList.toggle('touch-mode', touchLayout);

    window.dispatchEvent(new CustomEvent('gameviewportchange', {
      detail: { logicalWidth: LOGICAL_W, logicalHeight: LOGICAL_H, logicalChanged,
        portrait: isPortraitViewport, compact: isCompactViewport }
    }));
  });
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas, { passive: true });
window.addEventListener('orientationchange', resizeCanvas, { passive: true });
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', resizeCanvas, { passive: true });
  window.visualViewport.addEventListener('scroll', resizeCanvas, { passive: true });
}
if (coarsePointerQuery && coarsePointerQuery.addEventListener) {
  coarsePointerQuery.addEventListener('change', resizeCanvas);
}
