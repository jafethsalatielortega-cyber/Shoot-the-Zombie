// ─── CAJA MISTERIOSA (compartida por todos los mapas) ───
const _MYSTERY_BOX_COST = 12500;
let _mysteryBoxWeaponIdx = -1;
let _mysteryBoxHoldTime = 0;
const _mysteryBoxX1 = 1600; // posición en el mapa ciudad (mapa 1)

// ─── ACTUALIZAR JUEGO ───
// Función principal que se ejecuta cada frame mientras el estado es 'playing'.
// Orquesta todos los subsistemas del juego en el orden correcto:
//   1. Temporizadores y enfriamientos
//   2. Recarga y tiempos de arma
//   3. Cuchillo, movimiento, salto, disparo
//   4. Física del jugador y cámara
//   5. Balas y colisiones
//   6. IA de zombies (movimiento, ataque, disparo, explosión)
//   7. Objetos recogibles (power-ups)
//   8. Spawn de zombies y gestión de oleadas
//   9. Jefe (boss) y sus proyectiles
//   10. Granadas y explosiones
//   11. Partículas y efectos visuales
// Recibe el estado global (gs) y el tiempo delta (dt) desde el último frame
function updatePlaying(gs, dt) {
  const p = gs.player;

  // ─── TOUCH: LIBERAR TECLAS MOMENTÁNEAS ───
  for (let i = pendingKeyRelease.length - 1; i >= 0; i--) {
    keys[pendingKeyRelease[i]] = false;
  }
  pendingKeyRelease.length = 0;

// ─── TEMPORIZADORES GENERALES ───
  // Todos los contadores que disminuyen con el tiempo se actualizan aquí.
  // El enfoque es "cuenta regresiva": cuando llegan a 0, el efecto termina
  // o la acción vuelve a estar disponible.

  // Reduce progresivamente el temblor de cámara (efecto de sacudida)
  gs.camShake = Math.max(0, gs.camShake - dt*10);
  // Desvanece el destello rojo cuando el jugador recibe daño
  gs.damageFlash = Math.max(0, gs.damageFlash - dt*5);
  // Enfriamiento después de recibir daño (el jugador es invulnerable durante este tiempo)
  p.hitCooldown = Math.max(0, p.hitCooldown - dt);
  // Enfriamiento del cuchillo (no se puede usar hasta que termine)
  p.knifeCooldown = Math.max(0, p.knifeCooldown - dt);
  // Duración restante del power-up insta-kill (mata enemigos de un solo golpe)
  p.instaKillTimer = Math.max(0, p.instaKillTimer - dt);
  // Duración restante del power-up doble disparo (dispara más rápido)
  p.doubleShotTimer = Math.max(0, p.doubleShotTimer - dt);
  // Duración restante del power-up munición infinita (no gasta balas)
  p.unlimitedAmmoTimer = Math.max(0, p.unlimitedAmmoTimer - dt);
  // Tiempo entre lanzamientos de granada
  p.grenadeCooldown = Math.max(0, p.grenadeCooldown - dt);

  // ─── RECARGA DE ARMA ───
  // Si el jugador está recargando, reduce el temporizador de recarga
  if (p.reloading) {
    p.reloadTimer -= dt;
    // Cuando el temporizador llega a 0, la recarga termina
    if (p.reloadTimer <= 0) {
      p.reloading = false;                              // Termina la recarga
      const need = p.weapon.magSize - p.ammo;           // Balas que faltan para llenar el cargador
      const give = Math.min(need, p.totalAmmo);          // Toma la munición disponible (lo que alcance)
      p.ammo += give;                                    // Agrega balas al cargador
      p.totalAmmo -= give;                               // Reduce la munición de reserva
    }
  }
  // ─── TIEMPOS DE ARMA ───
  if (p.fireCooldown > 0) p.fireCooldown -= dt;           // Enfriamiento entre disparos (para evitar disparar muy rápido)
  if (p.shootRecoil > 0) p.shootRecoil = Math.max(0, p.shootRecoil - dt*6); // Retroceso visual del arma
  if (p.muzzleFlash > 0) p.muzzleFlash -= dt;              // Duración del fogonazo en la boca del cañón
  if (p.weaponSwap < 1) p.weaponSwap = Math.min(1, p.weaponSwap + dt*3); // Animación de cambio de arma (0 a 1)

  // ─── MUERTE DEL JUGADOR ───
  if (p.dead) {
    p.deathTimer += dt;                                    // Aumenta el temporizador de muerte
    // Después de 2.5 segundos, cambia el estado a 'gameover'
    if (p.deathTimer > 2.5) gs.state = 'gameover';
    return;                                                 // No actualiza más si está muerto
  }

  // ─── ATAQUE CON CUCHILLO ───
  // Sistema de combate cuerpo a cuerpo: cuando el jugador presiona E,
  // se activa un temporizador (knifeTimer). Mientras dura,
  // se detectan colisiones con zombies o el jefe dentro del alcance.
  // El impulso hacia adelante (vx) lo maneja la física en la sección de movimiento.
  // Si el power-up Insta-Kill está activo, el cuchillo mata instantáneamente.
  if (p.knifeTimer > 0) {
    p.knifeTimer -= dt;
    // Mientras el cuchillo esté activo y no haya golpeado aún
    if (p.knifeTimer > 0 && !p.knifeHit) {
      const range = 45;                                     // Alcance del cuchillo en píxeles
      const hw = range / 2;
      // Revisa colisiones con todos los zombies
      for (const z of gs.zombies) {
        if (z.dead) continue;                               // Ignora zombies muertos
        // Calcula la distancia entre el cuchillo y el zombie
        const dx = (p.x + p.dir * 20) - z.x;
        const dy = (p.y - 20) - (z.y - z.height / 2);
        // Si el zombie está dentro del alcance
        if (Math.abs(dx) < range && Math.abs(dy) < z.height / 2 + 15) {
          // Si insta-kill está activo, mata al zombie instantáneamente; si no, hace 50 de daño
          if (p.instaKillTimer > 0) z.hp = 0; else z.hp -= 50;
          // Efectos visuales: sangre y texto flotante
          spawnBlood(z.x, z.y);
          spawnFloat(p.instaKillTimer > 0 ? 'INSTA!' : '-50', z.x, z.y - 10, p.instaKillTimer > 0 ? '#ff00ff' : '#e0e0e0');
          gs.score += 50;                                   // Puntos por acuchillar
          p.knifeHit = true;                                // Marca que ya golpeó
          // Si el zombie murió, llama a killZombie()
          if (z.hp <= 0 && !z.dead) killZombie(gs, z, z.x, z.y);
          break;                                             // Sale del bucle (solo golpea a un zombie)
        }
      }
      // Si no golpeó a un zombie, revisa si golpeó al jefe
      if (!p.knifeHit && gs.boss && !gs.boss.dead) {
        const dx = (p.x + p.dir * 20) - gs.boss.x;
        const dy = (p.y - 20) - (gs.boss.y - gs.boss.height / 2);
        if (Math.abs(dx) < 55 && Math.abs(dy) < gs.boss.height / 2 + 15) {
          if (p.instaKillTimer > 0) gs.boss.hp = 0; else gs.boss.hp -= 50;
          spawnBlood(gs.boss.x, gs.boss.y);
          spawnFloat(p.instaKillTimer > 0 ? 'INSTA!' : '-50', gs.boss.x, gs.boss.y - 10, p.instaKillTimer > 0 ? '#ff00ff' : '#e0e0e0');
          gs.score += 50;
          p.knifeHit = true;
          if (gs.boss.hp <= 0 && !gs.boss.dead) killBoss(gs, gs.boss);
        }
      }
    }
    // Cuando el temporizador del cuchillo termina, reinicia el indicador de golpe
    if (p.knifeTimer <= 0) p.knifeHit = false;
  }

  // ─── MOVIMIENTO DEL JUGADOR ───
  // Sistema de entrada → velocidad horizontal.
  // Usa aceleración suave (no instantánea) para dar sensación de peso,
  // y fricción exponencial cuando no se presiona ninguna tecla.
  // Detecta si el jugador está presionando Shift (correr)
  p.sprinting = keys['ShiftLeft'] || keys['ShiftRight'];
  // Calcula la velocidad: normal o multiplicada por el sprint
  const speed = WALK_SPEED * (p.sprinting ? SPRINT_MULT : 1);

  // Si el cuchillo está activo, el jugador se impulsa hacia adelante
  if (p.knifeTimer > 0) {
    p.vx = p.dir * 400;                                  // Impulso hacia adelante al apuñalar
  } else if (keys['KeyD'] || keys['ArrowRight']) {
    p.vx = Math.min(speed, p.vx + speed * 10 * dt);      // Acelera hacia la derecha
    p.dir = 1;                                            // Dirección: derecha
  } else if (keys['KeyA'] || keys['ArrowLeft']) {
    p.vx = Math.max(-speed, p.vx - speed * 10 * dt);      // Acelera hacia la izquierda
    p.dir = -1;                                            // Dirección: izquierda
  } else {
    p.vx *= Math.pow(FRICTION, dt * 60);                  // Fricción cuando no hay tecla presionada (desacelera)
  }

  // ─── SALTO ───
  // Sistema de salto con buffer de tecla (evita que se pierdan presiones rápidas)
  // y soporte para doble salto (solo con la escopeta equipada).
  // Detecta flanco de subida: solo salta cuando la tecla se presiona,
  // no cuando se mantiene presionada.
  const jumpKey = keys['KeyW'] || keys['ArrowUp'] || keys['Space'];
  // Si se presiona la tecla de salto y no estaba presionada antes (flanco de subida)
  if (jumpKey && !p.jumpBuf) {
    if (p.onGround) {
      p.vy = JUMP_VEL; p.onGround = false; p.jumping = true; // Salto normal
      p.doubleJump = true;                                      // Double jump siempre disponible
    } else if (p.doubleJump) {
      p.vy = JUMP_VEL * 0.85; p.doubleJump = false;          // Doble salto (85% de la velocidad inicial)
    }
    p.jumpBuf = true;                                          // Marca que la tecla fue presionada
  }
  // Cuando se suelta la tecla de salto, reinicia el buffer
  if (!jumpKey) p.jumpBuf = false;
  // Si está en el suelo, no está saltando
  if (p.onGround) p.jumping = false;

  // ─── [NEW] TOUCH SHOOTING ───
  // El botón táctil "FIRE" se integra en la misma señal mouse.down
  // para que el sistema de disparo existente funcione sin cambios.
  if (touchShooting) { mouse.down = true; }
  else if (!mouse.down) { /* touch release handled by pointerup */ }
  // Si touchShooting está false pero mouse.down quedó true del toque anterior,
  // se limpia para evitar disparo fantasma.
  if (!touchShooting && mouse.down && showTouchControls) mouse.down = false;

  // ─── RECARGA MANUAL (TECLA R) ───
  // Si presiona R y no está recargando, tiene menos balas que el cargador y tiene munición de reserva
  if ((keys['KeyR']) && !p.reloading && p.ammo < p.weapon.magSize && p.totalAmmo > 0) {
    p.reloading = true;
    p.reloadTimer = p.weapon.reloadTime;                       // Tiempo que tarda en recargar
    SFX.reload();                                              // Sonido de recarga
  }

  // ─── CAMBIAR ARMA (TECLA Q) ───
  // Detecta flanco de subida de la tecla Q (solo una vez por presión)
  if ((keys['KeyQ']) && !p._qBuf) {
    p._qBuf = true;
    // Guarda la munición actual del arma que está usando
    p.weaponAmmo[p.weaponIndex] = p.ammo;
    p.weaponTotalAmmo[p.weaponIndex] = p.totalAmmo;
    // Cambia al otro arma (índice 0 o 1)
    p.weaponIndex = p.weaponIndex===0 ? 1 : 0;
    // Carga la nueva arma desde la configuración
    p.weapon = Object.assign({}, WEAPONS[p.slotWeaponIndices[p.weaponIndex]]);
    // Recupera la munición guardada del arma seleccionada
    p.ammo = p.weaponAmmo[p.weaponIndex];
    p.totalAmmo = p.weaponTotalAmmo[p.weaponIndex];
    p.reloading = false;                                       // Cancela la recarga si estaba en curso
    p.weaponSwap = 0;                                          // Reinicia la animación de cambio
  }
  // Cuando se suelta Q, reinicia el buffer
  if (!keys['KeyQ']) p._qBuf = false;

  // ─── ATAQUE CUCHILLO (TECLA E) / CAJA MISTERIOSA ───
  // Detecta flanco de subida de la tecla E
  if ((keys['KeyE']) && !p._eBuf && p.knifeCooldown <= 0 && p.knifeTimer <= 0) {
    let nearBox = false;
    // Verifica si está cerca de la caja misteriosa
    const boxX = gs.selectedMap === 2 ? (typeof _mysteryBoxX !== 'undefined' ? _mysteryBoxX : -1) : _mysteryBoxX1;
    if (_mysteryBoxWeaponIdx >= 0 && boxX > 0) {
      if (gs.selectedMap === 2) {
        if (gs.player.y < CABIN_CEIL_Y && Math.abs(p.x - boxX) < 55) nearBox = true;
      } else {
        if (Math.abs(p.x - boxX) < 55 && Math.abs(p.y - GROUND_Y) < 50) nearBox = true;
      }
    }
    if (!nearBox) {
      // Si no está cerca de la caja, realiza el ataque con cuchillo
      p._eBuf = true;
      p.knifeTimer = 0.25;                                      // Duración del ataque
      p.knifeCooldown = 0.6;                                    // Tiempo hasta el próximo ataque
      p.knifeHit = false;                                       // Reinicia el indicador de golpe
      // Partículas de rayas blancas (efecto de cuchillada)
      spawnParticles(4, p.x + p.dir * 20, p.y - 20, '#e8e8e8', 200, 1.2, 0, 3, 0.15);
    } else {
      p._eBuf = true;                                           // Marca buffer para la caja misteriosa
    }
  }
  if (!keys['KeyE']) p._eBuf = false;

  // ─── CAJA MISTERIOSA (MAPA CIUDAD) ───
  if (gs.selectedMap !== 2 && gs.state === 'playing' && !p.dead) {
    // Generar arma cuando hay puntos suficientes y el jugador está cerca
    const distToBoxGen = Math.abs(p.x - _mysteryBoxX1);
    if (gs.score >= _MYSTERY_BOX_COST && _mysteryBoxWeaponIdx < 0 && distToBoxGen < 150 && Math.abs(p.y - GROUND_Y) < 50) {
      const available = MYSTERY_WEAPON_INDICES.filter(
        idx => !p.slotWeaponIndices.includes(idx)
      );
      if (available.length > 0) {
        _mysteryBoxWeaponIdx = available[Math.floor(Math.random() * available.length)];
        try { playTone(150, 600, 'triangle', 0.2, 0.2); } catch(e){}
        if (typeof floatTexts !== 'undefined') {
          floatTexts.push({
            text:'🕊 MYSTERY BOX READY!', x:_mysteryBoxX1, y:GROUND_Y-60,
            life:2.5, maxLife:2.5, color:'#ffcc00'
          });
        }
        for (let i = 0; i < 8; i++) {
          if (typeof particles !== 'undefined') {
            particles.push({
              x: _mysteryBoxX1 + (Math.random()-0.5)*30,
              y: GROUND_Y - 18 + (Math.random()-0.5)*20,
              vx: (Math.random()-0.5)*150, vy: -Math.random()*150-50,
              life: 0.6, maxLife: 0.6,
              color: '#8B5E3C', gravity: 150, size: 3+Math.random()*2, isRect: true
            });
          }
        }
      }
    }
    // Recogida (mantén E 1.5s para gastar 12500 pts)
    if (_mysteryBoxWeaponIdx >= 0 && gs.score >= _MYSTERY_BOX_COST) {
      const distToBox = Math.abs(p.x - _mysteryBoxX1);
      const nearBox = distToBox < 55 && Math.abs(p.y - GROUND_Y) < 50;
      if (keys['KeyE'] && nearBox) {
        _mysteryBoxHoldTime += dt;
        if (_mysteryBoxHoldTime >= 1.5) {
          _mysteryBoxHoldTime = 0;
          gs.score -= _MYSTERY_BOX_COST;
          const newWpn = WEAPONS[_mysteryBoxWeaponIdx];
          const slot = p.weaponIndex;
          p.slotWeaponIndices[slot] = _mysteryBoxWeaponIdx;
          p.weapon = Object.assign({}, newWpn);
          p.ammo = newWpn.magSize;
          p.totalAmmo = newWpn.totalAmmo;
          p.weaponAmmo[slot] = newWpn.magSize;
          p.weaponTotalAmmo[slot] = newWpn.totalAmmo;
          p.reloading = false;
          p.weaponSwap = 0;
          try { playTone(200,800,'sine',0.3,0.25); } catch(e){}
          try { playTone(400,1200,'sine',0.2,0.2); } catch(e){}
          if (typeof floatTexts !== 'undefined') {
            floatTexts.push({text:'🦾 ' + newWpn.name + '!', x:p.x, y:p.y-50, life:2, maxLife:2, color:'#ffcc00'});
          }
          for (let i = 0; i < 12; i++) {
            if (typeof particles !== 'undefined') {
              particles.push({
                x: _mysteryBoxX1 + (Math.random()-0.5)*30,
                y: GROUND_Y - 20 + (Math.random()-0.5)*20,
                vx: (Math.random()-0.5)*200, vy: -Math.random()*200-100,
                life: 0.8, maxLife: 0.8,
                color: ['#ffcc00','#ff8800','#ffffff'][Math.floor(Math.random()*3)],
                gravity: 200, size: 3+Math.random()*3, isRect: false
              });
            }
          }
          _mysteryBoxWeaponIdx = -1;
        }
      } else {
        _mysteryBoxHoldTime = 0;
      }
    } else {
      _mysteryBoxHoldTime = 0;
    }
  }

  // ─── LANZAR GRANADA (TECLA G) ───
  // Detecta flanco de subida de la tecla G
  if ((keys['KeyG']) && !p._gBuf && p.grenadeCooldown <= 0 && !p.dead) {
    p._gBuf = true;
    p.grenadeCooldown = 25;                                      // Enfriamiento de 25 segundos
    // Crea una nueva granada con física parabólica
    gs.grenades.push({
      x: p.x + p.dir * 15,                                      // Posición inicial: frente al jugador
      y: p.y - 30,                                              // Altura: a la altura del pecho
      vx: p.dir * 350,                                          // Velocidad horizontal (dirección del jugador)
      vy: -320,                                                 // Velocidad vertical hacia arriba (lanzamiento)
      timer: 2,                                                 // Tiempo antes de explotar (2 segundos)
      trail: [],                                                // Estela para el efecto visual
      dead: false,
    });
    SFX.throwGrenade();                                          // Sonido de lanzamiento
  }
  if (!keys['KeyG']) p._gBuf = false;

  // ─── DISPARO ───
  // Determina si el jugador está disparando (según el tipo de arma)
  const shooting = p.weapon.auto ? (mouse.down || keys['Space'] && false) : false;
  const shotRequested = mouse.down && p.weapon.auto || (!p.weapon.auto && mouse.down && !p._shootBuf);
  // Armas semiautomáticas: solo disparan una vez por clic
  if (!p.weapon.auto) {
    if (mouse.down && !p._shootBuf) { tryShoot(gs); p._shootBuf = true; }
    if (!mouse.down) p._shootBuf = false;
  } else {
    // Armas automáticas: disparan mientras se mantiene el clic
    if (mouse.down) tryShoot(gs);
  }

  // ─── ANIMACIÓN Y FÍSICA ───
  p.animTimer += dt;                                            // Avanza la animación del jugador

  const wasOnGround = p.onGround;
  p.onGround = false;
  updatePhysics(p, dt);                               // Aplica gravedad y colisiones al jugador

  // ─── CÁMARA ───
  // El Electrician (tipo 6) altera el FOV cuando está vivo, creando un efecto
  // de "oscuridad" que aleja visualmente la cámara del jugador.
  const hasElectrician = gs.zombies.some(z => z.type === 6 && !z.dead);
  gs.fov = hasElectrician ? 1.2 : 1.0;
  const viewW = LOGICAL_W * gs.fov;
  const targetCamX = p.x - viewW / 2;                  // Centra la cámara en el jugador
  gs.camX += (targetCamX - gs.camX) * Math.min(1, dt*8); // Sigue al jugador suavemente (interpolación)
  gs.camX = Math.max(0, Math.min(WORLD_W - viewW, gs.camX)); // No deja que la cámara salga del mundo

  // ─── BALAS ───
  // Sistema de proyectiles: mueve cada bala en sub-pasos para detección precisa
  // de colisiones (evita que balas rápidas atraviesen objetivos).
  // Itera hacia atrás para poder eliminar balas muertas sin afectar el índice
  // Los tipos de colisión son: bala enemiga vs jugador, bala aliada vs jefe,
  // y bala aliada vs zombie (con detección de headshot).
  for (let i=gs.bullets.length-1; i>=0; i--) {
    const b = gs.bullets[i];
    b.trail.unshift({x:b.x, y:b.y});                    // Guarda posición para la estela
    b.trail.length = 4;                                  // Mantiene solo las últimas 4 posiciones
    const steps = 3;                                     // Sub-pasos para detección precisa de colisiones
    const stepDt = dt / steps;
    let hit = false;
    // Mueve la bala en pequeños pasos para no atravesar objetos
    for (let s=0; s<steps && !hit; s++) {
      b.x += b.vx * stepDt;
      b.y += b.vy * stepDt;
      b.dist += Math.sqrt(b.vx*b.vx + b.vy*b.vy) * stepDt; // Distancia total recorrida
      // Si supera distancia máxima (800px) o sale del mundo, la bala muere
      if (b.dist > 800 || b.y > GROUND_Y + 20 || b.x < 0 || b.x > WORLD_W) { b.dead=true; hit=true; break; }
      // ─── COLISIÓN: BALA ENEMIGA VS JUGADOR ───
      if (b.isEnemy && p.hitCooldown <= 0) {
        // Obtiene las dimensiones del jugador para la colisión
        const hw = (p.w || 20) / 2;
        const hh = p.h || 50;
        // Si la bala está dentro del área del jugador
        if (b.x > p.x - hw && b.x < p.x + hw && b.y > p.y - hh && b.y < p.y + 5) {
          p.hp -= b.isEnemy ? 10 : b.weapon.damage;      // Daño al jugador
          p.hitCooldown = 2.5;                             // Invulnerabilidad temporal
          gs.damageFlash = 1;                              // Destello rojo
          b.dead = true; hit = true;
          if (p.hp <= 0) { p.hp = 0; p.dead = true; SFX.hurt(); }
          break;
        }
      }
      // ─── COLISIÓN: BALA DEL JUGADOR VS JEFE ───
      if (!b.isEnemy && gs.boss && !gs.boss.dead) {
        const hwB = gs.boss.w / 2;
        // Si la bala golpea al jefe
        if (b.x > gs.boss.x - hwB && b.x < gs.boss.x + hwB && b.y > gs.boss.y - gs.boss.height && b.y < gs.boss.y + 5) {
          if (p.instaKillTimer > 0) { gs.boss.hp = 0; } else { gs.boss.hp -= b.weapon.damage; }
          // Efectos visuales de impacto
          spawnBlood(b.x, b.y);
          spawnFloat(p.instaKillTimer > 0 ? 'INSTA!' : '-' + b.weapon.damage, b.x, b.y - 10, p.instaKillTimer > 0 ? '#ff00ff' : '#fff');
          b.dead = true; hit = true;
          if (gs.boss.hp <= 0 && !gs.boss.dead) killBoss(gs, gs.boss);
          break;
        }
      }
      // ─── COLISIÓN: BALA DEL JUGADOR VS ZOMBIES ───
      if (!b.isEnemy) for (const z of gs.zombies) {
        if (z.dead) continue;
        const hw = z.w/2;
        // Verifica colisión con el zombie
        if (b.x > z.x-hw && b.x < z.x+hw && b.y > z.y-z.height && b.y < z.y+5) {
          // Headshot: si la bala golpea la cabeza (25% superior del zombie) hace el doble de daño
          const headshot = b.y < z.y - z.height*0.75;
          const dmg = b.weapon.damage * (headshot ? 2 : 1);
          if (p.instaKillTimer > 0) { z.hp = 0; } else { z.hp -= dmg; }
          // Sangre y textos flotantes
          spawnBlood(b.x, b.y);
          if (p.instaKillTimer > 0) {
            spawnFloat('INSTA!', b.x, b.y-10, '#ff00ff');
          } else {
            spawnFloat('-'+dmg, b.x, b.y-10, headshot ? '#ffff00' : '#fff');
            if (headshot) spawnFloat('HEADSHOT!', b.x, b.y-30, '#ffdd00');
          }
          // Puntuación: el headshot da el doble de puntos
          gs.score += headshot ? dmg*2 : dmg;
          b.dead = true; hit = true;
          if (z.hp <= 0 && !z.dead) killZombie(gs, z, b.x, b.y);
          break;
        }
      }
    }
    // Si la bala murió, la elimina de la lista
    if (b.dead) gs.bullets.splice(i, 1);
  }

  // ─── ZOMBIES ───
  // Sistema de inteligencia artificial de enemigos.
  // Cada tipo de zombie tiene su propio comportamiento:
  //   Tipo 0 (Shambler): Avanza lentamente hacia el jugador. Básico.
  //   Tipo 1 (Runner): Muy rápido, poca vida, puede saltar.
  //   Tipo 2 (Brute): Lento pero mucha vida; sacude la pantalla al caminar.
  //   Tipo 3: Zombie saltarín (usa salto frecuente).
  //   Tipo 4 (Shooter): Mantiene distancia y dispara balas al jugador.
  //   Tipo 5 (Bomber): Se acerca y explota, dañando al jugador y a otros zombies.
  //   Tipo 6 (Electrician): Huye del jugador y oscurece la pantalla (FOV reducido).
  // Itera hacia atrás para eliminar zombies muertos de forma segura
  let bruteStomping = false;
  for (let i=gs.zombies.length-1; i>=0; i--) {
    const z = gs.zombies[i];
    z.animTimer += dt;                                  // Avanza la animación del zombie
    z.groanTimer -= dt;                                 // Temporizador para sonidos de quejido
    // Cuando el temporizador llega a 0, reproduce un sonido de zombie
    if (z.groanTimer <= 0) {
      z.groanTimer = 2 + Math.random()*4;                // Siguiente quejido en 2-6 segundos
      if (z.type===2) SFX.brute(); else SFX.groan();     // Sonido diferente para Brutes
    }
    // ─── ZOMBIE MUERTO: espera a que termine la animación de muerte ───
    if (z.dead) {
      z.deathTimer -= dt;
      if (z.deathTimer <= 0) gs.zombies.splice(i, 1);  // Elimina cuando la animación termina
      continue;
    }

    // ─── IA DE MOVIMIENTO ───
    // Calcula la distancia horizontal entre el zombie y el jugador
    const dx = p.x - z.x;
    z.dir = dx > 0 ? 1 : -1;                             // El zombie mira hacia el jugador
    // Tipo 4 (Shooter): mantiene distancia, se aleja si está muy cerca
    if (z.type === 4) {
      const dist = Math.abs(dx);
      if (dist > 300) {
        z.vx = Math.sign(dx) * z.speed;                 // Se acerca al jugador si está lejos
      } else if (dist < 150) {
        z.vx = -Math.sign(dx) * z.speed;                // Se aleja del jugador si está muy cerca
      } else {
        z.vx = 0;                                        // Se queda quieto en rango medio
      }
    // Tipo 6 (Electrician): huye del jugador
    } else if (z.type === 6) {
      const fleeDist = Math.abs(dx);
      if (fleeDist < 400) {
        z.vx = -Math.sign(dx) * z.speed;                // Huye si está cerca
      } else if (fleeDist > 600) {
        z.vx = Math.sign(dx) * z.speed * 0.6;           // Vuelve si se aleja mucho
      } else {
        z.vx += (Math.random() - 0.5) * 20 * dt;         // Movimiento errático en rango medio
        z.vx = Math.max(-z.speed * 0.5, Math.min(z.speed * 0.5, z.vx));
      }
    } else {
      z.vx = z.dir * z.speed;                            // Tipos normales: avanzan hacia el jugador
    }

    // ─── SALTO DE ZOMBIES ───
    z.jumpCooldown = Math.max(0, z.jumpCooldown - dt);
    if (z.onGround && z.jumpCooldown <= 0) {
      const py = p.y;
      if (py < z.y - 30) {                              // Si el jugador está más arriba que el zombie
        // Solo ciertos tipos de zombies pueden saltar
        const canJump = (z.type===1) || (z.type===3) || (z.type===2 && Math.abs(dx)<200) || (z.type===0 && false);
        if (canJump) {
          z.vy = JUMP_VEL * (z.type===2 ? 0.7 : z.type===3 ? 0.85 : 0.9);  // Velocidad de salto variable
          z.onGround = false;
          z.jumpCooldown = (z.type===3 ? 0.8 : 1.5);     // Tiempo entre saltos
        }
      }
    }

    z.onGround = false;
    updatePhysics(z, dt);                                // Aplica gravedad y físicas al zombie

    // ─── BRUTE (Tipo 2): efecto de pisada que sacude la pantalla ───
    if (z.type===2 && z.onGround) {
      // Cada vez que la animación del Brute cambia de paso, sacude la cámara
      const stomping = Math.floor(z.animTimer * 1.5) % 2 === 0;
      if (stomping && !z._wasStomping) { gs.camShake = 2; bruteStomping = true; }
      z._wasStomping = stomping;
    }

    // ─── SHOOTER (Tipo 4): dispara al jugador ───
    // Enemigo a distancia: calcula ángulo hacia el jugador y crea una bala
    // con dispersión aleatoria para que no sea 100% precisa.
    if (z.type === 4) {
      const dx = p.x - z.x;
      const dy = (p.y - 20) - (z.y - 20);
      z.shootTimer -= dt;
      // Cuando el temporizador de disparo llega a 0, el Shooter dispara
      if (z.shootTimer <= 0) {
        z.shootTimer = 2.0 + Math.random() * 1.5;         // Tiempo entre disparos (2-3.5 segundos)
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 600) {                                  // Solo dispara si el jugador está cerca
          const angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.25; // Ángulo con dispersión
          const spd = WEAPONS[0].speed;
          const b = new Bullet(z.x, z.y - 20, Math.cos(angle)*spd, Math.sin(angle)*spd, WEAPONS[0]);
          b.isEnemy = true;                                 // Marca como bala enemiga
          gs.bullets.push(b);
        }
      }
    }

    // ─── BOMBER (Tipo 5): se arma y explota al acercarse al jugador ───
    // Zombie suicida: cuando está cerca del jugador, se "arma" (arming=true),
    // se queda quieto y después de un breve tiempo explota.
    // La explosión daña tanto al jugador como a otros zombies cercanos.
    if (z.type === 5) {
      const dist = Math.abs(z.x - p.x);
      if (z.arming) {
        // Si ya está armado, se queda quieto y espera a explotar
        z.vx = 0;
        z.armTimer -= dt;
        if (z.armTimer <= 0) {
          killZombie(gs, z, z.x, z.y);                  // Explota cuando el temporizador llega a 0
        }
      } else if (dist < 28 && Math.abs(z.y - p.y) < 40) {
        z.arming = true;                                 // Comienza a armarse al estar cerca del jugador
        z.vx = 0;
      }
    }

    // ─── ATAQUE CUERPO A CUERPO DE ZOMBIES (excepto Shooters y Bombers) ───
    // Calcula la distancia al jugador
    const dist = Math.abs(z.x - p.x);
    // Si está muy cerca y no es Shooter ni Bomber, ataca cuerpo a cuerpo
    if (z.type !== 4 && z.type !== 5 && dist < 28 && Math.abs(z.y - p.y) < 40) {
      z.attackCooldown = Math.max(0, z.attackCooldown - dt);
      if (z.attackCooldown <= 0 && p.hitCooldown <= 0) {
        p.hp -= z.damage;                                 // Daño al jugador
        p.hitCooldown = 2.5;                               // Invulnerabilidad temporal
        gs.damageFlash = 1;                                // Destello de daño
        z.attackCooldown = 0.1;
        if (p.hp <= 0) { p.hp = 0; p.dead = true; SFX.hurt(); }
        else if (Math.random()<0.1) SFX.hurt();            // 10% de probabilidad de sonido de dolor
      }
    }
  }

  // ─── OBJETOS RECOGIBLES (POWER-UPS) ───
  // Sistema de colección: cada pickup tiene un tiempo de vida limitado,
  // una animación de flotación (bob), y se recoge al acercarse (dist < 30px).
  // Tipos de power-ups:
  //   'health'        → +30 HP al jugador
  //   'instakill'     → Mata cualquier enemigo de un golpe (17s)
  //   'doubleshot'    → Dispara al doble de velocidad (12s)
  //   'unlimitedammo' → Munición infinita (13s)
  //   'ammo' o default → Recarga ambas armas al máximo
  for (let i=gs.pickups.length-1; i>=0; i--) {
    const pk = gs.pickups[i];
    pk.bob += dt * 3;                                    // Animación de flotación (sube y baja)
    pk.life -= dt;                                       // Duración antes de desaparecer
    if (pk.life <= 0) { gs.pickups.splice(i,1); continue; } // Elimina si el tiempo de vida se agotó
    // Distancia entre el jugador y el pickup
    const dist = Math.hypot(pk.x - p.x, pk.y - p.y);
    if (dist < 30) {                                     // El jugador recoge el objeto (rango de 30px)
      // ─── TIPOS DE POWER-UP ───
      if (pk.type==='health') { p.hp = Math.min(p.maxHp, p.hp+30); spawnFloat('+30 HP', pk.x, pk.y-20, '#f55'); }
      else if (pk.type==='instakill') { p.instaKillTimer = 17; spawnFloat('INSTA-KILL!', pk.x, pk.y-20, '#ff00ff'); }
      else if (pk.type==='doubleshot') { p.doubleShotTimer = 12; spawnFloat('DOUBLE SHOT!', pk.x, pk.y-20, '#ff6600'); }
      else if (pk.type==='unlimitedammo') { p.unlimitedAmmoTimer = 13; spawnFloat('UNLIMITED AMMO!', pk.x, pk.y-20, '#00ccff'); }
      else {                                              // Munición (tipo 'ammo' o cualquier otro)
        // Recarga ambas armas al máximo
        for (let wi = 0; wi < 2; wi++) {
          const wpnIdx = p.slotWeaponIndices ? p.slotWeaponIndices[wi] : wi;
          p.weaponTotalAmmo[wi] = WEAPONS[wpnIdx].totalAmmo;
          p.weaponAmmo[wi] = WEAPONS[wpnIdx].magSize;
        }
        p.totalAmmo = p.weaponTotalAmmo[p.weaponIndex];
        p.ammo = p.weaponAmmo[p.weaponIndex];
        p.reloading = false;
        spawnFloat('+AMMO', pk.x, pk.y-20, '#ff0');
      }
      SFX.pickup();                                      // Sonido de recoger objeto
      gs.pickups.splice(i,1);                            // Elimina el pickup de la lista
    }
  }

  // ─── SPAWN DE ZOMBIES ───
  // Si aún quedan zombies por aparecer
  if (gs.zombiesToSpawn.length > 0) {
    gs.spawnTimer -= dt;
    if (gs.spawnTimer <= 0) {
      spawnNextZombie(gs);                               // Crea un nuevo zombie
      gs.spawnTimer = Math.max(0.8, gs.spawnInterval - gs.wave*0.1); // El intervalo se reduce con cada oleada
    }
  }

  // ─── ANUNCIO DE JEFE ───
  if (gs.bossAnnouncement && gs.bossAnnouncement.active) {
    gs.bossAnnouncement.timer = (gs.bossAnnouncement.timer || 3.5) - dt;
    // Cuando quedan menos de 0.5 segundos, empieza a desvanecerse
    if (gs.bossAnnouncement.timer <= 0.5) {
      gs.bossAnnouncement.opacity = Math.max(0, gs.bossAnnouncement.timer / 0.5);
    }
    if (gs.bossAnnouncement.timer <= 0) {
      gs.bossAnnouncement.active = false;                // Desactiva el anuncio
      gs.bossAnnouncement.opacity = 0;
    }
  }

  // ─── JEFE (BOSS) ───
  // Sistema del jefe: aparece cada 5 oleadas.
  // Tiene dos formas de ataque:
  //   1. Daño por contacto: si toca al jugador, hace daño con enfriamiento.
  //   2. Ataque a distancia: dispara proyectiles de ácido verde hacia el jugador.
  // Además, durante la pelea con el jefe aparecen refuerzos (swarm) de zombies normales.
  if (gs.boss && !gs.boss.dead) {
    const boss = gs.boss;
    boss.animTimer += dt;
    boss.contactCooldown = Math.max(0, boss.contactCooldown - dt);

    // Movimiento: el jefe avanza hacia el jugador
    const dx = p.x - boss.x;
    boss.dir = dx > 0 ? 1 : -1;
    boss.vx = boss.dir * boss.speed;

    boss.onGround = false;
    updatePhysics(boss, dt);                             // Aplica físicas al jefe

    // Daño por contacto: si el jefe toca al jugador
    const dist = Math.abs(boss.x - p.x);
    if (dist < 40 && Math.abs(boss.y - p.y) < 60 && boss.contactCooldown <= 0 && p.hitCooldown <= 0) {
      p.hp -= boss.damage;
      p.hitCooldown = 2.5;
      gs.damageFlash = 1;
      boss.contactCooldown = 1.5;                         // Tiempo entre ataques de contacto
      if (p.hp <= 0) { p.hp = 0; p.dead = true; SFX.hurt(); }
      else SFX.hurt();
    }

    // Ataque a distancia: dispara proyectiles de ácido
    boss.attackTimer -= dt;
    const acidCount = gs.acidProjectiles.filter(a=>!a.dead).length;
    // Si el temporizador de ataque llega a 0 y hay menos de 4 proyectiles activos
    if (boss.attackTimer <= 0 && acidCount < 4) {
      boss.attackTimer = 2.0;                             // Siguiente ataque en 2 segundos
      // Calcula el ángulo hacia el jugador
      const angle = Math.atan2((p.y - 20) - (boss.y - boss.height * 0.4), p.x - boss.x);
      const spd = 350;                                    // Velocidad del proyectil
      gs.acidProjectiles.push({
        x: boss.x,
        y: boss.y - boss.height * 0.4,                    // Sale de la boca del jefe
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        dead: false,
        radius: 6,                                        // Tamaño del proyectil
      });
    }
  }

  // ─── PROYECTILES DE ÁCIDO ───
  for (let i = gs.acidProjectiles.length - 1; i >= 0; i--) {
    const a = gs.acidProjectiles[i];
    if (a.dead) { gs.acidProjectiles.splice(i, 1); continue; }
    a.x += a.vx * dt;                                    // Movimiento horizontal
    a.y += a.vy * dt;                                    // Movimiento vertical
    // Elimina si sale del mundo
    if (a.x < 0 || a.x > WORLD_W || a.y > GROUND_Y + 20) { a.dead = true; continue; }
    if (a.y < -200) { a.dead = true; continue; }
    // Colisión con el jugador
    const dx = a.x - p.x;
    const dy = a.y - (p.y - 20);
    if (Math.sqrt(dx * dx + dy * dy) < 20 && p.hitCooldown <= 0) {
      p.hp -= 18;                                         // Daño del ácido
      p.hitCooldown = 2.5;
      gs.damageFlash = 1;
      a.dead = true;
      if (p.hp <= 0) { p.hp = 0; p.dead = true; SFX.hurt(); }
      else SFX.hurt();
    }
  }

  // ─── GRANADAS ───
  // Sistema de granadas: siguen una trayectoria parabólica con gravedad.
  // Explotan al contacto con el suelo, al salir del mundo, o cuando
  // se agota el temporizador. La explosión daña a todos los zombies
  // dentro del radio (200 de daño) y también puede dañar al jugador.
  for (let i = gs.grenades.length - 1; i >= 0; i--) {
    const g = gs.grenades[i];
    if (g.dead) { gs.grenades.splice(i, 1); continue; }
    g.trail.push({ x: g.x, y: g.y });                   // Guarda posición para la estela
    if (g.trail.length > 6) g.trail.shift();             // Mantiene solo las últimas 6 posiciones
    g.x += g.vx * dt;                                    // Movimiento horizontal
    g.y += g.vy * dt;                                    // Movimiento vertical
    g.vy += GRAVITY * dt;                                // Aplica gravedad (la granada cae)
    g.timer -= dt;                                       // Temporizador antes de explotar
    // Explota cuando: el temporizador llega a 0, toca el suelo, o sale del mundo
    if (g.timer <= 0 || g.y >= GROUND_Y || g.x < 0 || g.x > WORLD_W) {
      g.dead = true;
      grenadeExplode(gs, g.x, Math.min(g.y, GROUND_Y)); // Explota al tocar el suelo o agotar el tiempo
    }
  }

  // ─── ANIMACIÓN DE MUERTE DEL JEFE ───
  if (gs.boss && gs.boss.dead && gs.boss.deathCircles) {
    let allDone = true;
    // Los deathCircles son círculos que se expanden al morir el jefe
    for (const c of gs.boss.deathCircles) {
      c.timer -= dt;
      if (c.timer > 0) allDone = false;
    }
    // Cuando todos los círculos terminan, elimina al jefe
    if (allDone) {
      gs.boss = null;                                    // Elimina al jefe cuando la animación termina
      gs.boss.deathCircles = null;
    }
  }

  // ─── REFUERZOS DURANTE OLEADA DE JEFE ───
  if (gs.bossWave) {
    gs.swarmTimer -= dt;
    // Cuando el temporizador de refuerzos llega a 0 y aún quedan zombies por spawnear
    if (gs.swarmTimer <= 0 && gs.zombiesToSpawn.length > 0 && gs.spawnTimer > 900) {
      gs.spawnTimer = 1.5;                               // Reactiva el spawn de refuerzos
    }
  }

  // ─── OLEADA COMPLETADA ───
  // Se activa cuando no quedan zombies por spawnear ni vivos, y el jefe (si aplica) está muerto
  if (gs.zombiesToSpawn.length===0 && gs.zombies.filter(z=>!z.dead).length===0 && gs.zombiesKilledThisWave > 0 && !gs.showWaveComplete && (!gs.bossWave || !gs.boss || gs.boss.dead)) {
    gs.showWaveComplete = true;
    gs.waveCompleteTimer = 6.5;                         // Tiempo para mostrar el banner
    playWaveSound();                                     // Sonido de oleada completada
    gs.score += 500 * gs.wave;                           // Bonus por completar la oleada (más puntos en oleadas avanzadas)
    gs.wavesCleared++;                                   // Incrementa el contador de oleadas limpiadas
    gs.player.hp = Math.min(gs.player.maxHp, gs.player.hp + 20); // Curación al jugador (20 HP)
    spawnFloat('+20 HP', gs.player.x, gs.player.y - 40, '#55ff55');
    gs.waveEndDelay = 0.01;                              // Pequeña pausa antes de la siguiente oleada
  }

  if (gs.waveEndDelay > 0) {
    gs.waveEndDelay -= dt;
  }

  // ─── EFECTOS VISUALES ───
  spawnAsh();                                            // Partículas de ceniza / polvo ambiental
  updateParticles(dt);                                   // Actualiza partículas visuales
  updateFloatTexts(dt);                                  // Actualiza textos flotantes (daño, power-ups)
}

