// ═══════════════════════════════════════════════════════════════
// PRATYEKSHA — Customer menu offline cache
// Place this file at the STATIC ROOT of the frontend build
// (Vite: /public/sw.js → deploys to https://yourapp.com/sw.js)
// ═══════════════════════════════════════════════════════════════

const CACHE_NAME = 'pratyeksha-menu-v2';
const API_HOST = 'pratyeksha-backend.onrender.com';

// Only these read-only, "browse the menu" endpoints are cached.
// Anything that places an order, updates state, or is tenant-write
// stays network-only — we never want a stale/offline write to look
// like it succeeded.
const CACHEABLE_PATH_PATTERNS = [
  /\/api\/tenant\/[^/]+$/,
  /\/api\/categories\/[^/]+$/,
  /\/api\/menu\/[^/]+$/,
  /\/api\/menu\/engineered\/[^/]+$/,
  /\/api\/menu-with-categories\/[^/]+$/,
  /\/api\/extra-items\/[^/]+$/,
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

function isCacheableMenuRequest(request) {
  if (request.method !== 'GET') return false;
  let url;
  try { url = new URL(request.url); } catch { return false; }
  if (url.hostname !== API_HOST) return false;
  return CACHEABLE_PATH_PATTERNS.some((re) => re.test(url.pathname));
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  // Let Vercel/Render handle SPA navigations normally; this worker only adds
  // menu caching and push handling so existing API/UI behaviour stays intact.
  if (!isCacheableMenuRequest(request)) return; // let everything else pass through untouched

  // Network-first: inventory/menu/availability can change at any moment.
  // Never show an old cached stock state while the network is available.
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      try {
        const fresh = await fetch(request, { cache: 'no-store' });
        if (fresh && fresh.ok) await cache.put(request, fresh.clone());
        return fresh;
      } catch {
        const cached = await cache.match(request);
        if (cached) return cached;
        return new Response(
          JSON.stringify({ offline: true, error: 'No cached menu available yet.' }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        );
      }
    })
  );
});

self.addEventListener('push', function(event) {
  const data = event.data ? event.data.json() : {};
  event.waitUntil(
    self.registration.showNotification(data.title || 'Pratyeksha', {
      body: data.body || '',
      icon: data.icon || '/pratyeksha-logo.png',
      badge: data.badge || '/pratyeksha-logo.png',
      vibrate: data.vibrate || [200, 100, 200],
      data: data.data || {}
    })
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  // Push notifications may wake a completely closed PWA, but they must never
  // turn into an implicit table-ordering session. The backend supplies a safe
  // customer-home URL, never a QR/table URL.
  const rawUrl = event.notification.data?.url || '/';
  let url = '/';
  try {
    const parsed = new URL(rawUrl, self.location.origin);
    url = parsed.origin === self.location.origin ? `${parsed.pathname}${parsed.search}` : '/';
  } catch {}
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if ('navigate' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
