// ─── CONSTRUIR COLA DE SPAWN ───
// Crea una cola con los tipos de zombies que aparecerán en esta oleada
// y los mezcla aleatoriamente (algoritmo de Fisher-Yates).
// Cada tipo de zombie se agrega tantas veces como indique la configuración
// de la oleada (getWaveConfig). La mezcla aleatoria asegura que el orden
// de aparición sea impredecible.
// Recibe el número de oleada y devuelve un arreglo con los tipos de zombies en orden aleatorio
function buildWaveQueue(wave) {
  const q = [];                                  // Cola vacía de tipos de zombie
  const cfg = getWaveConfig(wave);               // Obtiene la configuración de la oleada (cantidad de cada tipo)
  // Calcula el total de zombies que tendrá esta oleada sumando todos los tipos
  gs.zombiesTotalThisWave = cfg.shamblers + cfg.runners + cfg.brutes + (cfg.shooters||0) + (cfg.bombers||0);
  // Agrega cada zombie según su tipo:
  // Los números representan el tipo de zombie:
  for (let i=0; i<cfg.shamblers; i++) q.push(0); // Tipo 0 = Shambler (zombie básico, lento pero resistente)
  for (let i=0; i<cfg.runners;   i++) q.push(1); // Tipo 1 = Runner (rápido, poca vida)
  for (let i=0; i<cfg.brutes;    i++) q.push(2); // Tipo 2 = Brute (tanque, mucha vida, sacude la pantalla)
  for (let i=0; i<(cfg.shooters||0); i++) q.push(4); // Tipo 4 = Shooter (dispara balas al jugador)
  for (let i=0; i<(cfg.bombers||0);  i++) q.push(5); // Tipo 5 = Bomber (explota al acercarse)
  // Baraja la cola para que el orden de aparición sea aleatorio
  // Algoritmo de Fisher-Yates: intercambia cada elemento con otro al azar
  // Esto evita que todos los zombies del mismo tipo aparezcan juntos
  for (let i=q.length-1; i>0; i--) {
    const j = Math.floor(Math.random()*(i+1));
    [q[i],q[j]]=[q[j],q[i]];
  }
  return q;
}

// ─── APLICAR MODIFICADORES DE OLEADA ───
// Aplica mejoras especiales a ciertos zombies según el modificador activo de la oleada
// Recibe el zombie (z) y el número de oleada (wave) para consultar la configuración
function applyWaveMods(z, wave) {
  const cfg = getWaveConfig(wave);
  // Si el modificador es "runnerSpeedUp", los Runners (tipo 1) son un 20% más rápidos
  if (cfg.special === 'runnerSpeedUp' && z.type === 1) { z.speed *= 1.2; z.speed *= 1.2; }
  // Si el modificador es "shamblerDamageUp", los Shamblers (tipo 0) hacen 5 de daño extra
  if (cfg.special === 'shamblerDamageUp' && z.type === 0) { z.damage += 5; }
  // Si el modificador es "bruteHpUp", los Brutes (tipo 2) tienen 50 de vida adicional
  if (cfg.special === 'bruteHpUp' && z.type === 2) { z.hp += 50; z.maxHp += 50; }
  // Si el modificador es "allSpeedUp", todos los zombies son un 10% más rápidos
  if (cfg.special === 'allSpeedUp') { z.speed *= 1.1; }
  // Si el modificador es "nightmare" (modo pesadilla, oleada >= 10):
  // todos son 15% más rápidos y tienen 20% más de vida
  if (cfg.special === 'nightmare') { z.speed *= 1.15; z.hp = Math.floor(z.hp * 1.2); z.maxHp = Math.floor(z.maxHp * 1.2); }
}

// ─── SPAWNEAR PRÓXIMO ZOMBIE ───
// Toma el siguiente tipo de zombie de la cola, calcula una posición fuera de pantalla
// (izquierda o derecha) y lo crea, aplicando los modificadores de oleada correspondientes
function spawnNextZombie(gs) {
  if (gs.zombiesToSpawn.length===0) return;               // No hay más zombies por spawnear, sale de la función
  const type = gs.zombiesToSpawn.shift();                  // Obtiene el siguiente tipo de la cola (y lo elimina)
  const p = gs.player;
  let sx;
  // Decide aleatoriamente si el zombie aparece por la izquierda o por la derecha de la cámara
  if (Math.random()<0.5) {
    sx = gs.camX - 80;                                     // Fuera de la pantalla por la izquierda
  } else {
    sx = gs.camX + LOGICAL_W + 80;                         // Fuera de la pantalla por la derecha
  }
  // Limita la posición dentro de los límites del mundo (WORLD_W es el ancho total del nivel)
  sx = Math.max(50, Math.min(WORLD_W-50, sx));
  // Si el spawn queda muy cerca del jugador (menos de 400px), lo aleja para que no aparezca encima
  if (Math.abs(sx - p.x) < 400) sx = p.x + (sx < p.x ? -450 : 450);
  // Vuelve a limitar la posición tras el ajuste
  sx = Math.max(50, Math.min(WORLD_W-50, sx));
  // Crea la instancia del zombie con el tipo y posición calculados
  const z = new Zombie(type, sx);
  // Aplica los modificadores especiales de la oleada al zombie
  applyWaveMods(z, gs.wave);
  // Agrega el zombie a la lista de zombies activos
  gs.zombies.push(z);
  // Incrementa el contador de zombies que faltan por spawnear
  gs.zombiesRemaining++;
}