// ─── INTENTAR DISPARO ───
// Sistema de disparo del jugador. Crea una o varias balas (pellets para escopeta)
// desde la posición del jugador hacia donde apunta el mouse.
// Verifica: munición disponible, recarga en curso, enfriamiento entre disparos.
// Aplica la dispersión (spread) del arma y efectos visuales (fogonazo, casquillos, sonido).
// Soporta power-ups: Double Shot (reduce fireRate a la mitad) y Unlimited Ammo (no gasta balas).
function tryShoot(gs) {
  const p = gs.player;
  // No puede disparar si: está recargando, en enfriamiento, o muerto
  if (p.reloading || p.fireCooldown > 0 || p.dead) return;
  // Si no tiene munición infinita, verifica la munición normal
  if (p.unlimitedAmmoTimer <= 0) {
    if (p.ammo <= 0) {
      SFX.empty();                                          // Sonido de clic en vacío
      // Si tiene munición de reserva, comienza la recarga automática
      if (p.totalAmmo > 0) { p.reloading=true; p.reloadTimer=p.weapon.reloadTime; SFX.reload(); }
      return;
    }
    p.ammo--;                                               // Gasta una bala
  }
  // El Double Shot reduce el tiempo entre disparos a la mitad
  p.fireCooldown = p.weapon.fireRate * (p.doubleShotTimer > 0 ? 0.5 : 1);

  // ─── DIRECCIÓN DEL DISPARO ───
  // Convierte la posición del mouse a coordenadas del mundo (sumando el desplazamiento de cámara)
  const worldMouseX = mouse.x + gs.camX;
  const worldMouseY = mouse.y - (gs.busCamY || 0);
  const baseAngle = Math.atan2(worldMouseY - (p.y - 20), worldMouseX - p.x); // Ángulo hacia el mouse
  const pellets = p.weapon.pellets || 1;                  // Número de proyectiles por disparo (escopeta tiene varios)

  // ─── CREAR BALAS ───
  for (let pi = 0; pi < pellets; pi++) {
    // Cada bala tiene una pequeña dispersión aleatoria (spread del arma)
    const angle = baseAngle + (Math.random() - 0.5) * p.weapon.spread * 2;
    const spd = p.weapon.speed + (Math.random() - 0.5) * 100;
    // Desplazamiento lateral para simular múltiples cañones (ej. escopeta)
    const offsetX = pi === 0 ? 0 : (Math.cos(baseAngle + Math.PI / 2) * (pi % 2 === 0 ? 4 : -4));
    const offsetY = pi === 0 ? 0 : (Math.sin(baseAngle + Math.PI / 2) * (pi % 2 === 0 ? 4 : -4));
    // Crea la bala y la agrega a la lista
    const b = new Bullet(p.x + Math.cos(angle) * 20 + offsetX, p.y - 22 + Math.sin(angle) * 20 + offsetY,
      Math.cos(angle) * spd, Math.sin(angle) * spd, p.weapon);
    gs.bullets.push(b);
  }

  // ─── EFECTOS DE DISPARO ───
  p.shootRecoil = 1 + (p.weapon.shake || 0) * 0.5;        // Retroceso visual
  p.muzzleX = p.x + Math.cos(baseAngle) * 28;              // Posición del fogonazo (boca del cañón)
  p.muzzleY = p.y - 22 + Math.sin(baseAngle) * 28;
  p.muzzleFlash = 0.08;                                    // Duración del fogonazo

  // Partículas de casquillo (solo para armas automáticas: AK-47 y otra)
  if (p.weapon.index === 1 || p.weapon.index === 4) {
    particles.push({
      x: p.x + p.dir*5, y: p.y-18,
      vx: -p.dir*60 + Math.random()*40,
      vy: -80 - Math.random()*60,
      life: 0.6, maxLife: 0.6,
      color: '#c8a040', gravity: GRAVITY,
      size: 3, isRect: true,
    });
  }

  // Sonido según el tipo de arma
  if (p.weapon.index === 1 || p.weapon.index === 4) SFX.ak47(); else SFX.pistol();
}

