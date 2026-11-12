/**
 * Pratyeksha Owner App — service worker
 * Registered with { scope: '/owner/' } so it never touches the customer
 * menu, kitchen view, or master admin routes elsewhere in the project.
 *
 * Deliberately minimal: this exists mainly to satisfy the browser's
 * "installability" requirement (a fetch handler in an active SW). It does
 * NOT cache API responses — your revenue/inventory/staff data should
 * always come from the network, never from a stale cache. It only
 * precaches the tiny static app shell (icons + manifest) and shows a
 * friendly offline page if the network is down when the app is opened.
 */
const CACHE_NAME = 'pratyeksha-owner-shell-v1';
const SHELL_ASSETS = [
  '/pwa/icon-192.png',
  '/pwa/icon-512.png',
  '/owner-manifest.webmanifest',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(SHELL_ASSETS).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

const OFFLINE_HTML = `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Offline — Pratyeksha Owner</title>
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
<p>Pratyeksha Owner needs a connection to show live data. Reconnect and reopen the app.</p>
</div></body></html>`;

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return; // never intercept POST/PUT/PATCH (writes, exports)

  const url = new URL(request.url);

  // Static shell assets (icons, manifest): cache-first, network fallback.
  if (SHELL_ASSETS.some((a) => url.pathname === a)) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request))
    );
    return;
  }

  // Everything else (app pages, API calls, data): always go to the network.
  // Only show the offline fallback for page navigations when the network fails.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => new Response(OFFLINE_HTML, { headers: { 'Content-Type': 'text/html' } }))
    );
  }
  // Non-navigation GETs (API/JS/CSS) are left to the browser's default network handling.
});
