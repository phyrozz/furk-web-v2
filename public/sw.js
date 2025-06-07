// public/sw.js
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Installed');
});

self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activated');
});
