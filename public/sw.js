// ═══════════════════════════════════════════════════════════════
// PRATYEKSHA — Customer menu offline cache
// Place this file at the STATIC ROOT of the frontend build
// (Vite: /public/sw.js → deploys to https://yourapp.com/sw.js)
// ═══════════════════════════════════════════════════════════════

const CACHE_NAME = 'pratyeksha-menu-v6';
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
  // Host-agnostic: the API host differs per deployment (VITE_API_URL); every cacheable pattern below is an /api/ path, so the path check is enough.
  if (!url.pathname.startsWith('/api/')) return false;
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

// ── Push analytics: tell the backend what happened to a broadcast (delivered / clicked / dismissed) ──
function reportPushEvent(track, event) {
  if (!track || !track.tenantId || !track.kind || !track.refId) return Promise.resolve();
  const api = (track.api || ('https://' + API_HOST)).replace(/\/$/, '').replace(/\/api$/, '');
  return self.registration.pushManager.getSubscription()
    .catch(() => null)
    .then((sub) => fetch(api + '/api/push-track', {
      method: 'POST',
      keepalive: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenantId: track.tenantId, kind: track.kind, refId: track.refId, event, endpoint: sub ? sub.endpoint : '' })
    }))
    .catch(() => {});
}

self.addEventListener('push', function(event) {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { data = { body: event.data ? event.data.text() : '' }; } // a plain-text push used to throw and show nothing
  const track = data.data && data.data.track ? data.data.track : null;
  const options = {
    body: data.body || '',
    // Large icon: Pratyeksha logo (crossed spoon & fork) on the brand background. Always ours, never the wide wordmark.
    icon: '/notification-icon.png',
    // Small status-bar mark: crossed spoon & fork (browsers otherwise fall back to a generic bell).
    badge: '/notification-badge.png',
    // Creative picture for this kind of notification (or the operator-uploaded campaign / offer image).
    image: data.image || '/notif/default.jpg',
    vibrate: data.vibrate || [200, 100, 200],
    data: data.data || {}
  };
  // Same tag = the OS replaces a repeat of the same broadcast instead of stacking a second copy.
  if (data.tag) { options.tag = data.tag; options.renotify = false; }
  event.waitUntil(Promise.all([
    self.registration.showNotification(data.title || 'Pratyeksha', options),
    reportPushEvent(track, 'delivered')
  ]));
});

self.addEventListener('notificationclose', function(event) {
  const track = event.notification.data && event.notification.data.track;
  if (track) event.waitUntil(reportPushEvent(track, 'dismissed'));
});

self.addEventListener('notificationclick', function(event) {
  const clickTrack = event.notification.data && event.notification.data.track;
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
  if (clickTrack) event.waitUntil(reportPushEvent(clickTrack, 'clicked'));
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const client of list) {
        // Same origin hosts the operator/owner/kitchen/admin apps too: never navigate their tabs to a customer page.
        let cp = '/'; try { cp = new URL(client.url).pathname; } catch {}
        if (/^\/(owner|operator|kitchen|master-admin|admin)/.test(cp)) continue;
        if ('navigate' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
