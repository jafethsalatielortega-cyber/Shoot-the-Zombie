// ─── main.js ───
// Punto de entrada del juego. Controla la máquina de estados principal
// (title → playing → gameover) y coordina la actualización y renderizado
// en cada frame mediante requestAnimationFrame.
// También maneja pausa, transiciones entre oleadas y eventos especiales
// como el meteorito en el mapa "The Moving Bus".

// ─── VARIABLE DE TIEMPO ───
// Guarda el timestamp del último frame para calcular el delta de tiempo (dt)
let lastTime = 0;

// ─── BUCLE PRINCIPAL DEL JUEGO ───
// Se ejecuta en cada frame usando requestAnimationFrame (aprox. 60 fps).
// Este es el corazón del juego: en cada iteración se:
//   1. Calcula el delta de tiempo (dt) para animaciones independientes de FPS
//   2. Limpia el canvas
//   3. Ejecuta la lógica correspondiente al estado actual (máquina de estados)
//   4. Los estados son: 'title' → 'mapSelect' → 'playing' → 'gameover'
function loop(timestamp) {
  requestAnimationFrame(loop);

  // ─── [NEW] ACTUALIZAR FLAGS DE DISPOSITIVO ───
  updateDeviceFlags();

  // ─── CÁLCULO DEL DELTA DE TIEMPO ───
  // dt = tiempo en segundos desde el último frame.
  // Se limita a 0.05 (50ms ≈ 20 FPS mínimo) para evitar que el juego
  // "salte" si el navegador se congela por un momento.
  const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
  lastTime = timestamp;

  ctx.clearRect(0, 0, LOGICAL_W, LOGICAL_H);

  if (!gs) { gs = createGameState(); }

  // ─── DETECCIÓN DE DISPOSITIVO (táctil/pantalla pequeña) ───
  if (typeof updateDeviceFlags === 'function') updateDeviceFlags();

  // ─── POLLING DEL MANDO (GAMEPAD) ───
  if (typeof updateGamepad === 'function') updateGamepad();

  // ─── [NEW] PORTRAIT PAUSE ───
  // En teléfonos en vertical: detiene el juego y muestra overlay.
  // Se reanuda automáticamente al girar a horizontal.
  const isPortraitBlock = showTouchControls && window.innerWidth < window.innerHeight && window.innerWidth < 768;

  // ─── MÁQUINA DE ESTADOS ───
  switch(gs.state) {
    // ─── PANTALLA DE TÍTULO ───
    // Muestra el menú principal con el título del juego.
    // Al presionar ENTER se llama a startGame(), que inicia la transición
    // a la pantalla de selección de mapa (gracias al wrapper de mapSystem.js).
    case 'title':
      if (isPortraitBlock) { drawOrientationOverlay(); break; }
      startMenuMusic();
      drawTitleScreen();

      if (_titleOptionsOpen) {
        // ─── OVERLAY DE OPCIONES EN TÍTULO ───
        if ((mouse.down || pointerPressed) && !gs._titleOptsClickBuf) {
          gs._titleOptsClickBuf = true;
          // MUSIC −
          if (_titleMusicMinus && mouse.x > _titleMusicMinus.x && mouse.x < _titleMusicMinus.x + _titleMusicMinus.w &&
              mouse.y > _titleMusicMinus.y && mouse.y < _titleMusicMinus.y + _titleMusicMinus.h) {
            if (typeof masterVolume !== 'undefined') { masterVolume = Math.max(0, Math.round((masterVolume - 0.1) * 10) / 10); updateBgMusicVolume(); updateMenuMusicVolume(); try { playTone(600, 600, 'sine', 0.08, 0.15); } catch(e){} }
          }
          // MUSIC +
          if (_titleMusicPlus && mouse.x > _titleMusicPlus.x && mouse.x < _titleMusicPlus.x + _titleMusicPlus.w &&
              mouse.y > _titleMusicPlus.y && mouse.y < _titleMusicPlus.y + _titleMusicPlus.h) {
            if (typeof masterVolume !== 'undefined') { masterVolume = Math.min(1, Math.round((masterVolume + 0.1) * 10) / 10); updateBgMusicVolume(); updateMenuMusicVolume(); try { playTone(800, 800, 'sine', 0.08, 0.15); } catch(e){} }
          }
          // SFX −
          if (_titleSfxMinus && mouse.x > _titleSfxMinus.x && mouse.x < _titleSfxMinus.x + _titleSfxMinus.w &&
              mouse.y > _titleSfxMinus.y && mouse.y < _titleSfxMinus.y + _titleSfxMinus.h) {
            if (typeof sfxVolume !== 'undefined') { sfxVolume = Math.max(0, Math.round((sfxVolume - 0.1) * 10) / 10); try { playTone(600, 600, 'sine', 0.08, 0.15); } catch(e){} }
          }
          // SFX +
          if (_titleSfxPlus && mouse.x > _titleSfxPlus.x && mouse.x < _titleSfxPlus.x + _titleSfxPlus.w &&
              mouse.y > _titleSfxPlus.y && mouse.y < _titleSfxPlus.y + _titleSfxPlus.h) {
            if (typeof sfxVolume !== 'undefined') { sfxVolume = Math.min(1, Math.round((sfxVolume + 0.1) * 10) / 10); try { playTone(800, 800, 'sine', 0.08, 0.15); } catch(e){} }
          }
          // BACK
          if (_titleOptsBack && mouse.x > _titleOptsBack.x && mouse.x < _titleOptsBack.x + _titleOptsBack.w &&
              mouse.y > _titleOptsBack.y && mouse.y < _titleOptsBack.y + _titleOptsBack.h) {
            _titleOptionsOpen = false;
          }
        }
        if (!mouse.down && !pointerPressed) gs._titleOptsClickBuf = false;
      } else {
        const titleClick = (mouse.down || pointerPressed) && _titlePlayBtn &&
          mouse.x > _titlePlayBtn.x && mouse.x < _titlePlayBtn.x + _titlePlayBtn.w &&
          mouse.y > _titlePlayBtn.y && mouse.y < _titlePlayBtn.y + _titlePlayBtn.h;
        if ((keys['Enter'] || keys['NumpadEnter']) || titleClick) {
          if (!gs._enterBuf) {
            gs._enterBuf = true;
            _titleOptionsOpen = false;
            startGame();
          }
        } else { gs._enterBuf = false; }

        // ─── BOTÓN OPCIONES EN TÍTULO ───
        if ((mouse.down || pointerPressed) && _titleOptsBtn &&
            mouse.x > _titleOptsBtn.x && mouse.x < _titleOptsBtn.x + _titleOptsBtn.w &&
            mouse.y > _titleOptsBtn.y && mouse.y < _titleOptsBtn.y + _titleOptsBtn.h) {
          _titleOptionsOpen = true;
        }
      }
      break;

    // ─── ESTADO DE JUEGO ACTIVO ───
    // Aquí ocurre toda la acción del juego:
    // - Manejo de pausa (ESC o clic en botón de pausa)
    // - Transición entre oleadas (waveComplete → nextWave)
    // - updatePlaying(): toda la lógica del juego (movimiento, IA, colisiones)
    // - renderGame(): dibujar todo en el canvas
    // - Evento meteorito (mapa 2, a partir de oleada 10)
    case 'playing':
      // ─── PORTRAIT BLOCK ───
      if (isPortraitBlock) {
        renderGame(gs);
        drawTransitionOverlay(gs);
        drawOrientationOverlay();
        break;
      }
      // ─── PAUSA CON TECLA P ───
      // Alterna entre pausado y reanudado; usa buffer para detectar flanco
      if (keys['KeyP'] && !gs._pauseBuf) {
        gs._pauseBuf = true;
        gs.paused = !gs.paused;
        if (!gs.paused) { gs._layoutEditorOpen = false; gs._pauseOptionsOpen = false; }
        if (!gs.paused && gs.player) gs.player.fireCooldown = 0.15;
      }
      if (!keys['KeyP'] && gs) gs._pauseBuf = false;
      // ─── PAUSA CON CLIC EN BOTÓN ───
      if ((mouse.down || pointerPressed) && !gs._pauseClickBuf && gs._pauseBtn) {
        const b = gs._pauseBtn;
        if (mouse.x >= b.x && mouse.x <= b.x + b.w && mouse.y >= b.y && mouse.y <= b.y + b.h) {
          gs._pauseClickBuf = true;
          gs.paused = !gs.paused;
          if (!gs.paused) { gs._layoutEditorOpen = false; gs._pauseOptionsOpen = false; }
          if (!gs.paused && gs.player) gs.player.fireCooldown = 0.15;
        }
      }
      if (!mouse.down && !pointerPressed && gs) gs._pauseClickBuf = false;
      // Si está pausado, solo renderiza (sin actualizar) y muestra el overlay
      if (gs.paused) {
        renderGame(gs);

        // ─── LAYOUT EDITOR ───
        if (gs._layoutEditorOpen) {
          drawLayoutEditor(gs);
          if ((mouse.down || pointerPressed) && !gs._layoutClickBuf) {
            gs._layoutClickBuf = true;
            const idx = gs._layoutEditIdx || 0;
            const bp = getBtnProps(idx);

            // ─── SELECTOR DE BOTÓN ───
            for (let i = 0; i < 8; i++) {
              const b = gs['_layoutBtn_' + i];
              if (b && mouse.x > b.x && mouse.x < b.x + b.w && mouse.y > b.y && mouse.y < b.y + b.h) {
                gs._layoutEditIdx = i;
                break;
              }
            }

            // ─── FLECHA IZQUIERDA (X-5) ───
            if (gs._layoutArrowL && mouse.x > gs._layoutArrowL.x && mouse.x < gs._layoutArrowL.x + gs._layoutArrowL.w &&
                mouse.y > gs._layoutArrowL.y && mouse.y < gs._layoutArrowL.y + gs._layoutArrowL.h) {
              setBtnProps(idx, bp.x - 5, bp.y, bp.r);
            }
            // ─── FLECHA DERECHA (X+5) ───
            if (gs._layoutArrowR && mouse.x > gs._layoutArrowR.x && mouse.x < gs._layoutArrowR.x + gs._layoutArrowR.w &&
                mouse.y > gs._layoutArrowR.y && mouse.y < gs._layoutArrowR.y + gs._layoutArrowR.h) {
              setBtnProps(idx, bp.x + 5, bp.y, bp.r);
            }
            // ─── FLECHA ARRIBA (Y-5) ───
            if (gs._layoutArrowU && mouse.x > gs._layoutArrowU.x && mouse.x < gs._layoutArrowU.x + gs._layoutArrowU.w &&
                mouse.y > gs._layoutArrowU.y && mouse.y < gs._layoutArrowU.y + gs._layoutArrowU.h) {
              setBtnProps(idx, bp.x, bp.y - 5, bp.r);
            }
            // ─── FLECHA ABAJO (Y+5) ───
            if (gs._layoutArrowD && mouse.x > gs._layoutArrowD.x && mouse.x < gs._layoutArrowD.x + gs._layoutArrowD.w &&
                mouse.y > gs._layoutArrowD.y && mouse.y < gs._layoutArrowD.y + gs._layoutArrowD.h) {
              setBtnProps(idx, bp.x, bp.y + 5, bp.r);
            }
            // ─── RADIO − (r-2) ───
            if (gs._layoutRadiusMinus && mouse.x > gs._layoutRadiusMinus.x && mouse.x < gs._layoutRadiusMinus.x + gs._layoutRadiusMinus.w &&
                mouse.y > gs._layoutRadiusMinus.y && mouse.y < gs._layoutRadiusMinus.y + gs._layoutRadiusMinus.h) {
              setBtnProps(idx, bp.x, bp.y, Math.max(8, bp.r - 2));
            }
            // ─── RADIO + (r+2) ───
            if (gs._layoutRadiusPlus && mouse.x > gs._layoutRadiusPlus.x && mouse.x < gs._layoutRadiusPlus.x + gs._layoutRadiusPlus.w &&
                mouse.y > gs._layoutRadiusPlus.y && mouse.y < gs._layoutRadiusPlus.y + gs._layoutRadiusPlus.h) {
              setBtnProps(idx, bp.x, bp.y, Math.min(80, bp.r + 2));
            }
            // ─── SAVE ───
            if (gs._layoutSave && mouse.x > gs._layoutSave.x && mouse.x < gs._layoutSave.x + gs._layoutSave.w &&
                mouse.y > gs._layoutSave.y && mouse.y < gs._layoutSave.y + gs._layoutSave.h) {
              saveTouchLayout();
              gs._layoutEditorOpen = false;
              gs._pauseOptionsOpen = false;
            }
            // ─── RESET ───
            if (gs._layoutReset && mouse.x > gs._layoutReset.x && mouse.x < gs._layoutReset.x + gs._layoutReset.w &&
                mouse.y > gs._layoutReset.y && mouse.y < gs._layoutReset.y + gs._layoutReset.h) {
              resetTouchLayout();
            }
            // ─── BACK ───
            if (gs._layoutBack && mouse.x > gs._layoutBack.x && mouse.x < gs._layoutBack.x + gs._layoutBack.w &&
                mouse.y > gs._layoutBack.y && mouse.y < gs._layoutBack.y + gs._layoutBack.h) {
              gs._layoutEditorOpen = false;
            }
          }
          if (!mouse.down && !pointerPressed) gs._layoutClickBuf = false;
          break;
        }

        drawPauseOverlay(gs);

        // ─── CLIC EN MENÚ DE PAUSA ───
        if ((mouse.down || pointerPressed) && !gs._pauseClickBuf2) {
          gs._pauseClickBuf2 = true;
          let handled = false;

          // ─── BOTONES DE VOLUMEN (se verifican ANTES que opciones,
          //     porque están dentro del área del botón OPCIONES) ───
            if (gs._pauseOptionsOpen) {
            if (gs._pauseVolMinus &&
                mouse.x > gs._pauseVolMinus.x && mouse.x < gs._pauseVolMinus.x + gs._pauseVolMinus.w &&
                mouse.y > gs._pauseVolMinus.y && mouse.y < gs._pauseVolMinus.y + gs._pauseVolMinus.h) {
              if (typeof masterVolume !== 'undefined') { masterVolume = Math.max(0, Math.round((masterVolume - 0.1) * 10) / 10); if (typeof bgMusic !== 'undefined' && bgMusic) bgMusic.volume = 0.4 * masterVolume; try { playTone(600, 600, 'sine', 0.08, 0.15); } catch(e){} }
              handled = true;
            }
            if (!handled && gs._pauseVolPlus &&
                mouse.x > gs._pauseVolPlus.x && mouse.x < gs._pauseVolPlus.x + gs._pauseVolPlus.w &&
                mouse.y > gs._pauseVolPlus.y && mouse.y < gs._pauseVolPlus.y + gs._pauseVolPlus.h) {
              if (typeof masterVolume !== 'undefined') { masterVolume = Math.min(1, Math.round((masterVolume + 0.1) * 10) / 10); if (typeof bgMusic !== 'undefined' && bgMusic) bgMusic.volume = 0.4 * masterVolume; try { playTone(800, 800, 'sine', 0.08, 0.15); } catch(e){} }
              handled = true;
            }
            // ─── SFX − (dentro de opciones expandidas) ───
            if (!handled && gs._pauseSfxMinus &&
                mouse.x > gs._pauseSfxMinus.x && mouse.x < gs._pauseSfxMinus.x + gs._pauseSfxMinus.w &&
                mouse.y > gs._pauseSfxMinus.y && mouse.y < gs._pauseSfxMinus.y + gs._pauseSfxMinus.h) {
              if (typeof sfxVolume !== 'undefined') { sfxVolume = Math.max(0, Math.round((sfxVolume - 0.1) * 10) / 10); try { playTone(600, 600, 'sine', 0.08, 0.15); } catch(e){} }
              handled = true;
            }
            // ─── SFX + (dentro de opciones expandidas) ───
            if (!handled && gs._pauseSfxPlus &&
                mouse.x > gs._pauseSfxPlus.x && mouse.x < gs._pauseSfxPlus.x + gs._pauseSfxPlus.w &&
                mouse.y > gs._pauseSfxPlus.y && mouse.y < gs._pauseSfxPlus.y + gs._pauseSfxPlus.h) {
              if (typeof sfxVolume !== 'undefined') { sfxVolume = Math.min(1, Math.round((sfxVolume + 0.1) * 10) / 10); try { playTone(800, 800, 'sine', 0.08, 0.15); } catch(e){} }
              handled = true;
            }
            // ─── BUTTON LAYOUT (dentro de opciones expandidas) ───
            if (!handled && gs._pauseLayoutBtn &&
                mouse.x > gs._pauseLayoutBtn.x && mouse.x < gs._pauseLayoutBtn.x + gs._pauseLayoutBtn.w &&
                mouse.y > gs._pauseLayoutBtn.y && mouse.y < gs._pauseLayoutBtn.y + gs._pauseLayoutBtn.h) {
              gs._layoutEditorOpen = true;
              gs._layoutEditIdx = 0;
              handled = true;
            }
          }

          if (!handled) {
            const btns = gs._pauseBtns;
            if (btns) {
              // ─── REANUDAR ───
              if (mouse.x > btns.resume.x && mouse.x < btns.resume.x + btns.resume.w &&
                  mouse.y > btns.resume.y && mouse.y < btns.resume.y + btns.resume.h) {
                gs.paused = false;
                handled = true;
                if (gs.player) gs.player.fireCooldown = 0.15;
              }
              // ─── OPCIONES (EXPANDIR/CONTRAER) ───
              if (!handled &&
                  mouse.x > btns.options.x && mouse.x < btns.options.x + btns.options.w &&
                  mouse.y > btns.options.y && mouse.y < btns.options.y + btns.options.h) {
                gs._pauseOptionsOpen = !gs._pauseOptionsOpen;
                handled = true;
              }
              // ─── VOLVER AL MENÚ ───
              if (!handled &&
                  mouse.x > btns.menu.x && mouse.x < btns.menu.x + btns.menu.w &&
                  mouse.y > btns.menu.y && mouse.y < btns.menu.y + btns.menu.h) {
                if (typeof meteorEvent !== 'undefined' && meteorEvent.triggered) resetMeteorEvent();
                if (typeof _setMapConfirmed !== 'undefined') window._setMapConfirmed(false);
                stopBgMusic();
                gs = createGameState();
                gs.state = 'title';
                handled = true;
              }
            }
          }
        }
        if (!mouse.down && !pointerPressed) gs._pauseClickBuf2 = false;

        break;
      }
      // ─── OLEADA COMPLETADA ───
      // Cuando el jugador mata a todos los zombies, se activa showWaveComplete.
      // Después de 6.5 segundos (waveCompleteTimer), avanza a la siguiente oleada.
      if (gs.showWaveComplete) {
        gs.waveCompleteTimer -= dt;
        if (gs.waveCompleteTimer <= 0) {
          gs.showWaveComplete = false;
          nextWave(gs);
        }
      }
      // ─── ACTUALIZAR Y RENDERIZAR ───
      updatePlaying(gs, dt);                               // Lógica del juego
      renderGame(gs);                                      // Dibujar todo

      // ─── TEXTO DE OLEADA COMPLETADA ───
      // Cartel "WAVE X COMPLETE" con parpadeo y mensaje contextual
      if (gs.showWaveComplete) {
        let alpha = 1;
        if (gs.waveCompleteTimer < 1.5) {
          alpha = gs.waveCompleteTimer / 1.5;
        }
        const flash = Math.sin(Date.now() * 0.01) > 0;
        ctx.save();
        ctx.globalAlpha = Math.max(0, alpha);
        ctx.textAlign = 'center';
        ctx.font = 'bold 36px monospace';
        ctx.fillStyle = flash ? '#ff2020' : '#ffffff';
        ctx.fillText('WAVE ' + gs.wave + ' COMPLETE', LOGICAL_W / 2, 140);
        const msg = getWaveMessage(gs.wave);
        if (msg) {
          ctx.fillStyle = flash ? '#ff6666' : '#cccccc';
          ctx.font = 'italic 16px monospace';
          ctx.fillText(msg, LOGICAL_W / 2, 168);
        }
        ctx.restore();
        ctx.textAlign = 'left';
      }

      // ─── ANUNCIO DE NUEVA OLEADA ───
      // Texto emergente "WAVE X" que aparece al inicio de cada oleada
      if (gs.waveAnnouncement && gs.waveAnnouncement.active) {
        gs.waveAnnouncement.opacity -= dt / 2;
        if (gs.waveAnnouncement.opacity <= 0) {
          gs.waveAnnouncement.active = false;
        }
        drawWaveAnnouncement(gs);
      }

      // ─── EVENTO METEORITO (SOLO MAPA 2: THE MOVING BUS) ───
      // Evento cinemático que ocurre en la oleada 10 del mapa "The Moving Bus":
      // un meteorito atraviesa el cielo, impacta, y deja un ambiente de fuego
      // con partículas de ceniza (ash) y distorsión de calor (heat shimmer).
      if (gs.selectedMap === 2) {
        if (gs.wave >= 10 && !meteorEvent.triggered) {
          meteorEvent.triggered = true;
          meteorEvent.phase = 'incoming';
          meteorEvent.timer = 0;
          meteorEvent.meteorX = gs.camX + 1000 + Math.random() * 200;
          meteorEvent.meteorY = -120;
          meteorEvent.impactX = meteorEvent.meteorX + (Math.random() * 60 - 30);
          meteorEvent.impactY = 58;
          meteorEvent.meteorVY = 50;
          meteorEvent.meteorVX = (meteorEvent.impactX - meteorEvent.meteorX) / 3.5;
          initMeteorSounds();
        }
        updateMeteorEvent(gs, dt);
      }
      if (gs.selectedMap === 2 && meteorEvent.phase === 'burning') {
        drawAshParticles(gs);
        if (Math.floor(Date.now() / 400) % 3 === 0) drawHeatShimmer(gs);
      }
      break;

    // ─── ESTADO DE GAME OVER ───
    // Pantalla de derrota cuando el jugador muere.
    // Opciones: presionar R para reiniciar, o hacer clic en "Play Again"
    // (reinicia) o "Menu" (vuelve a la pantalla de título).
    case 'gameover':
      if (isPortraitBlock) { drawOrientationOverlay(); break; }
      renderGame(gs);
      drawGameOverScreen(gs);
      // ─── REINICIAR CON TECLA R ───
      if (keys['KeyR'] && !gs._rBuf) {
        gs._rBuf = true;
        if (meteorEvent.triggered) resetMeteorEvent();
        stopBgMusic();
        gs = createGameState();
        startGame();
      }
      if (!keys['KeyR']) { if(gs) gs._rBuf = false; }
      // ─── BOTONES: "PLAY AGAIN" Y "MENU" ───
      const bx  = LOGICAL_W/2-140, by =310, bw=280, bh=44;
      const bx2 = LOGICAL_W/2-140, by2=368, bw2=280, bh2=44;
      if ((mouse.down || pointerPressed) && !gs._clickBuf) {
        if (mouse.x>bx && mouse.x<bx+bw && mouse.y>by && mouse.y<by+bh) {
          gs._clickBuf = true;
          if (meteorEvent.triggered) resetMeteorEvent();
          stopBgMusic();
          gs = createGameState();
          startGame();
        } else if (mouse.x>bx2 && mouse.x<bx2+bw2 && mouse.y>by2 && mouse.y<by2+bh2) {
          gs._clickBuf = true;
          if (meteorEvent.triggered) resetMeteorEvent();
          window._setMapConfirmed(false);
          stopBgMusic();
          gs = createGameState();
          gs.state = 'title';
        }
      }
      if (!mouse.down && !pointerPressed && gs) gs._clickBuf = false;
      break;
  }

  // ─── RESET POINTER FLAG ───
  pointerPressed = false;
}

// ─── INICIAR EL BUCLE PRINCIPAL ───
// La primera llamada a requestAnimationFrame arranca el loop infinito del juego.
requestAnimationFrame(loop);
