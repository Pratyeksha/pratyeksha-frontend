/* Request optimiser for the shared axios instance — installed once from main.jsx.
 *
 *  1. In-flight de-duplication: when several components ask for the same GET at the same moment (the subscription
 *     status, the tenant record, a menu refresh fired by both a timer and a socket event, …) only one request goes
 *     over the network; every caller still receives its own response object and parses its own copy of the body.
 *  2. A short-lived cache for a few public, rarely-changing GETs (restaurant directory, offers, push key), so going
 *     back to the home screen is instant instead of refetching. Never used for requests that carry a login token.
 *  3. Any write (POST/PUT/PATCH/DELETE) empties that cache.
 *
 * Requests with an AbortSignal / cancel token, blob or stream responses, and progress callbacks are left untouched.
 */
import axios from 'axios';

const MAX_ENTRIES = 40;
// [pattern, ttl ms] — public, read-only endpoints only.
const CACHEABLE = [
  [/\/tenants\/active$/, 45_000],
  [/\/tenants\/menu-index$/, 45_000],
  [/\/offers\/current\/all$/, 45_000],
  [/\/waitlist\/vapid-public-key$/, 60 * 60_000],
];

const inflight = new Map(); // key -> Promise<rawResponse>
const cache = new Map();    // key -> { exp, res }

function header(config, name) {
  const h = config.headers;
  if (!h) return '';
  try { return (typeof h.get === 'function' ? h.get(name) : h[name] || h[name.toLowerCase()]) || ''; } catch { return ''; }
}

function ttlFor(config, uri) {
  if (header(config, 'Authorization')) return 0;
  const path = uri.split('?')[0];
  for (const [re, ttl] of CACHEABLE) if (re.test(path)) return ttl;
  return 0;
}

const forConsumer = (res, config) => ({ ...res, config });

export function installRequestOptimizer() {
  if (typeof window === 'undefined' || window.__pxReqOptimizer) return;
  window.__pxReqOptimizer = true;
  const base = axios.getAdapter(axios.defaults.adapter);

  axios.defaults.adapter = (config) => {
    const method = String(config.method || 'get').toLowerCase();
    if (method !== 'get') {
      cache.clear(); // a write may have changed what the cached reads would return
      return base(config);
    }
    const rt = config.responseType;
    if (config.signal || config.cancelToken || config.onDownloadProgress || (rt && rt !== 'json' && rt !== 'text')) return base(config);

    let uri, key;
    try { uri = axios.getUri(config); key = `${uri}|${header(config, 'Authorization')}`; } catch { return base(config); }

    const hit = cache.get(key);
    if (hit) {
      if (hit.exp > Date.now()) return Promise.resolve(forConsumer(hit.res, config));
      cache.delete(key);
    }
    const pending = inflight.get(key);
    if (pending) return pending.then((res) => forConsumer(res, config));

    const ttl = ttlFor(config, uri);
    const p = base(config).then(
      (res) => {
        inflight.delete(key);
        if (ttl) {
          if (cache.size >= MAX_ENTRIES) cache.delete(cache.keys().next().value);
          cache.set(key, { exp: Date.now() + ttl, res });
        }
        return res;
      },
      (err) => { inflight.delete(key); throw err; }
    );
    inflight.set(key, p);
    // Every caller (the first one too) gets its own shallow copy: axios later replaces `response.data` on the object it
    // receives, so handing out the shared original would leak one caller's parsed body to the others.
    return p.then((res) => forConsumer(res, config));
  };
}
