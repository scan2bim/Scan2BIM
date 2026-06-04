// sw.js — Service Worker Scan2BIM v4 (minimal - sans cache)
const CACHE_NAME = 'scan2bim-v4';

// Installation simple — pas de mise en cache des assets
self.addEventListener('install', function(event) {
  self.skipWaiting();
});

// Activation — supprime tous les anciens caches
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.map(function(k) { return caches.delete(k); }));
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// Fetch — laisse TOUT passer sans interception
// Aucune mise en cache, aucun blocage
self.addEventListener('fetch', function(event) {
  // On ne fait rien — le navigateur gère normalement
  return;
});
