const CACHE_NAME = 'predicciones-cache-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './css/estilos.css',
  './js/app.js',
  './datos/partidos.json',
  './manifest.json',
  './iconos/icono-192.png',
  './iconos/icono-512.png'
];

// Instalación: Guardar archivos esenciales en la caché
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Guardando recursos en caché...');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Activación: Limpiar cachés antiguas si las hay
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log('Eliminando caché vieja:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Estrategia: Buscar en caché primero; si no está, ir a la red
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        return cachedResponse || fetch(event.request);
      })
  );
});
