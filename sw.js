// sw.js - Service Worker Offline de Produção

const CACHE_NAME = 'consultoria-ce-v2';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './app.js',
  './manifest.json'
];

// Instalação do SW e armazenamento em cache dos ficheiros vitais
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

// Limpeza de caches antigas ao atualizar versões
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Estratégia de Rede: Abre primeiro a Cache (Offline), se falhar ou não existir, vai buscar à Rede
self.addEventListener('fetch', event => {
  // Ignorar pedidos POST para o Google Apps Script (não podem ser cacheados)
  if (event.request.method === 'POST') return;

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request);
      })
  );
});