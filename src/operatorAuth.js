// Operator / kitchen session. POST /api/admin/login now returns a signed token; the backend (operator-auth.js) checks it on
// /api/admin/*. This module attaches it to those calls - and only those, only on our own API - and tells the UI when the
// server says the session is missing or belongs to another restaurant.
import axios from 'axios';
import API_BASE_URL from './apiBase.js';

export const OPERATOR_KEY = 'pratyeksha_token';          // operator portal (written by its own login)
export const KITCHEN_KEY = 'pratyeksha_kitchen_token';   // kitchen screen (separate key: a kitchen sign-in must not half-log-in the portal)
export const OPERATOR_AUTH_EVENT = 'pratyeksha-operator-auth-required';

const read = (k) => { try { return localStorage.getItem(k) || ''; } catch { return ''; } };
const remove = (k) => { try { localStorage.removeItem(k); } catch { /* storage unavailable */ } };
export const setKitchenToken = (t) => { try { localStorage.setItem(KITCHEN_KEY, t); } catch { /* storage unavailable */ } };

const expiryMs = (t) => {
  try { return JSON.parse(atob(t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).exp * 1000 || 0; } catch { return 0; }
};
// Only a real, unexpired JWT counts. Old browsers still hold the previous opaque "tenantId.timestamp" value; it is skipped,
// never sent, so it cannot shadow a fresh login.
const usable = (t) => !!t && t.split('.').length === 3 && expiryMs(t) > Date.now() + 5000;

const onKitchenPage = () => typeof window !== 'undefined' && /^\/kitchen(\/|$)/.test(window.location.pathname || '');
export const getOperatorToken = () => {
  const order = onKitchenPage() ? [KITCHEN_KEY, OPERATOR_KEY] : [OPERATOR_KEY, KITCHEN_KEY];
  return order.map(read).find(usable) || '';
};
export const clearOperatorTokens = () => { remove(OPERATOR_KEY); remove(KITCHEN_KEY); };

// The operator token goes to our own API only, never to another host. Which routes actually check it is decided by the server
// (operator-auth.js: /api/admin/* plus a fixed list of operator routes such as /staff, /inventory, /offers, /waitlist/:id/...);
// every other route ignores it. These have their own login and must not receive it.
const OWN_AUTH_PREFIXES = ['/admin/login', '/admin/master', '/crm', '/owner'];
const wantsOperatorToken = (url) => typeof url === 'string'
  && url.startsWith(`${API_BASE_URL}/`)
  && !OWN_AUTH_PREFIXES.some((p) => url.startsWith(`${API_BASE_URL}${p}`));

if (typeof window !== 'undefined' && !window.__pratyekshaOperatorAuthInstalled) {
  window.__pratyekshaOperatorAuthInstalled = true;
  axios.interceptors.request.use((config) => {
    if (wantsOperatorToken(config.url)) {
      const t = getOperatorToken();
      // Never override an Authorization header a caller set itself (e.g. the owner app's own token).
      const already = config.headers && (typeof config.headers.get === 'function' ? config.headers.get('Authorization') : config.headers.Authorization);
      if (t && !already) { config.headers = config.headers || {}; config.headers.Authorization = `Bearer ${t}`; }
    }
    return config;
  });
  axios.interceptors.response.use((r) => r, (err) => {
    const code = err?.response?.data?.code;
    if (err?.response?.status === 401 && code === 'OPERATOR_AUTH_REQUIRED') {
      clearOperatorTokens();
      window.dispatchEvent(new Event(OPERATOR_AUTH_EVENT));
    } else if (err?.response?.status === 403 && code === 'TENANT_MISMATCH') {
      window.dispatchEvent(new Event(OPERATOR_AUTH_EVENT)); // signed in as another restaurant: ask for the right login, keep the other session
    }
    return Promise.reject(err);
  });
}
