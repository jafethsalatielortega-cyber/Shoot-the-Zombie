// ─── FÍSICA ───
// Aplica gravedad, movimiento horizontal y vertical, y colisiones con plataformas y el suelo
// Parámetros: entidad (jugador, zombie, etc.) y delta time en segundos
function updatePhysics(entity, dt) {
  // Calcula la mitad del ancho y alto de la entidad para las colisiones
  const hw = (entity.w || 20) / 2;
  const hh = entity.h || entity.height || 50;

  // Aplica la gravedad a la velocidad vertical (hace que la entidad caiga)
  entity.vy += GRAVITY * dt;

  // Guarda la posición Y anterior para detectar colisiones verticales
  const prevY = entity.y;

  // ─── MOVIMIENTO HORIZONTAL + COLISIÓN ───
  // Mueve la entidad horizontalmente según su velocidad
  entity.x += entity.vx * dt;

  // Detecta si la entidad está parada sobre alguna plataforma
  let standingOnPlatform = null;
  // Revisa todas las plataformas para ver si la entidad está sobre una
  for (const pl of PLATFORMS) {
    // Verifica si la entidad está justo encima de la plataforma (diferencia Y menor a 0.5)
    if (Math.abs(entity.y - pl.y) < 0.5 && entity.x + hw > pl.x && entity.x - hw < pl.x + pl.w) {
      standingOnPlatform = pl;
      break;
    }
  }

  // Revisa colisiones laterales contra plataformas (excepto la de apoyo)
  for (const pl of PLATFORMS) {
    // Salta la plataforma sobre la que está parado para no interferir
    if (pl === standingOnPlatform) continue;
    // Verifica si hay superposición horizontal entre la entidad y la plataforma
    if (entity.x + hw > pl.x && entity.x - hw < pl.x + pl.w) {
      const entityTop = entity.y - hh;
      const entityBottom = entity.y;
      const platTop = pl.y;
      const platBottom = pl.y + pl.h;

      // Si la entidad está cruzando el borde de la plataforma lateralmente
      if (prevY <= platTop && entityBottom >= platTop && entityTop < platBottom) {
        // Empuja a la entidad fuera de la plataforma según la dirección
        if (entity.vx > 0) {
          entity.x = pl.x - hw;      // Lado izquierdo de la plataforma
        } else if (entity.vx < 0) {
          entity.x = pl.x + pl.w + hw; // Lado derecho de la plataforma
        }
        // Detiene la velocidad horizontal (choque)
        entity.vx = 0;
      }
    }
  }

  // ─── MOVIMIENTO VERTICAL + COLISIÓN ───
  // Mueve la entidad verticalmente según su velocidad
  entity.y += entity.vy * dt;

  // Colisión con el suelo (no puede caer más abajo del nivel del suelo)
  // GROUND_Y es la coordenada Y del suelo del nivel
  if (entity.y >= GROUND_Y) {
    entity.y = GROUND_Y;    // Coloca la entidad justo en el suelo
    entity.vy = 0;          // Detiene la velocidad vertical
    entity.onGround = true; // Marca que está en el suelo
  }

  // Colisión vertical con plataformas (caída sobre ellas)
  for (const pl of PLATFORMS) {
    // Verifica si la entidad está horizontalmente sobre la plataforma
    if (entity.x + hw > pl.x && entity.x - hw < pl.x + pl.w) {
      const entityBottom = entity.y;
      const platTop = pl.y;

      // Solo revisa si la entidad está cayendo (velocidad vertical >= 0)
      if (entity.vy >= 0) {
        const prevBottom = prevY;
        // Si en el frame anterior estaba arriba de la plataforma y ahora está dentro
        if (prevBottom <= platTop && entityBottom >= platTop) {
          entity.y = platTop;    // Coloca la entidad sobre la plataforma
          entity.vy = 0;          // Detiene la caída
          entity.onGround = true; // Marca que está en el suelo (plataforma)
          break;
        }
      }
    }
  }

  // Limita la posición horizontal para que no salga del mundo
  entity.x = Math.max(0, Math.min(WORLD_W, entity.x));
}
