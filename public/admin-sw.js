/**
 * Pratyeksha Master Admin — service worker
 * Registered with { scope: '/master-admin' } so it never touches the owner
 * app, customer menu, or kitchen view elsewhere in the project.
 *
 * Deliberately minimal — exists to satisfy the browser's "installability"
 * requirement, not to cache client data. Client lists, revenue figures,
 * etc. should always come straight from the network.
 */
const CACHE_NAME = 'pratyeksha-admin-shell-v1';
const SHELL_ASSETS = [
  '/admin-pwa/icon-192.png',
  '/admin-pwa/icon-512.png',
  '/admin-manifest.webmanifest',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS).catch(() => {})).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

const OFFLINE_HTML = `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Offline — Pratyeksha Admin</title>
<style>
  html,body{margin:0;height:100%;background:#060606;color:#fff;font-family:-apple-system,Poppins,sans-serif;
    display:flex;align-items:center;justify-content:center;text-align:center;padding:24px}
  .card{max-width:340px}
  h1{font-size:18px;margin:0 0 8px}
  p{font-size:13px;color:rgba(255,255,255,0.55);line-height:1.6;margin:0}
  .dot{width:10px;height:10px;border-radius:50%;background:#d3bfa2;margin:0 auto 16px}
</style></head>
<body><div class="card"><div class="dot"></div>
<h1>You're offline</h1>
<p>The admin panel needs a connection to load client data. Reconnect and reopen it.</p>
</div></body></html>`;

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  if (SHELL_ASSETS.some((a) => url.pathname === a)) {
    event.respondWith(caches.match(request).then((cached) => cached || fetch(request)));
    return;
  }
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => new Response(OFFLINE_HTML, { headers: { 'Content-Type': 'text/html' } })));
  }
});
