// ─── OBJETOS DECORATIVOS / INTERACTIVOS DEL ESCENARIO ───
// Define los objetos (props) que aparecen en el mundo, colocados sobre el suelo (GROUND_Y).
// Cada prop tiene un tipo que determina su comportamiento:
//   'barrel'    → barril explosivo que daña a entidades cercanas al explotar
//   'barricade' → obstáculo destructible que bloquea el paso
//   'sign'      → letrero decorativo sin interacción
const PROPS = [
  {type:'barrel', x:420, y:GROUND_Y},
  {type:'barrel', x:700, y:GROUND_Y},
  {type:'barricade', x:960, y:GROUND_Y},
  {type:'sign', x:1200, y:GROUND_Y},
  {type:'barrel', x:1450, y:GROUND_Y},
  {type:'barricade', x:1700, y:GROUND_Y},
  {type:'sign', x:2000, y:GROUND_Y},
  {type:'barrel', x:2300, y:GROUND_Y},
  {type:'barricade', x:2600, y:GROUND_Y},
  {type:'barrel', x:2850, y:GROUND_Y},
];