// ─── EXPLOSIÓN DE ZOMBIE BOMBA ───
// Cuando un Bomber (tipo 5) muere, explota causando daño en área.
// Afecta al jugador (30 de daño si está cerca) y a otros zombies (150 de daño).
// Puede generar reacciones en cadena si hay varios Bombers cerca.
// Produce efecto visual de explosión, sonido y sacudida de cámara.
function bombExplode(gs, z) {
  // Calcula la distancia al jugador
  const dist = Math.hypot(z.x - gs.player.x, z.y - gs.player.y);
  if (dist < 130) {                                       // Daño al jugador si está dentro del radio de explosión
    gs.player.hp -= 30;
    gs.player.hitCooldown = 2.5;
    gs.damageFlash = 1;
    if (gs.player.hp <= 0) { gs.player.hp = 0; gs.player.dead = true; SFX.hurt(); }
  }
  const blastRadius = 120;                                 // Radio de la explosión
  const blastDmg = 150;                                    // Daño a otros zombies
  const toKill = [];                                       // Lista de zombies que morirán por la explosión
  for (const other of gs.zombies) {
    if (other === z || other.dead) continue;
    if (Math.hypot(other.x - z.x, other.y - z.y) < blastRadius) {
      other.hp -= blastDmg;                               // Daña a otros zombies en el radio
      if (other.hp <= 0 && !other.dead) toKill.push(other);
    }
  }
  // Mata a los zombies que murieron por la explosión
  for (const oz of toKill) killZombie(gs, oz, z.x, z.y);
  spawnExplosion(z.x, z.y - z.height / 2);                // Efecto visual de explosión
  SFX.explosion();                                         // Sonido de explosión
  gs.camShake = Math.max(gs.camShake, 6);                 // Sacude la pantalla
}

