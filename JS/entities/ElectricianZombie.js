// ─── CLASE ELECTRICIANZOMBIE ───
// Zombie eléctrico que genera chispas y efectos visuales brillantes.
// Es resistente y ataca con descargas eléctricas.

class ElectricianZombie {
  // ─── CONSTRUCTOR ───
  // El constructor recibe la posición X donde aparecerá el zombie eléctrico
  // Este es un zombie especial con habilidades eléctricas y apariencia brillante
  constructor(x) {
    // ─── TIPO ───
    // Identificador único para este tipo de zombie
    this.type = 6;  // El tipo 6 es "Electricista", un zombie especial que NO está en la lista de tipos comunes (0-5)

    // ─── POSICIÓN ───
    // Dónde aparece el zombie eléctrico en el mapa
    this.x = x;          // Posición horizontal (columna) donde aparece
    this.y = 220;        // Posición vertical FIJA en 220 (NO usa GROUND_Y como los demás). Esto lo pone más arriba del suelo, como si flotara

    // ─── SALUD ───
    // El electricista tiene más vida que un zombie normal
    this.hp = 200; this.maxHp = 200;  // 200 de vida (más resistente que un zombie normal que tiene 60)

    // ─── MOVIMIENTO ───
    // Velocidad a la que se mueve
    this.speed = 70;  // 70 píxeles/segundo (velocidad media, comparable a un zombie normal)

    // ─── DAÑO ───
    // Cuánto daño hace al jugador al golpearlo
    this.damage = 18;  // 18 puntos de daño (casi el doble que un zombie normal de 10)

    // ─── TAMAÑO ───
    // Dimensiones del sprite y cuerpo de colisión
    this.height = 52;  // Altura del sprite en píxeles (ligeramente más alto que un zombie normal de 50px)
    this.w = 22;       // Ancho del rectángulo de colisión (similar a un zombie normal)

    // ─── FÍSICA ───
    // Variables para el movimiento y detección del entorno
    this.vx = 0; this.vy = 0;  // vx = velocidad horizontal, vy = velocidad vertical (para movimiento y gravedad)
    this.onGround = false;     // true si está tocando el suelo. Como su y=220, puede que no esté en el suelo normal
    this.dir = 1;              // Dirección: 1 = derecha, -1 = izquierda (para saber hacia dónde mirar al dibujar)

    // ─── ANIMACIÓN ───
    // Controla los cuadros de la animación del sprite
    this.animTimer = 0;  // Contador que aumenta con el tiempo. Cuando supera un límite, cambia el frame de animación

    // ─── MUERTE ───
    // Controla qué pasa cuando muere
    this.dead = false; this.deathTimer = 0.8;  // dead = true cuando hp llega a 0. deathTimer = 0.8 segundos antes de desaparecer

    // ─── SONIDO ───
    // Controla los sonidos aleatorios del zombie
    this.groanTimer = 1 + Math.random() * 3;  // Tiempo aleatorio entre 1 y 4 segundos antes de emitir un quejido

    // ─── ATAQUE ───
    // Frecuencia con la que puede atacar al jugador
    this.attackCooldown = 0;  // Si > 0, el zombie está en enfriamiento y no puede atacar. Disminuye cada frame hasta llegar a 0

    // ─── SALTO ───
    // Controla la capacidad de salto del zombie eléctrico
    this.jumpCooldown = 0;   // Si > 0, no puede saltar. Disminuye con el tiempo. Permite que el zombie salte hacia el jugador

    // ─── EFECTOS ELÉCTRICOS ───
    // Efectos visuales únicos de este tipo de zombie
    this.sparkTimer = Math.random() * 2;  // Temporizador aleatorio (0 a 2 segundos). Cuando llega a 0, genera una chispa eléctrica visual
    this.electricGlow = 0;                // Intensidad del brillo eléctrico alrededor del zombie (0 = sin brillo, valor alto = más brillante). Se usa para el efecto visual intermitente
  }
}
