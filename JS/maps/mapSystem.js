// ─── SISTEMA DE SELECCIÓN DE MAPAS ───
// Este módulo maneja la pantalla donde el jugador elige entre "Abandoned City"
// (mapa clásico con scroll infinito) y "The Moving Bus" (bus con dos zonas: techo y cabina).
//
// ESTRATEGIA: usa el patrón "monkey-patching" (envoltura/wrapper) para reemplazar
// funciones globales (createGameState, startGame, loop, renderGame, updatePlaying,
// updatePhysics, spawnNextZombie, drawHUD) sin modificar el código original.
// Esto permite que el sistema de mapas se "inyecte" en el flujo normal del juego
// y redirija la lógica según el mapa seleccionado.
// El módulo está encapsulado en una IIFE para no contaminar el ámbito global.
(function() {
  // ─── VARIABLES INTERNAS DEL SISTEMA ───
  // Mapa actualmente seleccionado (1: Abandoned City, 2: The Moving Bus)
  let _selectedMap = 1;
  // Bandera: se pone en true cuando el jugador presiona ENTER para confirmar
  let _mapConfirmed = false;
  // Mapa sobre el cual está el mouse o la selección por teclado (1 ó 2)
  let _hovered = 1;
  // Timestamp del último frame (se usa para calcular el delta de tiempo)
  let _lastTs = 0;
  // Fase de animación decorativa de las tarjetas
  let _cardPhase = 0;
  let _selectBtn = null;                        // Botón "SELECCIONAR" (bounds)

  // ─── PANTALLA DE SELECCIÓN DE MAPA ───
  // Dibuja la interfaz con dos tarjetas (Ciudad Abandonada y Bus en Movimiento),
  // incluye fondo oscuro con degradado, título, tarjetas con miniatura y borde
  // resaltado para el mapa seleccionado o bajo el mouse.
  function drawMapSelectScreen() {
    // Avanza la fase de animación de las tarjetas
    _cardPhase += 0.016;
    // ─── Fondo oscuro con degradado radial tenue ───
    ctx.fillStyle = '#0d0d0d';
    ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
    const grad = ctx.createRadialGradient(LOGICAL_W/2, LOGICAL_H/2, 100, LOGICAL_W/2, LOGICAL_H/2, 500);
    grad.addColorStop(0, 'rgba(80,0,0,0.15)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);

    // ─── Título "SELECT YOUR BATTLEFIELD" con sombra dorada ───
    ctx.textAlign = 'center';
    ctx.save();
    ctx.shadowColor = 'rgba(255,184,51,0.25)';
    ctx.shadowBlur = 20;
    ctx.fillStyle = '#ffb833';
    ctx.font = 'bold 36px monospace';
    ctx.fillText('SELECT YOUR BATTLEFIELD', LOGICAL_W/2, 60);
    ctx.restore();

    // ─── DEFINICIÓN DE LAS TARJETAS ───
    // Cada tarjeta tiene nombre, id, descripción y una función que dibuja
    // una miniatura representativa del mapa.
    const cards = [
      {
        // Tarjeta 1: Ciudad abandonada con scroll infinito
        name: 'ABANDONED CITY', id: 1,
        desc: 'Open streets. Ruined skyline.\nInfinite scrolling warzone.',
        drawThumb: function(x, y, w, h) {
          const g = ctx.createLinearGradient(x, y, x, y+h);
          g.addColorStop(0, '#1a0a2e'); g.addColorStop(0.5, '#6b1a1a'); g.addColorStop(1, '#c4501a');
          ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
          ctx.fillStyle = '#1a1020';
          for (let i=0; i<4; i++) ctx.fillRect(x+20+i*80, y+20, 60, 40+(i*17)%30);
          ctx.fillStyle = '#2a1820';
          for (let i=0; i<3; i++) ctx.fillRect(x+40+i*100, y+60, 80, 30+(i*13)%20);
          ctx.fillStyle = '#222'; ctx.fillRect(x, y+h-15, w, 15);
          ctx.fillStyle = '#555';
          for (let i=0; i<6; i++) ctx.fillRect(x+10+i*55, y+h-12, 30, 4);
          ctx.fillStyle = 'rgba(0,0,0,0.4)';
          ctx.fillRect(x+30, y+55, 50, 12); ctx.fillRect(x+150, y+70, 50, 12);
        }
      },
      {
        // Tarjeta 2: Bus en movimiento con dos zonas (techo y cabina)
        name: 'THE MOVING BUS', id: 2,
        desc: 'Trapped on a runaway bus.\nTwo zones. No escape.',
        drawThumb: function(x, y, w, h) {
          ctx.fillStyle = '#1a0a2e'; ctx.fillRect(x, y, w, h);
          for (let i=0; i<6; i++) {
            ctx.fillStyle = '#0d0d1a';
            ctx.fillRect(x+10+i*55-(i*13)%30, y+8, 40, 60+(i*11)%30);
          }
          ctx.fillStyle = '#2a4a2a';
          ctx.beginPath();
          ctx.roundRect(x+10, y+40, w-20, h-55, 6);
          ctx.fill();
          ctx.fillStyle = '#1e3a1e';
          ctx.fillRect(x+10, y+58, w-20, 8);
          ctx.fillStyle = '#1a1a1a';
          ctx.beginPath(); ctx.arc(x+30, y+h-15, 14, 0, Math.PI*2); ctx.fill();
          ctx.beginPath(); ctx.arc(x+w-30, y+h-15, 14, 0, Math.PI*2); ctx.fill();
          ctx.fillStyle = '#444';
          ctx.beginPath(); ctx.arc(x+30, y+h-15, 7, 0, Math.PI*2); ctx.fill();
          ctx.beginPath(); ctx.arc(x+w-30, y+h-15, 7, 0, Math.PI*2); ctx.fill();
          for (let i=0; i<4; i++) {
            ctx.fillStyle = 'rgba(170,204,255,0.3)';
            ctx.fillRect(x+25+i*55, y+48, 40, 28);
          }
        }
      }
    ];

    // ─── DISPOSICIÓN DE LAS TARJETAS ───
    // Calcula la posición de las dos tarjetas centradas horizontalmente
    const gap = 60;       // Espacio entre tarjetas
    const cardW = 380;    // Ancho de cada tarjeta
    const cardH = 260;    // Alto de cada tarjeta
    const totalW = cardW * 2 + gap;
    const startX = (LOGICAL_W - totalW) / 2;  // X inicial para centrar
    const cardY = 100;    // Posición Y fija de las tarjetas

    // ─── DIBUJAR CADA TARJETA ───
    for (let i = 0; i < cards.length; i++) {
      const cx = startX + i * (cardW + gap);
      // Detecta si el mouse está sobre esta tarjeta
      const hover = mouse.x > cx && mouse.x < cx + cardW && mouse.y > cardY && mouse.y < cardY + cardH;
      const selected = cards[i].id === _hovered;
      if (hover) _hovered = cards[i].id;

      // Efecto de elevación al hacer hover y color de borde según estado
      const lift = hover ? 4 : 0;
      const borderColor = selected ? '#ffb833' : hover ? '#ffb833' : '#333';

      // ─── Fondo de la tarjeta ───
      ctx.fillStyle = '#1a1a1a';
      ctx.beginPath();
      ctx.roundRect(cx, cardY - lift, cardW, cardH, 8);
      ctx.fill();

      // ─── Borde de la tarjeta ───
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = selected ? 2.5 : 2;
      ctx.beginPath();
      ctx.roundRect(cx, cardY - lift, cardW, cardH, 8);
      ctx.stroke();

      // ─── Miniatura del mapa (thumbnail) con recorte ───
      const thumbX = cx + 20, thumbY = cardY + 20 - lift, thumbW = 340, thumbH = 150;
      ctx.save();
      ctx.beginPath(); ctx.roundRect(thumbX, thumbY, thumbW, thumbH, 4); ctx.clip();
      cards[i].drawThumb(thumbX, thumbY, thumbW, thumbH);
      ctx.restore();
      ctx.strokeStyle = '#333'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.roundRect(thumbX, thumbY, thumbW, thumbH, 4); ctx.stroke();

      // ─── Nombre del mapa ───
      ctx.textAlign = 'left';
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 20px monospace';
      ctx.fillText(cards[i].name, cx + 12, cardY + 200 - lift);

      // ─── Descripción del mapa (soporta múltiples líneas con \n) ───
      ctx.fillStyle = '#aaaaaa';
      ctx.font = 'italic 13px monospace';
      const lines = cards[i].desc.split('\n');
      for (let li = 0; li < lines.length; li++) {
        ctx.fillText(lines[li], cx + 12, cardY + 224 - lift + li * 16);
      }

      // ─── Marca de verificación si está seleccionado ───
      if (selected) {
        ctx.fillStyle = '#ffb833';
        ctx.font = 'bold 22px monospace';
        ctx.textAlign = 'right';
        ctx.fillText('\u2713', cx + cardW - 12, cardY + 32 - lift);
      }
    }

    // ─── Texto de ayuda en la parte inferior ───
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '14px monospace';
    ctx.fillText('Click to select   |   ENTER to confirm   |   1 / 2 keys', LOGICAL_W/2, LOGICAL_H - 20);

    // ─── BOTÓN "SELECCIONAR" (solo en móvil) ───
    if (showTouchControls) {
      const sbw = 240, sbh = 48;
      const sbx = LOGICAL_W/2 - sbw/2, sby = 385;
      const sHover = mouse.x > sbx && mouse.x < sbx+sbw && mouse.y > sby && mouse.y < sby+sbh;
      ctx.fillStyle = sHover ? '#008800' : '#005500';
      ctx.fillRect(sbx, sby, sbw, sbh);
      ctx.strokeStyle = '#00cc44';
      ctx.lineWidth = 3;
      ctx.strokeRect(sbx, sby, sbw, sbh);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 20px monospace';
      ctx.fillText('SELECCIONAR', LOGICAL_W/2, sby + 32);
      _selectBtn = { x: sbx, y: sby, w: sbw, h: sbh };
    }
  }

  // ─── MANEJO DE ENTRADA EN SELECCIÓN ───
  // Procesa teclas (1, 2, ENTER) y clics del mouse para elegir y confirmar mapa
  function handleMapSelectInput(dt) {
    // Recalcula la posición de las tarjetas (misma lógica que en drawMapSelectScreen)
    const gap = 60, cardW = 380, cardH = 260;
    const totalW = cardW * 2 + gap;
    const startX = (LOGICAL_W - totalW) / 2;
    const cardY = 100;

    // ─── SELECCIÓN CON TECLADO (teclas 1 y 2) ───
    if (keys['Digit1']) { _hovered = 1; keys['Digit1'] = false; }
    if (keys['Digit2']) { _hovered = 2; keys['Digit2'] = false; }

    // ─── SELECCIÓN CON CLIC DEL MOUSE ───
    // Detecta clic dentro de cada tarjeta y actualiza _hovered
    if ((mouse.down || pointerPressed) && !gs._clickBuf) {
      for (let i = 0; i < 2; i++) {
        const cx = startX + i * (cardW + gap);
        if (mouse.x > cx && mouse.x < cx + cardW && mouse.y > cardY && mouse.y < cardY + cardH) {
          _selectedMap = i + 1;
          _mapConfirmed = true;
          gs._clickBuf = true;
          gs = createGameState();
          startGame();
          break;
        }
      }
    }

    // ─── BOTÓN "SELECCIONAR" ───
    if ((mouse.down || pointerPressed) && !gs._clickBuf && _selectBtn &&
        mouse.x > _selectBtn.x && mouse.x < _selectBtn.x + _selectBtn.w &&
        mouse.y > _selectBtn.y && mouse.y < _selectBtn.y + _selectBtn.h) {
      _selectedMap = _hovered;
      _mapConfirmed = true;
      gs._clickBuf = true;
      gs = createGameState();
      startGame();
    }

    // ─── CONFIRMACIÓN CON ENTER ───
    // Cuando el jugador presiona Enter, se guarda el mapa seleccionado,
    // se crea un nuevo estado de juego y se inicia la partida
    if ((keys['Enter'] || keys['NumpadEnter']) && !gs._enterBuf) {
      gs._enterBuf = true;
      if (_hovered > 0) {
        _selectedMap = _hovered;
        _mapConfirmed = true;
        gs = createGameState();
        startGame();
      }
    }
  }

  // ─── ENVOLTURAS (WRAPPERS) ───
  // Las siguientes funciones reemplazan (wrap) las funciones globales originales
  // para desviar el comportamiento cuando el mapa seleccionado es el bus (id=2),
  // sin necesidad de modificar el código base del juego.

  // ─── WRAPPER: createGameState ───
  // Guarda la referencia a la función original de creación de estado
  const _origCreateGS = createGameState;
  // Inyecta la propiedad selectedMap en el estado del juego
  createGameState = function() {
    const g = _origCreateGS();
    g.selectedMap = _selectedMap;
    return g;
  };

  // ─── WRAPPER: startGame ───
  // Guarda la referencia a startGame original
  const _origStartGame = startGame;
  // Si el mapa no ha sido confirmado, muestra la pantalla de selección
  startGame = function() {
    if (!_mapConfirmed) {
      gs.state = 'mapSelect';
      ctx.clearRect(0, 0, LOGICAL_W, LOGICAL_H);
      drawMapSelectScreen();
      return;
    }
    _origStartGame();
  };

  // ─── WRAPPER: loop (bucle principal) ───
  // Guarda la referencia al bucle principal original
  const _origLoop = loop;
  // Mientras el estado sea 'mapSelect', dibuja la pantalla y procesa input
  loop = function myLoop(timestamp) {
    const _portraitBlock = showTouchControls && window.innerWidth < window.innerHeight && window.innerWidth < 768;
    if (gs && gs.state === 'mapSelect') {
      requestAnimationFrame(myLoop);
      const dt = Math.min((timestamp - (_lastTs || timestamp)) / 1000, 0.05);
      _lastTs = timestamp;
      ctx.clearRect(0, 0, LOGICAL_W, LOGICAL_H);
      if (!gs) gs = createGameState();
      if (_portraitBlock) { drawOrientationOverlay(); pointerPressed = false; return; }
      drawMapSelectScreen();
      handleMapSelectInput(dt);
      if (!mouse.down && !pointerPressed && gs) gs._clickBuf = false;
      if (!(keys['Enter'] || keys['NumpadEnter']) && gs) gs._enterBuf = false;
      pointerPressed = false;
      return;
    }
    _origLoop(timestamp);
  };

  // ─── WRAPPER: renderGame ───
  // Guarda la referencia a renderGame original
  const _origRenderGame = renderGame;
  // Si el mapa es el bus (id=2), usa renderBusMap en lugar del render original
  renderGame = function(gs) {
    if (gs.selectedMap === 2) {
      renderBusMap(gs);
    } else {
      _origRenderGame(gs);
    }
  };

  // ─── WRAPPER: updatePlaying ───
  // Guarda la referencia a updatePlaying original
  const _origUpdatePlaying = updatePlaying;
  // Ejecuta postProcessBus después del update original si estamos en el bus
  updatePlaying = function(gs, dt) {
    _origUpdatePlaying(gs, dt);
    if (gs.selectedMap === 2) {
      postProcessBus(gs, dt);
    }
  };

  // ─── WRAPPER: updatePhysics ───
  // Guarda la referencia a updatePhysics original
  const _origUpdatePhysics = updatePhysics;
  // Usa las físicas especiales del bus (escotillas, techo, cabina) en mapa 2
  updatePhysics = function(entity, dt) {
    if (gs && gs.selectedMap === 2) {
      updateBusPhysics(entity, dt);
    } else {
      _origUpdatePhysics(entity, dt);
    }
  };

  // ─── WRAPPER: spawnNextZombie ───
  // Guarda la referencia a spawnNextZombie original
  const _origSpawnNextZombie = spawnNextZombie;
  // Genera zombies a través de las ventanas rotas del bus en mapa 2
  spawnNextZombie = function(gs) {
    if (gs.selectedMap === 2) {
      spawnBusZombie(gs);
    } else {
      _origSpawnNextZombie(gs);
    }
  };

  // ─── WRAPPER: drawHUD ───
  // Guarda la referencia a drawHUD original
  const _origDrawHUD = drawHUD;
  // Agrega textos informativos del bus (ruta y tecla [T] para barricadas)
  drawHUD = function(gs) {
    _origDrawHUD(gs);
    if (gs.selectedMap === 2 && gs.state === 'playing') {
      ctx.save();
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.font = '10px monospace';
      ctx.fillText('THE MOVING BUS \u2014 Dusk Route', LOGICAL_W/2, LOGICAL_H - 6);
      ctx.fillStyle = 'rgba(255,184,51,0.35)';
      ctx.font = '9px monospace';
      ctx.fillText('[T] REPAIR BARRICADES', LOGICAL_W/2, LOGICAL_H - 18);
      ctx.restore();
    }
  };

  // ─── EXPORTACIONES ───
  // Expone funciones al ámbito global para consultar el mapa seleccionado
  // y forzar el estado de confirmación (útil para testing o reinicios)
  window._getSelectedMap = function() { return _selectedMap; };
  window._setMapConfirmed = function(v) { _mapConfirmed = v; };
})();
// ─── FIN DEL SISTEMA DE MAPAS ───
