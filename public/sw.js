// ═══════════════════════════════════════════════════════════════
// PRATYEKSHA — Customer menu offline cache
// Place this file at the STATIC ROOT of the frontend build
// (Vite: /public/sw.js → deploys to https://yourapp.com/sw.js)
// ═══════════════════════════════════════════════════════════════

const CACHE_NAME = 'pratyeksha-menu-v1';
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
  if (!isCacheableMenuRequest(request)) return; // let everything else pass through untouched

  // Stale-while-revalidate: answer instantly from cache if we have it,
  // and refresh the cache in the background for next time.
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(request);

      const networkFetch = fetch(request)
        .then((response) => {
          if (response && response.ok) cache.put(request, response.clone());
          return response;
        })
        .catch(() => null);

      if (cached) {
        // Kick off the background refresh but don't wait on it.
        networkFetch.catch(() => {});
        return cached;
      }

      const fresh = await networkFetch;
      if (fresh) return fresh;

      // Truly offline with nothing cached yet for this tenant.
      return new Response(
        JSON.stringify({ offline: true, error: 'No cached menu available yet.' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    })
  );
});

self.addEventListener('push', function(event) {
  const data = event.data ? event.data.json() : {};
  event.waitUntil(
    self.registration.showNotification(data.title || 'Pratyeksha', {
      body: data.body || '',
      icon: data.icon || '/logo.png',
      badge: data.badge || '/logo.png',
      vibrate: data.vibrate || [200, 100, 200],
      data: data.data || {}
    })
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if (client.url.includes(url) && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});