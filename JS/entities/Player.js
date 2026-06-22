// ─── CLASE PLAYER ───
// Controla todo lo relacionado con el personaje del jugador:
// movimiento, armas, salud, animaciones y power-ups.

class Player {
  // ─── CONSTRUCTOR ───
  // El constructor se ejecuta automáticamente al crear un nuevo jugador (new Player())
  // Aquí se inicializan TODAS las propiedades que el jugador va a necesitar
  constructor() {
    // ─── POSICIÓN Y MOVIMIENTO ───
    // Estas variables controlan dónde está el jugador y cómo se mueve
    this.x = 200; this.y = GROUND_Y;  // Posición en el eje X (horizontal) y Y (vertical). GROUND_Y es el nivel del suelo
    this.vx = 0; this.vy = 0;          // Velocidad horizontal (vx) y vertical (vy). 0 significa que no se está moviendo
    this.w = 20; this.h = 50;          // w = ancho (width), h = alto (height) del rectángulo que representa al jugador
    this.dir = 1;                       // Dirección a la que mira: 1 = derecha, -1 = izquierda. Afecta al sprite y al disparo

    // ─── SALUD ───
    // Controla cuánta vida le queda al jugador
    this.hp = 100; this.maxHp = 100;   // hp = vida actual, maxHp = vida máxima. Si hp llega a 0, el jugador muere

    // ─── ESTADOS FÍSICOS ───
    // Variables booleanas (true/false) que describen el estado actual del jugador
    this.onGround = false;  // true si el jugador está pisando el suelo, false si está en el aire
    this.jumping = false;   // true mientras el jugador está en medio de un salto
    this.sprinting = false; // true si el jugador está corriendo (shift presionado)

    // ─── ANIMACIÓN ───
    // Controla el cambio de sprites para dar la ilusión de movimiento
    this.animTimer = 0;     // Este contador aumenta con el tiempo. Al llegar a cierto valor, cambia el frame de la animación

    // ─── ARMAS ───
    // Todo lo relacionado con las armas del jugador: cuál tiene equipada, cuánta munición le queda, etc.
    this.weaponIndex = 0;              // Número del arma que está usando actualmente (0 = primera, 1 = segunda)
    this.slotWeaponIndices = [0, 1];   // Lista con los números de arma asignados a cada ranura (slot 0 y slot 1)
    this.weapon = Object.assign({}, WEAPONS[0]);  // Crea una COPIA del objeto del arma activa (WEAPONS[0]) para no modificar el original
    this.weaponAmmo = [this.weapon.magSize, WEAPONS[1].magSize];         // Munición DENTRO del cargador para cada arma: [arma1, arma2]
    this.weaponTotalAmmo = [this.weapon.totalAmmo, WEAPONS[1].totalAmmo]; // Munición TOTAL (de reserva) para cada arma: [arma1, arma2]
    this.ammo = this.weaponAmmo[0];         // Munición en el cargador del arma que está activa actualmente
    this.totalAmmo = this.weaponTotalAmmo[0]; // Munición de reserva del arma activa actualmente
    this.reloading = false; this.reloadTimer = 0; // reloading = true si está recargando. reloadTimer cuenta los segundos que lleva recargando
    this.fireCooldown = 0;  // Tiempo de espera (en segundos) antes de poder disparar otra vez. Evita disparos infinitos
    this.shootRecoil = 0;   // Retroceso visual: hace que la mira/arma se mueva hacia arriba al disparar

    // ─── EFECTOS VISUALES ───
    // Efectos que se ven en pantalla al disparar
    this.muzzleFlash = 0;   // Duración (en segundos) del destello que sale del cañón al disparar. Si > 0, se dibuja
    this.muzzleX = 0; this.muzzleY = 0;  // Coordenadas (X, Y) donde se dibuja el destello del cañón

    // ─── MUERTE ───
    // Controla qué pasa cuando el jugador muere
    this.dead = false; this.deathTimer = 0;  // dead = true si el jugador murió. deathTimer cuenta el tiempo antes de reiniciar o mostrar pantalla de game over

    // ─── CAMBIO DE ARMA ───
    // Animación al intercambiar entre armas
    this.weaponSwap = 1;    // Controla la transición visual al cambiar de arma. 1 = animación completada, valores intermedios = en transición

    // ─── SALTO ───
    // Propiedades especiales del salto
    this.doubleJump = false; // true si el jugador ya usó su primer salto y puede hacer un segundo salto en el aire
    this.jumpBuf = false;    // Buffer de salto: si el jugador presiona salto justo ANTES de tocar el suelo, este buffer lo recuerda y ejecuta el salto automáticamente al tocar suelo

    // ─── DAÑO ───
    // Controla la invulnerabilidad temporal después de recibir un golpe
    this.hitCooldown = 0;    // Tiempo (en segundos) durante el cual el jugador es invulnerable después de recibir daño. Mientras > 0, no recibe más daño

    // ─── CUCHILLO ───
    // Arma cuerpo a cuerpo del jugador
    this.knifeCooldown = 0;  // Tiempo de espera entre cada ataque de cuchillo. Mientras > 0, no se puede atacar con cuchillo
    this.knifeTimer = 0;     // Temporizador que controla la animación del cuchillo (cuánto tiempo lleva la animación activa)
    this.knifeHit = false;   // Se vuelve true cuando el cuchillo ya golpeó a un zombie en este ataque (para no golpear múltiples veces)

    // ─── POWER-UPS (MEJORAS TEMPORALES) ───
    // Efectos especiales que duran un tiempo limitado
    this.instaKillTimer = 0;      // Si > 0, el jugador mata zombies de un solo golpe. El temporizador cuenta cuánto tiempo queda
    this.doubleShotTimer = 0;     // Si > 0, el jugador dispara DOS balas por cada disparo. El temporizador cuenta cuánto tiempo queda
    this.unlimitedAmmoTimer = 0;  // Si > 0, el jugador tiene munición infinita. El temporizador cuenta cuánto tiempo queda

    // ─── GRANADA ───
    // Controla el lanzamiento de granadas
    this.grenadeCooldown = 0;  // Tiempo de espera entre lanzamientos de granada. Mientras > 0, no se puede lanzar otra
  }
}
