// sw.js — Service Worker Scan2BIM FINAL
// Stratégie : minimal — ne bloque RIEN, supprime tous les anciens caches

const CACHE_NAME = 'scan2bim-v5';

self.addEventListener('install', function(event) {
  // Activation immédiate sans attendre
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  // Supprimer TOUS les anciens caches sans exception
  event.waitUntil(
    caches.keys()
      .then(function(keys) {
        return Promise.all(keys.map(function(k) {
          console.log('[SW] Suppression cache:', k);
          return caches.delete(k);
        }));
      })
      .then(function() {
        return self.clients.claim();
      })
  );
});

// Aucune interception fetch — le navigateur gère tout normalement
// Ceci évite tout blocage CORS ou erreur 503
self.addEventListener('fetch', function() {
  return;
});
