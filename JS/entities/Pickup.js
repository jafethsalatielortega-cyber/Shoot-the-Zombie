// ─── CLASE PICKUP ───
// Objeto que aparece en el mapa y que el jugador puede recoger.
// Los tipos incluyen: munición, salud, power-ups (insta-kill, doble disparo, etc.).

class Pickup {
  // ─── CONSTRUCTOR ───
  // Recibe el tipo de objeto recolectable y las coordenadas (x, y) donde va a aparecer
  // El jugador puede recoger estos objetos al pasar sobre ellos para obtener beneficios
  constructor(type, x, y) {
    // ─── TIPO ───
    // Define qué beneficio obtiene el jugador al recoger este objeto
    this.type = type;  // type: 0 = munición (rellena balas), 1 = salud (recupera vida), 2 = insta-kill (mata de un golpe), 3 = doble disparo, 4 = munición infinita, etc.

    // ─── POSICIÓN ───
    // Dónde aparece el pickup en el mapa
    this.x = x; this.y = y;  // x = coordenada horizontal, y = coordenada vertical. Cuando el jugador se acerca lo suficiente, lo recoge automáticamente

    // ─── DURACIÓN ───
    // El pickup no dura para siempre en el mapa, desaparece después de un tiempo
    this.life = 12;  // El pickup dura 12 segundos en pantalla. Este contador va disminuyendo cada segundo. Cuando llega a 0, el pickup se elimina sin que nadie lo recoja

    // ─── ANIMACIÓN ───
    // Efecto visual para hacer el pickup más llamativo
    this.bob = 0;  // Controla el movimiento de flotación (sube y baja suavemente). Aumenta con el tiempo y se usa con una función seno (Math.sin) para crear el efecto de "respiración" o flotación
  }
}