// ─── MATAR ZOMBIE ───
// Gestiona la muerte de un zombie: marca como muerto, suma puntos según el tipo,
// genera efectos visuales (partículas de sangre, texto flotante con los puntos),
// y con un 25% de probabilidad deja caer un power-up (health, ammo, instakill,
// doubleshot o unlimitedammo). Si el zombie es un Bomber (tipo 5), explota al morir.
// Si es un Electrician (tipo 6), restaura la iluminación normal al morir.
function killZombie(gs, z, bx, by) {
  if (z.dead) return;                                      // Si ya está muerto, no hace nada
  z.dead = true;
  if (z.type === 5) bombExplode(gs, z);                    // Los Bombers explotan al morir (efecto cadena)
  z.deathTimer = 0.8;                                      // Duración de la animación de muerte (0.8 segundos)
  gs.zombiesRemaining--;
  gs.zombiesKilledThisWave++;
  // Puntos según el tipo de zombie (en el orden de los tipos)
  const PTS = [100, 150, 400, 100, 200, 200];
  // Colores de sangre/partículas según el tipo
  const COLORS = ['#6b7c3a','#aaa','#4a5520','#9933cc','#8a3a3a','#cc5500'];
  const pts = PTS[z.type] || 100;
  gs.score += pts;                                         // Suma puntos al jugador
  gs.zombiesKilled++;                                      // Incrementa el contador total de muertes
  spawnDeathParts(z.x, z.y - z.height/2, COLORS[z.type] || '#6b7c3a'); // Partículas de muerte

  // 25% de probabilidad de dejar caer un power-up
  if (Math.random() < 0.25) {
    const r = Math.random();
    // Probabilidades: 40% salud, 25% munición, ~7.5% cada power-up especial
    const type = r < 0.40 ? 'health' : r < 0.65 ? 'ammo' : r < 0.725 ? 'instakill' : r < 0.875 ? 'doubleshot' : 'unlimitedammo';
    gs.pickups.push(new Pickup(type, z.x, z.y - 5));       // Crea el pickup en la posición del zombie
  }

  spawnFloat('+' + pts, z.x, z.y-z.height-10, '#ffb833'); // Texto flotante con los puntos obtenidos

  // ─── [NEW] ELECTRICIAN DEATH → RESTORE LIGHTS ───
  // Cuando muere un Electrician (tipo 6), restaura la iluminación normal
  if (z.type === 6 && typeof window._onElectricianKilled === 'function') {
    window._onElectricianKilled();
  }
}

