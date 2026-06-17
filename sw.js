/* sw.js - SERVICE WORKER CASAS DO TEJO v4.0 (FORÇAR RESET) */

const CACHE_NAME = 'casas-do-tejo-v4'; // <-- Mudámos para v4 para quebrar o ecrã em branco!

const ASSETS = [
  './',
  './index.html',
  './app.js',
  './manifest.json',
  './anomalias_base_dados.json',
  './logo.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    fetch(e.request).catch(() => {
      return caches.match(e.request);
    })
  );
});
