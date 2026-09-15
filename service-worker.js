const CACHE_NAME = 'shoot-the-zombie-v21';
const APP_SHELL = [
  './', './index.html', './CSS/base.css', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png',
  './JS/constants/gameConstants.js', './JS/constants/platforms.js',
  './JS/constants/props.js', './JS/constants/weapons.js',
  './JS/core/canvas.js', './JS/core/audio.js', './JS/core/input.js', './JS/core/pwa.js',
  './JS/entities/Player.js', './JS/entities/Zombie.js', './JS/entities/BossZombie.js',
  './JS/entities/ElectricianZombie.js', './JS/entities/Bullet.js', './JS/entities/Pickup.js',
  './JS/systems/particles.js', './JS/systems/floatingText.js', './JS/systems/physics.js',
  './JS/draw/props.js', './JS/draw/map.js', './JS/draw/player.js', './JS/draw/zombies.js',
  './JS/draw/boss.js', './JS/draw/hud.js', './JS/draw/muzzleFlash.js',
  './JS/draw/pickups.js', './JS/draw/bullets.js', './JS/draw/screens.js',
  './JS/managers/gameState.js', './JS/managers/waveManager.js',
  './JS/managers/gameLoop.js', './JS/managers/renderer.js',
  './JS/main.js', './JS/maps/mapSystem.js', './JS/maps/mapBus.js'
];

self.addEventListener('install', function (event) {
  event.waitUntil(caches.open(CACHE_NAME).then(function (cache) {
    return cache.addAll(APP_SHELL);
  }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (event) {
  event.waitUntil(caches.keys().then(function (names) {
    return Promise.all(names.filter(function (name) {
      return name !== CACHE_NAME;
    }).map(function (name) { return caches.delete(name); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (event) {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then(function (response) {
      if (response.status === 200) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(function (cache) { cache.put('./index.html', copy); });
      }
      return response;
    }).catch(function () { return caches.match('./index.html'); }));
    return;
  }

  event.respondWith(caches.match(request).then(function (cached) {
    const network = fetch(request).then(function (response) {
      if (response.status === 200) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(function (cache) { cache.put(request, copy); });
      }
      return response;
    }).catch(function () { return cached; });
    return cached || network;
  }));
});