// ─── MATAR JEFE ───
// Gestiona la muerte del jefe: reproduce sonido, genera explosión visual,
// fuerte temblor de pantalla, círculos de expansión animados (deathCircles),
// suma 500 puntos, suelta un power-up aleatorio y acelera los refuerzos restantes.
function killBoss(gs, boss) {
  if (boss.dead) return;
  boss.dead = true;
  boss.deathTimer = 1.5;                                   // Duración de la animación de muerte del jefe
  gs.zombiesKilledThisWave++;
  gs.score += 500;                                         // Puntos por matar al jefe (500)
  gs.zombiesKilled++;

  SFX.bossDeath();                                         // Sonido de muerte del jefe
  spawnExplosion(boss.x, boss.y - boss.height / 2);        // Explosión visual
  gs.camShake = Math.max(gs.camShake, 8);                  // Fuerte temblor de pantalla

  // Círculos de expansión para la animación de muerte (3 círculos que crecen)
  boss.deathCircles = [
    { x: boss.x, y: boss.y - boss.height / 2, timer: 0.4, maxT: 0.4, maxR: 60 },
    { x: boss.x, y: boss.y - boss.height / 2, timer: 0.48, maxT: 0.48, maxR: 80 },
    { x: boss.x, y: boss.y - boss.height / 2, timer: 0.56, maxT: 0.56, maxR: 100 },
  ];

  // Suelta un power-up aleatorio al morir
  const types = ['health', 'ammo', 'instakill', 'doubleshot', 'unlimitedammo'];
  gs.pickups.push(new Pickup(types[Math.floor(Math.random() * types.length)], boss.x, boss.y - 5));

  gs.swarmTimer = Math.min(gs.swarmTimer, 0.1);            // Reinicia el temporizador de refuerzos
}

