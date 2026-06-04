// ============================================================
// sw.js — Service Worker Scan2BIM
// Stratégie : Cache-First pour les assets, Network-First pour l'API
// ============================================================

const CACHE_NAME = 'scan2bim-v1';
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  'https://cdn.jsdelivr.net/npm/sortablejs@latest/Sortable.min.js'
];

// ── Installation : mise en cache des assets statiques ──────────────
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(STATIC_ASSETS.map(url => new Request(url, { cache: 'reload' })))
        .catch(function(err) {
          console.warn('[SW] Certains assets non mis en cache :', err);
        });
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

// ── Activation : suppression des anciens caches ─────────────────────
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// ── Fetch : stratégie hybride ───────────────────────────────────────
self.addEventListener('fetch', function(event) {
  var url = event.request.url;

  // Requêtes API Google Apps Script → Network-First (pas de cache)
  if (url.includes('script.google.com')) {
    event.respondWith(
      fetch(event.request).catch(function() {
        return new Response(
          JSON.stringify({ error: 'Hors-ligne : impossible de contacter le serveur.' }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      })
    );
    return;
  }

  // Assets statiques → Cache-First avec fallback réseau
  event.respondWith(
    caches.match(event.request).then(function(cached) {
      if (cached) return cached;
      return fetch(event.request).then(function(response) {
        // On ne cache que les réponses valides
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response;
        }
        var clone = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(event.request, clone);
        });
        return response;
      }).catch(function() {
        // Fallback : retourner l'index.html si la ressource est introuvable hors-ligne
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
        return new Response('Ressource non disponible hors-ligne.', { status: 503 });
      });
    })
  );
});
