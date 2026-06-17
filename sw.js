/* sw.js - SERVICE WORKER CASAS DO TEJO v3.0
   Garante a limpeza de cache antiga e suporte offline para novos ficheiros
*/

const CACHE_NAME = 'casas-do-tejo-v3'; // <-- Mudámos o nome para forçar a atualização!

// Lista de ficheiros que o telemóvel vai guardar para trabalhar em locais sem rede
const ASSETS = [
  './',
  './index.html',
  './app.js',
  './manifest.json',
  './anomalias_base_dados.json',
  './logo.png' // <-- Incluído o teu logotipo novo
];

// 1. INSTALAÇÃO: Guarda os ficheiros novos na cache
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('✓ Service Worker: A guardar novos ficheiros na cache');
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting()) // Obriga o novo service worker a ativar-se imediatamente
  );
});

// 2. ATIVAÇÃO: Procura caches antigas (v1, v2) e destrói-as para libertar os botões
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('🗑️ Service Worker: A eliminar cache antiga:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim()) // Assume o controlo das abas abertas de imediato
  );
});

// 3. INTERCEÇÃO (FETCH): Se houver rede, vai buscar ao GitHub. Se falhar, usa a cache local.
self.addEventListener('fetch', (e) => {
  e.respondWith(
    fetch(e.request).catch(() => {
      return caches.match(e.request);
    })
  );
});
