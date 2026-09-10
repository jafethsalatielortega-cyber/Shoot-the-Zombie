// ─── PARTÍCULAS ───
// Lista global que almacena todas las partículas activas (sangre, explosiones, cenizas, etc.)
const particles = [];

// Crea una cantidad 'count' de partículas con propiedades aleatorias dentro de un rango
// Útil como base para explosiones, sangre, fogonazos, etc.
// Parámetros: cantidad, posición (x,y), color, velocidad, dispersión (radianes), gravedad, tamaño, vida (segundos)
function spawnParticles(count, x, y, color, speed, spread, gravity, size, life) {
  // Bucle que se repite tantas veces como partículas queramos crear
  for (let i=0; i<count; i++) {
    // Calcula un ángulo aleatorio dentro del rango indicado (spread)
    const a = Math.random() * spread - spread/2;
    // Agrega una nueva partícula al arreglo global con sus propiedades iniciales
    particles.push({
      x, y,                                       // Posición inicial (centro del origen)
      vx: Math.cos(a) * (speed * (0.5 + Math.random()*0.5)),  // Velocidad horizontal con variación aleatoria
      vy: Math.sin(a) * (speed * (0.5 + Math.random()*0.5)),  // Velocidad vertical con variación aleatoria
      life: life * (0.7 + Math.random()*0.3),     // Vida útil con un poco de aleatoriedad
      maxLife: life,                              // Vida máxima (se usa para calcular transparencia)
      color, gravity,                             // Color y gravedad que afectará a la partícula
      size: size * (0.5 + Math.random()*0.5),     // Tamaño con variación aleatoria
    });
  }
}

// ─── SANGRE ───
// Genera partículas rojas simulando sangre al golpear a un enemigo
function spawnBlood(x, y) {
  // Primera capa de sangre (8 partículas rojo oscuro más rápidas)
  spawnParticles(8, x, y, '#8b0000', 200, Math.PI, GRAVITY, 3, 0.5);
  // Segunda capa de sangre (4 partículas rojo brillante un poco más lentas)
  spawnParticles(4, x, y, '#cc0000', 120, Math.PI, GRAVITY, 2, 0.4);
}

// ─── RESTOS DE MUERTE ───
// Crea fragmentos rectangulares que salen disparados al destruir un enemigo
function spawnDeathParts(x, y, color) {
  // Genera 12 fragmentos que vuelan en todas direcciones
  for (let i=0; i<12; i++) {
    // Ángulo aleatorio en un círculo completo (0 a 2*PI radianes)
    const a = Math.random() * Math.PI * 2;
    // Velocidad aleatoria entre 80 y 200 píxeles/segundo
    const s = 80 + Math.random()*120;
    particles.push({
      x: x + (Math.random()-0.5)*20, y,            // Posición con pequeño desplazamiento horizontal
      vx: Math.cos(a)*s,                            // Velocidad horizontal según el ángulo
      vy: Math.sin(a)*s - 100,                      // Velocidad vertical con impulso hacia arriba (-100)
      life: 0.8, maxLife: 0.8,                      // Vida corta de 0.8 segundos
      color, gravity: GRAVITY,                      // Color proporcionado y gravedad normal
      size: 4 + Math.random()*6,                    // Tamaño aleatorio entre 4 y 10
      isRect: true,                                 // Se dibujará como rectángulo (no como círculo)
    });
  }
}

// ─── EXPLOSIÓN ───
// Genera una explosión con colores naranja, amarillo y rojo, más fragmentos grises que flotan
function spawnExplosion(x, y) {
  // Capa principal naranja (20 partículas rápidas)
  spawnParticles(20, x, y, '#ff6600', 300, Math.PI*2, GRAVITY, 5, 0.6);
  // Capa secundaria amarilla (15 partículas medianas)
  spawnParticles(15, x, y, '#ffcc00', 200, Math.PI*2, GRAVITY, 3, 0.4);
  // Capa de destellos rojos (10 partículas grandes)
  spawnParticles(10, x, y, '#ff3300', 150, Math.PI*2, GRAVITY, 6, 0.5);
  // Fragmentos grises que flotan hacia arriba (humo/escombros)
  for (let i=0; i<8; i++) {
    // Cada fragmento va en una dirección aleatoria
    const a = Math.random() * Math.PI * 2;
    particles.push({
      x, y,
      vx: Math.cos(a) * (30 + Math.random()*40),  // Velocidad horizontal baja (se aleja lentamente)
      vy: -80 - Math.random()*60,                   // Velocidad negativa = se eleva (humo)
      life: 1.2, maxLife: 1.2,                      // Vida de 1.2 segundos
      color: '#666', gravity: -50,                  // Gravedad negativa = flota hacia arriba
      size: 10 + Math.random()*15,                  // Fragmentos grandes (10 a 25 píxeles)
    });
  }
}

