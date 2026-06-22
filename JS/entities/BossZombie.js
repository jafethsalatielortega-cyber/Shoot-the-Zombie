// ─── CLASE BOSSZOMBIE ───
// Jefe final que aparece cada 5 oleadas.
// Es más grande, fuerte y resistente que los zombies comunes.

class BossZombie {
  // ─── CONSTRUCTOR ───
  // El constructor recibe el número de oleada (wave) para calcular la dificultad del jefe
  // Los jefes aparecen cada 5 oleadas y se vuelven más fuertes progresivamente
  constructor(wave) {
    // ─── CÁLCULO DE DIFICULTAD ───
    // bossNth indica cuál jefe es (1er jefe en wave 5-9, 2do jefe en wave 10-14, etc.)
    // Math.floor redondea hacia abajo: si wave=5, bossNth=1. Si wave=12, bossNth=2.
    const bossNth = Math.floor(wave / 5);

    // ─── SALUD ───
    // La vida aumenta con cada jefe: el primero tiene 500, el segundo 600, el tercero 700, etc.
    this.maxHp = 500 + (bossNth - 1) * 100;  // Fórmula: 500 de base + 100 por cada jefe adicional
    this.hp = this.maxHp;                     // Al crearse, el jefe tiene la vida al máximo (sin daño recibido)

    // ─── MOVIMIENTO ───
    // Velocidad constante a la que el jefe se mueve hacia el jugador
    this.speed = 72;  // 72 píxeles por segundo (más lento que los zombies normales, pero más imponente)

    // ─── TAMAÑO ───
    // El jefe es mucho más grande que los zombies comunes
    this.w = 50;        // w = ancho del cuerpo (para colisiones). Casi el doble que un zombie normal
    this.height = 120;  // Altura del sprite (más del doble que un zombie común de 50px)

    // ─── DAÑO ───
    // Daño que hace el jefe al jugador cada vez que lo golpea
    this.damage = 20;  // 20 puntos de daño por golpe (un zombie normal hace 10)

    // ─── POSICIÓN ───
    // Dónde aparece el jefe en el mapa
    this.x = 0;          // Comienza en el borde izquierdo de la pantalla (x=0) y avanza hacia la derecha
    this.y = GROUND_Y;   // El jefe está al nivel del suelo, igual que los demás zombies

    // ─── FÍSICA ───
    // Variables para el movimiento y detección de colisiones del jefe
    this.vx = 0;          // Velocidad horizontal: cuánto se mueve por segundo en el eje X
    this.vy = 0;          // Velocidad vertical: cuánto se mueve por segundo en el eje Y (para saltos o caídas)
    this.dir = 1;         // Dirección: 1 = mirando hacia la derecha, -1 = mirando hacia la izquierda
    this.onGround = false; // true si el jefe está tocando el suelo, false si está en el aire

    // ─── MUERTE ───
    // Controla el estado de muerte del jefe
    this.dead = false;      // false mientras el jefe está vivo, true cuando su hp llega a 0
    this.deathTimer = 0;    // Cuando dead = true, este temporizador cuenta los segundos para la animación de muerte

    // ─── ANIMACIÓN ───
    // Controla los frames de animación del sprite del jefe
    this.animTimer = 0;  // Contador que aumenta con el tiempo. Al llegar al límite, cambia el frame del dibujo

    // ─── ATAQUE ───
    // Controla los ataques especiales del jefe (como lanzar proyectiles o embestir)
    this.attackTimer = 2.0;       // Cada 2 segundos el jefe puede ejecutar un ataque especial. Va disminuyendo hasta 0 y se reinicia

    // ─── CONTACTO ───
    // Evita que el jefe dañe al jugador en CADA frame mientras esté tocándolo
    this.contactCooldown = 0;  // Si > 0, el jefe no puede dañar por contacto. Se reinicia cada vez que daña. Evita daño continuo

    // ─── EFECTO DE MUERTE ───
    // Efecto visual espectacular cuando el jefe muere
    this.deathCircles = null;  // Comienza como null. Al morir el jefe, aquí se guardan los círculos de partículas que se expanden (efecto de explosión)
  }
}
