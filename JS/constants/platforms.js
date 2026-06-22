// ─── PLATAFORMAS DEL ESCENARIO ───
// Define todas las plataformas flotantes del nivel.
// Tanto el jugador como los enemigos pueden saltar sobre ellas.
// Cada plataforma se define con su posición (x, y) y tamaño (w, h).
// x: posición horizontal desde el borde izquierdo del mundo
// y: posición vertical desde el borde superior del canvas
// w: ancho de la plataforma en píxeles
// h: grosor (alto) de la plataforma en píxeles
const PLATFORMS = [
  {x:300,  y:320, w:180, h:18},  // Plataforma 1 - cerca del inicio del mapa
  {x:580,  y:260, w:150, h:18},  // Plataforma 2 - más elevada que la anterior
  {x:820,  y:330, w:200, h:18},  // Plataforma 3 - ancha y a media altura
  {x:1050, y:200, w:160, h:18},  // Plataforma 4 - la más alta del recorrido
  {x:1300, y:300, w:140, h:18},  // Plataforma 5 - estrecha, pensada para saltos precisos
  {x:1520, y:240, w:180, h:18},  // Plataforma 6
  {x:1760, y:310, w:150, h:18},  // Plataforma 7
  {x:1980, y:260, w:170, h:18},  // Plataforma 8
  {x:2200, y:200, w:190, h:18},  // Plataforma 9 - ancha y elevada
  {x:2440, y:330, w:160, h:18},  // Plataforma 10 - baja, cerca del suelo
  {x:2680, y:270, w:145, h:18},  // Plataforma 11
  {x:2900, y:310, w:175, h:18},  // Plataforma 12 - última antes del final del mundo
];