// ─── FOGONAZO ───
// Pequeñas partículas que aparecen en la boca del cañón al disparar
function spawnMuzzle(x, y, col) {
  // 5 partículas, velocidad 180, dispersión estrecha (1.2 rad), sin gravedad, tamaño 2.5, vida muy corta (0.08s)
  spawnParticles(5, x, y, col, 180, 1.2, 0, 2.5, 0.08);
}

// ─── CENIZAS VOLADORAS ───
// Genera cenizas que caen desde arriba para dar ambiente al escenario (máx. 45)
// Se llama en cada frame, pero respeta el límite para no saturar el rendimiento
function spawnAsh() {
  // Solo crea cenizas si hay menos de 45 en pantalla (para no saturar)
  if (particles.filter(p=>p.isAsh).length < 45) {
    particles.push({
      x: Math.random()*LOGICAL_W*2, y: -5,            // Aparecen en la parte superior en cualquier X
      vx: -10 + Math.random()*5,                        // Se mueven un poco a la izquierda
      vy: 15 + Math.random()*20,                        // Caen hacia abajo a velocidad variable
      life: 8, maxLife: 8,                              // Viven 8 segundos antes de desaparecer
      color: Math.random()>0.5 ? '#aaa' : '#888',      // Color gris claro u oscuro aleatorio
      gravity: 0, size: 1+Math.random()*2, isAsh: true, // Sin gravedad, tamaño pequeño, marcadas como ceniza
    });
  }
}

// ─── ACTUALIZAR PARTÍCULAS ───
// Aplica gravedad, movimiento y desgaste de vida a cada partícula.
// Recorre el arreglo en reversa para eliminar las que ya expiraron sin problemas.
function updateParticles(dt) {
  // Recorre el arreglo en reversa para poder eliminar elementos sin afectar índices
  for (let i=particles.length-1; i>=0; i--) {
    const p = particles[i];
    // Aplica gravedad a la velocidad vertical (si tiene)
    p.vy += (p.gravity||0) * dt;
    // Actualiza la posición según la velocidad y el tiempo transcurrido
    p.x  += p.vx * dt;
    p.y  += p.vy * dt;
    // Reduce la vida de la partícula
    p.life -= dt;
    // Si la vida se acaba, elimina la partícula del arreglo
    if (p.life <= 0) particles.splice(i,1);
  }
}

// ─── DIBUJAR PARTÍCULAS ───
// Dibuja cada partícula con su transparencia (alpha) según la vida restante.
// Las cenizas (isAsh) ignoran el desplazamiento de cámara.
// Las partículas rectangulares (isRect) se dibujan como rectángulos, el resto como círculos.
function drawParticles(camX) {
  // Recorre todas las partículas activas
  for (const p of particles) {
    // Calcula la transparencia según la vida restante (1 = opaco, 0 = invisible)
    const alpha = p.life / p.maxLife;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    // Las cenizas no se mueven con la cámara (efecto parallax), el resto sí
    const wx = p.isAsh ? p.x : p.x - camX;
    // Si es rectangular se dibuja con fillRect, si no, con un círculo (arc)
    if (p.isRect) {
      ctx.fillRect(wx - p.size/2, p.y - p.size/2, p.size, p.size);
    } else {
      ctx.beginPath();
      ctx.arc(wx, p.y, p.size, 0, Math.PI*2);
      ctx.fill();
    }
  }
  // Restaura la opacidad normal para los siguientes dibujos
  ctx.globalAlpha = 1;
}
