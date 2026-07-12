// 1. Nombre del caché con su versión. 
// ¡Si cambias 'v1' por 'v2', el navegador de todos tus usuarios borrará el caché viejo automáticamente!
const CACHE_NAME = 'predicciones-cache-v2'; 

const ASSETS = [
  './',
  './index.html',
  './css/estilos.css',
  './js/app.js',
  './manifest.json',
  './iconos/icono-192.png',
  './iconos/icono-512.png'
];

// Instalar el Service Worker y almacenar recursos estáticos en caché
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Guardando recursos estáticos en caché...');
        return cache.addAll(ASSETS);
      })
      .then(() => self.skipWaiting()) // Fuerza al SW nuevo a activarse de inmediato
  );
});

// Activar el Service Worker y LIMPIAR automáticamente cachés viejos
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log('Borrando caché antiguo detectado:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim()) // Toma control de las pestañas abiertas inmediatamente
  );
});

// Estrategia de Red Primero para los datos (API y JSON), y Caché Primero para diseño (CSS, JS)
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Si la petición es para la API de fútbol o para el archivo de partidos locales (datos dinámicos):
  if (url.hostname.includes('api-sports.io') || url.pathname.includes('partidos.json')) {
    e.respondWith(
      fetch(e.request)
        .catch(() => {
          // Si no hay internet, intentamos buscar el último dato que se haya guardado en caché
          return caches.match(e.request);
        })
    );
  } else {
    // Para el diseño, imágenes y estilos (recursos estáticos), usamos caché primero para velocidad
    e.respondWith(
      caches.match(e.request)
        .then(cachedResponse => {
          return cachedResponse || fetch(e.request);
        })
    );
  }
});
