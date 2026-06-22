// ─── CLASE ZOMBIE ───
// Representa un zombie común o de tipo especial.
// Cada tipo tiene estadísticas distintas de vida, velocidad, daño y tamaño.

class Zombie {
  // ─── CONSTRUCTOR ───
  // El constructor recibe el tipo de zombie (0 al 5) y su posición X inicial
  // type: 0=Normal, 1=Rápido (veloz), 2=Grande (tanque), 3=Saltador (brinca), 4=Lento, 5=Explosivo (corre rápido y explota)
  constructor(type, x) {
    // ─── TIPO Y POSICIÓN ───
    // Guarda el tipo de zombie y dónde aparece en el mapa
    this.type = type;      // Número del 0 al 5 que define qué tipo de zombie es (sus stats dependen de esto)
    this.x = x;            // Posición horizontal (columna) donde aparece el zombie
    this.y = GROUND_Y;     // Posición vertical (altura) - GROUND_Y es el nivel del suelo, todos los zombies comunes comienzan ahí

    // ─── DEFINICIONES DE TIPOS ───
    // Aquí definimos las estadísticas base para CADA tipo de zombie
    // Cada objeto contiene: hp = vida, spd = velocidad (pixeles/segundo), dmg = daño al golpear, h = altura del sprite
    const defs = [
      {hp:60,spd:60,dmg:10,h:50},   // [0] Normal: equilibrio entre vida, velocidad y daño
      {hp:40,spd:160,dmg:15,h:45},  // [1] Rápido: poca vida pero muy veloz y daño medio
      {hp:200,spd:40,dmg:25,h:80},  // [2] Grande: mucha vida, lento, mucho daño, sprite alto
      {hp:80,spd:120,dmg:12,h:48},  // [3] Saltador: puede saltar obstáculos, stats medios
      {hp:40,spd:50,dmg:10,h:50},   // [4] Lento: poca vida, muy lento, daño básico
      {hp:40,spd:180,dmg:0,h:48}    // [5] Explosivo: poca vida, muy rápido, daño 0 (explota al morir)
    ];
    const d = defs[type]; // d contiene las stats del tipo específico que se está creando

    // ─── ESTADÍSTICAS ───
    // Asigna las estadísticas del tipo elegido a las propiedades del zombie
    this.hp = d.hp; this.maxHp = d.hp; // hp = vida actual (va disminuyendo al recibir daño). maxHp = vida máxima (con la que empieza)
    this.speed = d.spd;                 // Velocidad a la que el zombie se mueve hacia el jugador (pixeles por segundo)
    this.damage = d.dmg;                // Daño que el zombie inflige al jugador cuando lo golpea
    this.height = d.h;                  // Altura del sprite (dibujo) del zombie en píxeles

    // ─── FÍSICA ───
    // Variables que controlan el movimiento y posición física del zombie
    this.vx = 0; this.vy = 0;  // vx = velocidad horizontal (positivo = derecha, negativo = izquierda). vy = velocidad vertical (para gravedad/saltos)
    this.onGround = false;     // true si el zombie está pisando el suelo. false si está en el aire (cayendo o saltando)
    this.dir = 1;              // Dirección hacia la que mira: 1 = derecha, -1 = izquierda (determina hacia qué lado se dibuja el sprite)

    // ─── ANIMACIÓN ───
    // Controla los cuadros de animación para que el zombie se vea caminando
    this.animTimer = 0;  // Contador que aumenta con el tiempo. Al llegar a cierto valor, cambia el frame (dibujo) de la animación

    // ─── MUERTE ───
    // Controla qué pasa cuando el zombie muere
    this.dead = false; this.deathTimer = 0.8;  // dead = true cuando su vida llega a 0. deathTimer = 0.8 segundos antes de que desaparezca de la pantalla

    // ─── ANCHO DEL CUERPO ───
    // w = ancho del rectángulo de colisión del zombie (para detectar golpes)
    this.w = type===2 ? 36 : type===5 ? 24 : 22; // Si es tipo 2 (Grande) usa 36px, si es tipo 5 (Explosivo) usa 24px, si es otro usa 22px

    // ─── SONIDO ───
    // Controla los sonidos aleatorios que hacen los zombies
    this.groanTimer = 1 + Math.random()*3;  // Tiempo aleatorio (entre 1 y 4 segundos) antes de que el zombie emita un sonido de quejido

    // ─── ATAQUE ───
    // Controla la frecuencia con la que el zombie puede atacar al jugador
    this.attackCooldown = 0;  // Si es > 0, el zombie está en "enfriamiento" y no puede atacar. Disminuye con el tiempo hasta llegar a 0

    // ─── SALTO ───
    // Especial para zombies saltadores (tipo 3)
    this.jumpCooldown = 0;   // Si es > 0, el zombie no puede saltar. Disminuye con el tiempo. Solo lo usan los zombies tipo 3

    // ─── DISPARO ───
    // Para zombies que pueden disparar (como los del tipo eléctrico o especiales)
    this.shootTimer = Math.random() * 3;  // Tiempo aleatorio (0 a 3 segundos) antes de que el zombie dispare. Al llegar a 0, dispara y se reinicia

    // ─── ARMADO ───
    // Estado de "preparación" del zombie. Algunos zombies necesitan un tiempo antes de poder atacar
    this.arming = false;  // true cuando el zombie está preparándose para atacar (ej: un zombie que se agacha antes de saltar)
    this.armTimer = 3;    // Cuánto tiempo lleva armándose (va disminuyendo desde armMax hasta 0)
    this.armMax = 3;      // Tiempo TOTAL que necesita el zombie para armarse (en segundos). Cuando armTimer llega a 0, el ataque está listo
  }
}
