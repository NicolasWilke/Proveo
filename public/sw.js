// Service worker de Unísono: hace la app instalable y le da un arranque rápido.
// - Páginas: primero la red; sin conexión, la última versión guardada de la app.
// - /assets/*: llevan hash en el nombre, así que se guardan y se sirven desde caché.
// - Firebase, Google y cualquier otro dominio: no se tocan (los datos siempre van en vivo).
// v2: cambio de nombre e íconos a Unísono; subir el número obliga a renovar los íconos guardados.
const CACHE = 'proveo-v3';
const BASICOS = ['/', '/manifest.webmanifest', '/icono-unisono-192.png', '/icono-unisono-512.png', '/favicon-unisono.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(BASICOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((claves) => Promise.all(claves.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) { const copia = res.clone(); caches.open(CACHE).then((c) => c.put('/', copia)); }
          return res;
        })
        .catch(() => caches.match('/').then((r) => r || Response.error())),
    );
    return;
  }

  if (url.pathname.startsWith('/assets/')) {
    e.respondWith(
      caches.match(req).then((guardado) => guardado || fetch(req).then((res) => {
        if (res.ok) { const copia = res.clone(); caches.open(CACHE).then((c) => c.put(req, copia)); }
        return res;
      })),
    );
  }
});
