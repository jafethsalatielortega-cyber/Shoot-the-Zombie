// ─── INSTALACIÓN PWA ───
// Convierte el juego en una aplicación instalable sin afectar su lógica.
(function () {
  'use strict';

  const panel = document.getElementById('pwaInstall');
  const installButton = document.getElementById('pwaInstallButton');
  const closeButton = document.getElementById('pwaInstallClose');
  const helpText = document.getElementById('pwaInstallText');
  let deferredInstallPrompt = null;

  const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    window.navigator.standalone === true;
  const ua = navigator.userAgent || '';
  const isAppleMobile = /iPhone|iPad|iPod/i.test(ua) ||
    (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1);
  const isMobile = /Android|iPhone|iPad|iPod|Mobile|Tablet/i.test(ua) ||
    (window.matchMedia('(pointer: coarse)').matches && !window.matchMedia('(hover: hover) and (pointer: fine)').matches);

  function showPanel(mode) {
    if (!panel || isStandalone || !isMobile || sessionStorage.getItem('pwa-install-dismissed')) return;
    panel.hidden = false;
    if (mode === 'ios') {
      helpText.textContent = 'Para abrirlo sin barras: toca Compartir y luego “Añadir a pantalla de inicio”.';
      installButton.textContent = 'Entendido';
    } else {
      helpText.textContent = 'Juega como una aplicación: pantalla completa, sin barras del navegador.';
      installButton.textContent = 'Instalar aplicación';
    }
  }

  function hidePanel() {
    if (panel) panel.hidden = true;
  }

  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('./service-worker.js', { scope: './' }).catch(function () {});
    });
  }

  window.addEventListener('beforeinstallprompt', function (event) {
    event.preventDefault();
    deferredInstallPrompt = event;
    showPanel('native');
  });

  window.addEventListener('appinstalled', function () {
    deferredInstallPrompt = null;
    hidePanel();
  });

  if (installButton) {
    installButton.addEventListener('click', async function () {
      if (isAppleMobile && !deferredInstallPrompt) {
        sessionStorage.setItem('pwa-install-dismissed', '1');
        hidePanel();
        return;
      }
      if (!deferredInstallPrompt) return;
      const prompt = deferredInstallPrompt;
      deferredInstallPrompt = null;
      try {
        await prompt.prompt();
        await prompt.userChoice;
      } catch (_) {}
      hidePanel();
    });
  }

  if (closeButton) {
    closeButton.addEventListener('click', function () {
      sessionStorage.setItem('pwa-install-dismissed', '1');
      hidePanel();
    });
  }

  // Safari no expone beforeinstallprompt; muestra sus instrucciones propias.
  if (isAppleMobile && !isStandalone) {
    window.addEventListener('load', function () { showPanel('ios'); });
  }
})();
