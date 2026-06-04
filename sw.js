// sw.js — Service Worker Scan2BIM v2 (corrigé)
const CACHE_NAME = 'scan2bim-v3';

// Seuls les assets LOCAUX sont mis en cache
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      // FIX : on filtre strictement les URLs locales uniquement
      var safeAssets = STATIC_ASSETS.filter(function(url) {
        return url.startsWith('./') || url.startsWith('/');
      });
      return Promise.all(
        safeAssets.map(function(url) {
          return cache.add(url).catch(function(err) {
            console.warn('[SW] Asset non mis en cache :', url, err);
          });
        })
      );
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k) { return caches.delete(k); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function(event) {
  var url = event.request.url;

  // FIX PRINCIPAL : ignorer tout ce qui n'est pas http/https
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return; // laisser passer sans intercepter
  }

  // Ne jamais mettre en cache les appels Google Apps Script
  if (url.includes('script.google.com') || url.includes('googleapis.com')) {
    event.respondWith(
      fetch(event.request).catch(function() {
        return new Response(
          JSON.stringify({ error: 'Hors-ligne' }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        );
      })
    );
    return;
  }

  // Assets locaux : Cache-First
  event.respondWith(
    caches.match(event.request).then(function(cached) {
      if (cached) return cached;
      return fetch(event.request).then(function(response) {
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response;
        }
        var clone = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(event.request, clone);
        });
        return response;
      }).catch(function() {
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
        return new Response('Non disponible hors-ligne.', { status: 503 });
      });
    })
  );
});