// ─── EXPLOSIÓN DE GRANADA ───
// Daña a todos los zombies dentro del radio (120px) con 200 de daño masivo
// (suficiente para matar a la mayoría de zombies de un solo golpe).
// También puede dañar al jugador si está demasiado cerca (30 de daño colateral).
// Produce sonido, explosión visual y sacudida de cámara.
function grenadeExplode(gs, x, y) {
  SFX.explosion();                                         // Sonido de explosión
  spawnExplosion(x, y);                                    // Efecto visual de explosión
  gs.camShake = Math.max(gs.camShake, 8);                  // Temblor de pantalla

  const blastRadius = 120;                                 // Radio de la explosión
  const toKill = [];                                       // Zombies que morirán
  // Daña a todos los zombies en el radio
  for (const z of gs.zombies) {
    if (z.dead) continue;
    if (Math.hypot(z.x - x, z.y - y) < blastRadius) {
      z.hp -= 200;                                         // Daño masivo (suficiente para matar a la mayoría)
      if (z.hp <= 0 && !z.dead) toKill.push(z);
    }
  }
  // Mata a los zombies que murieron
  for (const z of toKill) killZombie(gs, z, x, y);

  // Daño colateral al jugador si está muy cerca de la explosión
  const distToPlayer = Math.hypot(gs.player.x - x, gs.player.y - y);
  if (distToPlayer < blastRadius && gs.player.hitCooldown <= 0) {
    gs.player.hp -= 30;
    gs.player.hitCooldown = 2;
    gs.damageFlash = 1;
    if (gs.player.hp <= 0) { gs.player.hp = 0; gs.player.dead = true; SFX.hurt(); }
  }
}
