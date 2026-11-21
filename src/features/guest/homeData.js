import { useEffect, useState } from 'react';
import axios from 'axios';
import API_BASE_URL from '../../shared/lib/apiBase.js';

const CACHE_KEY = 'px_storefronts_v1';
const readJson = (k) => { try { return JSON.parse(sessionStorage.getItem(k) || 'null'); } catch { return null; } };

/* ── storefronts: what each owner chose to show about their place ── */
export function useStorefronts() {
  const [data, setData] = useState(() => { const c = readJson(CACHE_KEY); return c && Date.now() - c.t < 300000 ? c.d : { highlights: {}, stores: {} }; });
  useEffect(() => {
    const c = readJson(CACHE_KEY); if (c && Date.now() - c.t < 300000) return undefined;
    const ctl = new AbortController();
    axios.get(`${API_BASE_URL}/public/storefronts`, { timeout: 10000, signal: ctl.signal })
      .then((r) => { if (r.data && r.data.stores) { setData(r.data); try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), d: r.data })); } catch { /* private mode */ } } })
      .catch(() => {});
    return () => ctl.abort();
  }, []);
  return data;
}

export function usePlatformStats() {
  const [s, setS] = useState(null);
  useEffect(() => { const ctl = new AbortController(); axios.get(`${API_BASE_URL}/public/platform-stats`, { timeout: 8000, signal: ctl.signal }).then((r) => setS(r.data)).catch(() => {}); return () => ctl.abort(); }, []);
  return s;
}

/* ── anonymous, batched counters the owner sees in Storefront insights ── */
const q = []; let timer = null; let listening = false; const last = new Map();
const blocked = () => typeof window === 'undefined' || typeof fetch === 'undefined' || navigator.webdriver;
function flush() {
  if (timer) { clearTimeout(timer); timer = null; }
  while (q.length) { try { fetch(`${API_BASE_URL}/public/storefront-events`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ events: q.splice(0, 40) }), keepalive: true }).catch(() => {}); } catch { /* ignore */ } }
}
export function trackSF(tenantId, type, sec) {
  if (!tenantId || blocked()) return;
  const k = `${tenantId}|${type}`; const now = Date.now();
  if (type !== 'deal_view' && now - (last.get(k) || 0) < 1500) return;
  if (type === 'deal_view' && now - (last.get(k) || 0) < 60000) return;
  last.set(k, now); q.push({ tenantId, type, sec });
  if (!listening) { listening = true; window.addEventListener('pagehide', flush); document.addEventListener('visibilitychange', () => { if (document.hidden) flush(); }); }
  if (q.length >= 20) flush(); else if (!timer) timer = setTimeout(flush, 4000);
}

