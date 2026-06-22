// ─── CLASE BULLET ───
// Representa una bala disparada por el jugador o por un zombie.
// Viaja en línea recta hasta golpear algo o superar su distancia máxima.

class Bullet {
  // ─── CONSTRUCTOR ───
  // Recibe la posición (x, y), la velocidad (vx, vy) y una referencia al arma que la disparó
  // La bala viajará en línea recta con la velocidad indicada hasta golpear algo o agotar su distancia
  constructor(x, y, vx, vy, weapon) {
    // ─── POSICIÓN ───
    // Las coordenadas de la bala cuando se crea (donde sale del cañón del arma)
    this.x = x; this.y = y;  // x = posición horizontal, y = posición vertical. Se actualizará cada frame sumándole la velocidad

    // ─── VELOCIDAD ───
    // La velocidad determina hacia dónde y qué tan rápido viaja la bala
    this.vx = vx; this.vy = vy;  // vx = velocidad en X (positivo = derecha, negativo = izquierda). vy = velocidad en Y (positivo = abajo, negativo = arriba)

    // ─── DISTANCIA RECORRIDA ───
    // Mide cuánto ha viajado la bala para saber cuándo debe desaparecer
    this.dist = 0;  // Empieza en 0 y se incrementa con cada frame sumando la magnitud de la velocidad (distancia recorrida en ese frame)

    // ─── ARMA ORIGEN ───
    // Guarda qué arma disparó esta bala para saber cuánto daño debe hacer y otros efectos
    this.weapon = weapon;  // Referencia al objeto del arma (contiene daño, tipo, etc.). Se usa al impactar para calcular el daño

    // ─── ESTELA (TRAIL) ───
    // Pequeñas marcas visuales que quedan detrás de la bala mientras viaja (efecto de velocidad)
    // Guarda las últimas 3 posiciones para dibujar una estela visual detrás de la bala
    this.trail = [{x,y},{x,y},{x,y}];  // Arreglo con 3 posiciones. Cada frame se actualiza: se agrega la posición actual al inicio y se elimina la más vieja

    // ─── ESTADO ───
    // Controla si la bala sigue activa o debe ser eliminada del juego
    this.dead = false;  // false = la bala sigue viajando. true = la bala debe ser eliminada (porque golpeó algo, llegó a su distancia máxima o golpeó al jugador)
  }
}
